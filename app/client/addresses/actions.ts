'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const MAX_ADDRESSES = 3

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export async function addDeliveryAddress(formData: FormData) {
  const userId = await getAuthUserId()
  if (!userId) return { error: 'Non authentifié' }

  // Vérifier la limite
  const count = await prisma.deliveryAddress.count({ where: { user_id: userId } })
  if (count >= MAX_ADDRESSES) {
    return { error: `Vous avez atteint la limite de ${MAX_ADDRESSES} adresses. Supprimez-en une pour en ajouter une nouvelle.` }
  }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const label = formData.get('label') as string
  const city = formData.get('city') as string
  const delivery_notes = formData.get('delivery_notes') as string
  const latitudeRaw = formData.get('latitude') as string
  const longitudeRaw = formData.get('longitude') as string
  const isDefault = formData.get('is_default') === 'true'

  if (!name || !phone || !address || !label) {
    return { error: 'Tous les champs requis ne sont pas remplis.' }
  }

  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null

  try {
    // Si c'est la première adresse ou si elle est marquée par défaut
    const shouldBeDefault = isDefault || count === 0

    if (shouldBeDefault) {
      await prisma.deliveryAddress.updateMany({
        where: { user_id: userId },
        data: { is_default: false }
      })
    }

    await prisma.deliveryAddress.create({
      data: {
        user_id: userId,
        name,
        phone,
        address,
        label,
        city: city || null,
        latitude,
        longitude,
        delivery_notes: delivery_notes || null,
        is_default: shouldBeDefault
      }
    })
    
    revalidatePath('/client/addresses')
    revalidatePath('/client/settings')
    return { success: true }
  } catch (error) {
    console.error('[addDeliveryAddress]', error)
    return { error: "Erreur lors de l'ajout de l'adresse." }
  }
}

export async function updateDeliveryAddress(id: string, formData: FormData) {
  const userId = await getAuthUserId()
  if (!userId) return { error: 'Non authentifié' }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const label = formData.get('label') as string
  const city = formData.get('city') as string
  const delivery_notes = formData.get('delivery_notes') as string
  const latitudeRaw = formData.get('latitude') as string
  const longitudeRaw = formData.get('longitude') as string

  if (!name || !phone || !address || !label) {
    return { error: 'Tous les champs requis ne sont pas remplis.' }
  }

  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null

  try {
    await prisma.deliveryAddress.update({
      where: { id, user_id: userId },
      data: { 
        name, phone, address, label, 
        city: city || null,
        latitude, longitude,
        delivery_notes: delivery_notes || null
      }
    })
    
    revalidatePath('/client/addresses')
    revalidatePath('/client/settings')
    return { success: true }
  } catch (error) {
    console.error('[updateDeliveryAddress]', error)
    return { error: "Erreur lors de la modification de l'adresse." }
  }
}

export async function setDefaultAddress(id: string) {
  const userId = await getAuthUserId()
  if (!userId) return { error: 'Non authentifié' }

  try {
    await prisma.deliveryAddress.updateMany({
      where: { user_id: userId },
      data: { is_default: false }
    })

    await prisma.deliveryAddress.update({
      where: { id, user_id: userId },
      data: { is_default: true }
    })
    
    revalidatePath('/client/addresses')
    revalidatePath('/client/settings')
    return { success: true }
  } catch (error) {
    console.error('[setDefaultAddress]', error)
    return { error: "Erreur lors du changement d'adresse par défaut." }
  }
}

export async function deleteDeliveryAddress(id: string) {
  const userId = await getAuthUserId()
  if (!userId) return { error: 'Non authentifié' }

  try {
    const addr = await prisma.deliveryAddress.findUnique({ where: { id, user_id: userId } })
    if (!addr) return { error: 'Adresse introuvable.' }

    await prisma.deliveryAddress.delete({
      where: { id, user_id: userId }
    })

    // Si on supprime l'adresse par défaut, on en promeut une autre
    if (addr.is_default) {
      const remaining = await prisma.deliveryAddress.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      })
      if (remaining) {
        await prisma.deliveryAddress.update({
          where: { id: remaining.id },
          data: { is_default: true }
        })
      }
    }
    
    revalidatePath('/client/addresses')
    revalidatePath('/client/settings')
    return { success: true }
  } catch (error) {
    console.error('[deleteDeliveryAddress]', error)
    return { error: "Erreur lors de la suppression de l'adresse." }
  }
}
