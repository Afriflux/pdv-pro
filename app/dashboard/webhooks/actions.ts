'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getWebhooksAction() {
  const supabase = await createClient()
  const { data: userData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !userData?.user) return { success: false, error: 'Non autorisé' }

  const store = await prisma.store.findUnique({
    where: { user_id: userData.user.id },
    select: { id: true, name: true }
  })
  if (!store) return { success: false, error: 'Boutique introuvable' }

  const webhooks = await prisma.webhook.findMany({ take: 50, 
    where: { store_id: store.id },
    orderBy: { created_at: 'desc' }
  })

  return { success: true, webhooks }
}

export async function createWebhookAction(url: string, event: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { success: false, error: 'Non autorisé' }

  const store = await prisma.store.findUnique({
    where: { user_id: userData.user.id }
  })
  if (!store) return { success: false, error: 'Boutique introuvable' }

  try {
    const hooksCount = await prisma.webhook.count({ where: { store_id: store.id } })
    if (hooksCount >= 5) {
      return { success: false, error: 'Limite de 5 webhooks atteinte. Supprimez-en un pour continuer.' }
    }

    const webhook = await prisma.webhook.create({
      data: {
        store_id: store.id,
        url,
        event
      }
    })

    revalidatePath('/dashboard/webhooks')
    return { success: true, webhook }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteWebhookAction(id: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { success: false, error: 'Non autorisé' }

  const store = await prisma.store.findUnique({
    where: { user_id: userData.user.id }
  })
  if (!store) return { success: false, error: 'Boutique introuvable' }

  try {
    await prisma.webhook.deleteMany({
      where: { id, store_id: store.id }
    })
    revalidatePath('/dashboard/webhooks')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}

export async function testWebhookAction(url: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { success: false, error: 'Non autorisé' }

  try {
    const payload = {
      event: 'test.ping',
      data: {
        message: 'Ceci est un test de connexion depuis Yayyam.',
        timestamp: new Date().toISOString(),
        testData: { amount: 25000, buyer: { name: 'Jean Dupont', phone: '+22177...', address: 'Dakar' }, product: 'Airpods Pro' }
      }
    }
    const req = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    })
    if (!req.ok) {
       return { success: false, error: `Erreur distante (${req.status})` }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: 'Erreur réseau (URL inaccessible)' }
  }
}
