'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getQuotesAction() {
  try {
    const supabase = await createClient()
    const { data: userData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !userData?.user) return { success: false, error: 'Non autorisé' }

    const store = await prisma.store.findUnique({
      where: { user_id: userData.user.id },
      select: { id: true, name: true, logo_url: true }
    })
    if (!store) return { success: false, error: 'Boutique introuvable' }

    const quotes = await prisma.quote.findMany({ take: 50, 
      where: { store_id: store.id },
      orderBy: { created_at: 'desc' }
    })

    return { success: true, quotes, store }
  } catch (error) {
    return { success: false, error: 'Erreur interne lors de la récupération des devis.' }
  }
}

export async function createQuoteAction(data: { 
  client_name: string, 
  client_email?: string, 
  client_phone?: string, 
  items: Array<{ description: string, quantity: number, unit_price: number }>,
  expires_at?: Date 
}) {
  try {
    const supabase = await createClient()
    const { data: userData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !userData?.user) return { success: false, error: 'Non autorisé' }

    const store = await prisma.store.findUnique({
      where: { user_id: userData.user.id },
      select: { id: true }
    })
    if (!store) return { success: false, error: 'Boutique introuvable' }

    if (!data.client_name || !data.items || data.items.length === 0) {
      return { success: false, error: 'Nom du client et articles requis.' }
    }

    const total_amount = data.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)

    const quote = await prisma.quote.create({
      data: {
        store_id: store.id,
        client_name: data.client_name,
        client_email: data.client_email || null,
        client_phone: data.client_phone || null,
        items: data.items,
        total_amount,
        expires_at: data.expires_at || null,
        status: 'DRAFT'
      }
    })

    revalidatePath('/dashboard/apps/quotes')
    return { success: true, quote }
  } catch (error) {
    return { success: false, error: 'Impossible de créer le devis suite à une erreur serveur.' }
  }
}

export async function updateQuoteStatusAction(id: string, status: string) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return { success: false, error: 'Non autorisé' }

    const store = await prisma.store.findUnique({
      where: { user_id: userData.user.id },
      select: { id: true }
    })
    if (!store) return { success: false, error: 'Boutique introuvable' }

    await prisma.quote.update({
      where: { id, store_id: store.id },
      data: { status }
    })

    revalidatePath('/dashboard/apps/quotes')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Mise à jour impossible.' }
  }
}

export async function deleteQuoteAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return { success: false, error: 'Non autorisé' }

    const store = await prisma.store.findUnique({
      where: { user_id: userData.user.id },
      select: { id: true }
    })
    if (!store) return { success: false, error: 'Boutique introuvable' }

    await prisma.quote.delete({
      where: { id, store_id: store.id },
    })

    revalidatePath('/dashboard/apps/quotes')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Suppression impossible.' }
  }
}
