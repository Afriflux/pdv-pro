'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getPaymentLinksAction() {
  try {
    const supabase = await createClient()
    const { data: userData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !userData?.user) return { success: false, error: 'Non autorisé' }

    const store = await prisma.store.findUnique({
      where: { user_id: userData.user.id },
      select: { id: true }
    })
    if (!store) return { success: false, error: 'Boutique introuvable' }

    const links = await prisma.paymentLink.findMany({ take: 50, 
      where: { store_id: store.id },
      orderBy: { created_at: 'desc' }
    })

    return { success: true, links }
  } catch (error) {
    return { success: false, error: 'Serveur indisponible pour le moment.' }
  }
}

export async function createPaymentLinkAction(data: { title: string, amount: number, description?: string }) {
  try {
    const supabase = await createClient()
    const { data: userData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !userData?.user) return { success: false, error: 'Non autorisé' }

    const store = await prisma.store.findUnique({
      where: { user_id: userData.user.id },
      select: { id: true }
    })
    if (!store) return { success: false, error: 'Boutique introuvable' }

    if (!data.title || data.amount <= 0) {
      return { success: false, error: 'Titre et montant valide requis' }
    }

    // Création du produit fantôme si inexistant pour supporter les commandes liées
    let systemProduct = await prisma.product.findFirst({
      where: { store_id: store.id, category: 'system_payment_link' }
    })

    if (!systemProduct) {
      systemProduct = await prisma.product.create({
        data: {
          store_id: store.id,
          name: 'Paiement Direct',
          type: 'digital',
          price: 0,
          category: 'system_payment_link',
          active: false,
          images: ['https://cdn.icon-icons.com/icons2/1378/PNG/512/dialogerror_92823.png'],
          description: 'Produit système technique'
        }
      })
    }

    const link = await prisma.paymentLink.create({
      data: {
        store_id: store.id,
        title: data.title,
        amount: data.amount,
        description: data.description || null,
        currency: 'XOF',
        is_active: true
      }
    })

    revalidatePath('/dashboard/apps/payment-links')
    return { success: true, link }
  } catch (error) {
    return { success: false, error: 'Impossible de créer le lien de paiement côté serveur.' }
  }
}

export async function togglePaymentLinkAction(id: string, is_active: boolean) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return { success: false, error: 'Non autorisé' }

    const store = await prisma.store.findUnique({
      where: { user_id: userData.user.id },
      select: { id: true }
    })
    if (!store) return { success: false, error: 'Boutique introuvable' }

    await prisma.paymentLink.update({
      where: { id, store_id: store.id },
      data: { is_active }
    })

    revalidatePath('/dashboard/apps/payment-links')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Modification impossible.' }
  }
}

export async function deletePaymentLinkAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return { success: false, error: 'Non autorisé' }

    const store = await prisma.store.findUnique({
      where: { user_id: userData.user.id },
      select: { id: true }
    })
    if (!store) return { success: false, error: 'Boutique introuvable' }

    await prisma.paymentLink.delete({
      where: { id, store_id: store.id },
    })

    revalidatePath('/dashboard/apps/payment-links')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Suppression impossible.' }
  }
}
