'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getStoreId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  
  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  })
  if (!store) throw new Error('Boutique introuvable')
  return store.id
}

export async function createDeliveryZone(data: { name: string; fee: number; delay?: string; free_shipping_threshold?: number | null; note?: string | null }) {
  const store_id = await getStoreId()
  await prisma.deliveryZone.create({
    data: { store_id, ...data }
  })
  revalidatePath('/dashboard/zones')
}

export async function updateDeliveryZone(id: string, data: { name: string; fee: number; delay?: string; free_shipping_threshold?: number | null; note?: string | null }) {
  const store_id = await getStoreId()
  await prisma.deliveryZone.update({
    where: { id, store_id },
    data
  })
  revalidatePath('/dashboard/zones')
}

export async function toggleDeliveryZone(id: string, active: boolean) {
  const store_id = await getStoreId()
  await prisma.deliveryZone.update({
    where: { id, store_id },
    data: { active }
  })
  revalidatePath('/dashboard/zones')
}

export async function deleteDeliveryZone(id: string) {
  const store_id = await getStoreId()
  await prisma.deliveryZone.delete({
    where: { id, store_id }
  })
  revalidatePath('/dashboard/zones')
}
