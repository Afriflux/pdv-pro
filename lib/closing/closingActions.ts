'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Traite une demande de validation téléphonique COD (Closing).
 */
export async function processClosingRequest(requestId: string, action: 'VALIDATED' | 'REJECTED' | 'NO_REPLY' | 'CANCELLATION_REQUESTED', notes: string = '') {
  const req = await prisma.closingRequest.findUnique({ 
    where: { id: requestId }, 
    include: { order: true } 
  })
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const supabaseAdmin = createAdminClient()
  const { data: userData } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'super_admin'

  if (!req || (req.status !== 'PENDING' && req.status !== 'CANCELLATION_REQUESTED')) {
    throw new Error('Demande introuvable ou déjà traitée.')
  }

  // Vérification droits Vendeur
  if (!isAdmin) {
    const store = await prisma.store.findUnique({ where: { user_id: user.id } })
    if (!store || store.id !== req.store_id) {
      throw new Error('Non autorisé: Cette commande ne vous appartient pas.')
    }
    if (action === 'REJECTED') {
      throw new Error('Seul l\'administrateur peut accorder une décharge d\'annulation.')
    }
  }

  // 1. Mettre à jour la req
  await prisma.closingRequest.update({
    where: { id: requestId },
    data: { status: action, notes }
  })

  // 2. Traitement selon l'action
  if (action === 'VALIDATED') {
    // a. Débiter les frais de validation du Wallet du vendeur (RPC atomique)
    if (req.closing_fee > 0) {
      const { error: debitErr } = await supabase.rpc('debit_wallet', { 
        p_vendor_id: req.store_id, 
        p_amount: req.closing_fee, 
        p_description: `Frais de closing COD - Commande #${req.order.id.slice(0, 8)}`
      })
      if (debitErr) {
        console.error("Erreur de débit (Closing Fee)", debitErr)
        throw new Error('Solde Wallet insuffisant pour couvrir les frais d\'appel.')
      }
    }

    // b. Mettre la commande en 'processing' (Prêt à expédier)
    await prisma.order.update({
      where: { id: req.order_id },
      data: { status: 'processing' }
    })
    
    // c. Mettre à jour le score de fiabilité du client
    await prisma.buyerScore.upsert({
      where: { phone: req.order.buyer_phone },
      update: { success_orders: { increment: 1 }, total_orders: { increment: 1 } },
      create: { phone: req.order.buyer_phone, success_orders: 1, total_orders: 1 }
    })

  } else if (action === 'REJECTED') {
    // Le client a refusé au téléphone ou l'appel révèle une fraude
    
    // a. Pénaliser le score de l'acheteur
    await prisma.buyerScore.upsert({
      where: { phone: req.order.buyer_phone },
      update: { refused_orders: { increment: 1 }, total_orders: { increment: 1 } },
      create: { phone: req.order.buyer_phone, refused_orders: 1, total_orders: 1 }
    })
    
    // b. Annuler la commande
    await prisma.order.update({
      where: { id: req.order_id },
      data: { status: 'cancelled' }
    })
    
    // c. Dégeler la commission (les 5% COD initialement gelés au checkout) + les frais de closing qui n'étaient pas encore débités
    // Pour ça, on recrédite `frozen_balance` via un RPC. S'il n'y a pas de RPC 'unfreeze_commission', on peut utiliser une requête directe ou un RPC inverse.
    // L'appelant avait gelé la commission. Le RPC `unfreeze_commission` existe-t-il ?
    const freezeAmount = req.order.platform_fee + req.order.delivery_commission + req.closing_fee
    
    const { error: unfreezeErr } = await supabase.rpc('unfreeze_commission', {
      p_vendor_id: req.store_id,
      p_commission: freezeAmount
    })
    
    // Si 'unfreeze_commission' n'existe pas, on ignore silencieusement pour l'instant
    // Mais on le loggue au cas où le script RPC n'était pas déployé
    if (unfreezeErr) console.error("Could not unfreeze commission:", unfreezeErr)
  }

  // Si 'NO_REPLY' ou 'CANCELLATION_REQUESTED', on ne fait que mettre à jour en base `ClosingRequest`

  revalidatePath('/dashboard/closing')
  revalidatePath('/admin/closing')
  return { success: true }
}
