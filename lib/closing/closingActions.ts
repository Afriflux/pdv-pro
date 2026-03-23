'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type ClosingAction = 'VALIDATED' | 'REJECTED' | 'NO_REPLY' | 'CANCELLATION_REQUESTED' | 'SCHEDULED' | 'NOTE_ADDED'

/**
 * Traite une demande de validation téléphonique COD (Closing) et historise l'action.
 */
export async function processClosingRequest(
  requestId: string, 
  action: ClosingAction, 
  notes: string = '', 
  scheduledAt?: Date | null
) {
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
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'super_admin'
  const agentName = userData?.full_name || userData?.email || 'Agent / Vendeur'

  if (!req) {
    throw new Error('Demande introuvable.')
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

  const previousStatus = req.status

  // Si c'est juste un ajout de note, on ne change pas le statut
  const newStatus = action === 'NOTE_ADDED' ? req.status : action

  // Nettoyage des locks quand on traite l'appel
  const unlockData = ['VALIDATED', 'REJECTED', 'CANCELLATION_REQUESTED', 'NO_REPLY', 'SCHEDULED'].includes(action) 
    ? { locked_by: null, locked_until: null } : {}

  // 1. Traitement direct sur la commande et scores (si validation/rejet)
  if (action === 'VALIDATED' && req.status !== 'VALIDATED') {
    // a. Expédition
    await prisma.order.update({
      where: { id: req.order_id },
      data: { status: 'processing' }
    })
    
    // c. Score acheteur
    await prisma.buyerScore.upsert({
      where: { phone: req.order.buyer_phone },
      update: { success_orders: { increment: 1 }, total_orders: { increment: 1 } },
      create: { phone: req.order.buyer_phone, success_orders: 1, total_orders: 1 }
    })

  } else if (action === 'REJECTED' && req.status !== 'REJECTED') {
    // La commande était annulée ou fausse
    await prisma.buyerScore.upsert({
      where: { phone: req.order.buyer_phone },
      update: { refused_orders: { increment: 1 }, total_orders: { increment: 1 } },
      create: { phone: req.order.buyer_phone, refused_orders: 1, total_orders: 1 }
    })
    
    await prisma.order.update({
      where: { id: req.order_id },
      data: { status: 'cancelled' }
    })
    
    // Dégeler la commission
    const freezeAmount = req.order.platform_fee + req.order.delivery_commission + req.closing_fee
    await supabase.rpc('unfreeze_commission', {
      p_vendor_id: req.store_id,
      p_commission: freezeAmount
    })
  }

  // 2. Mettre à jour la demande MAINTENANT que tout a réussi
  await prisma.closingRequest.update({
    where: { id: requestId },
    data: { 
      status: newStatus,
      notes: notes ? (req.notes ? `${req.notes}\n---\n${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}: ${notes}` : notes) : req.notes,
      scheduled_at: scheduledAt !== undefined ? scheduledAt : req.scheduled_at,
      call_attempts: ['NO_REPLY', 'REJECTED', 'VALIDATED'].includes(action) ? { increment: 1 } : undefined,
      ...unlockData
    }
  })

  // 3. Enregistrer dans l'historique de la demande
  await prisma.closingRequestHistory.create({
    data: {
      closing_request_id: requestId,
      action: action,
      previous_status: previousStatus,
      new_status: newStatus,
      details: notes || null,
      agent_name: agentName
    }
  })

  revalidatePath('/dashboard/closing')
  revalidatePath('/admin/closing')
  return { success: true }
}

/**
 * Assigne une commande à l'agent courant pour éviter les conflits
 */
export async function lockClosingRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const supabaseAdmin = createAdminClient()
  const { data: userData } = await supabaseAdmin.from('User').select('full_name, email').eq('id', user.id).single()
  const agentName = userData?.full_name || userData?.email || 'Un agent'

  await prisma.closingRequest.update({
    where: { id: requestId },
    data: { 
      locked_by: agentName,
      locked_until: new Date(Date.now() + 5 * 60 * 1000) // Verrouillé pour 5 mins
    }
  })
  revalidatePath('/dashboard/closing')
}

export async function seedCODData() {
  const store_id = "de848551-ded9-4284-a4e7-3af349cc3f0f" // Identifiant de test récurrent
  
  const product = await prisma.product.create({
    data: {
      store_id,
      name: "Montre Casio Gold Élite",
      description: "Montre haut de gamme de test",
      price: 15000,
      type: "physical",
      images: [],
    }
  })

  // 1.5. Créditer le Wallet pour pouvoir payer les frais de closing
  await prisma.wallet.upsert({
    where: { vendor_id: store_id },
    update: { balance: { increment: 15000 } },
    create: { vendor_id: store_id, balance: 15000 }
  })

  // 2. Créer 3 commandes factices
  const orderData = [
    { buyer_name: "Amadou Diallo", buyer_phone: "+221771234567", payment_method: "cod", status: "confirmed" as any, subtotal: 15000, platform_fee: 1500, vendor_amount: 13500, total: 15000, delivery_address: "Dakar, Plateau" },
    { buyer_name: "Fatou Sow", buyer_phone: "+221761234567", payment_method: "cod", status: "confirmed" as any, subtotal: 30000, platform_fee: 3000, vendor_amount: 27000, total: 30000, delivery_address: "Pikine Route des Niayes" },
    { buyer_name: "Moussa Ndiaye", buyer_phone: "+221701234567", payment_method: "cod", status: "confirmed" as any, subtotal: 15000, platform_fee: 1500, vendor_amount: 13500, total: 15000, delivery_address: "Guediawaye" },
  ]

  const orders = await Promise.all(
    orderData.map(data => 
      prisma.order.create({
        data: {
          ...data,
          store_id,
          product_id: product.id,
        }
      })
    )
  )

  await Promise.all(
    orders.map(order => 
      prisma.closingRequest.create({
        data: {
          store_id,
          order_id: order.id,
          status: "PENDING",
          closing_fee: 0,
        }
      })
    )
  )

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/dashboard/closing')
}
