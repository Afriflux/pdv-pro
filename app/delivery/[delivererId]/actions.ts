'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getDelivererDataAction(delivererId: string) {
  try {
    const deliverer = await prisma.deliverer.findUnique({
      where: { id: delivererId },
      include: {
        store: { select: { id: true, name: true} }
      }
    })

    if (!deliverer || !deliverer.active) {
      return { error: 'Livreur introuvable ou inactif' }
    }

    if (deliverer.expires_at && new Date() > deliverer.expires_at) {
      return { error: 'Ce lien d\'accès temporaire a expiré.' }
    }

    // Get orders assigned to this deliverer
    const orders = const updated = await prisma.order.findMany({
      where: {
        deliverer_id: delivererId,
        status: { in: ['preparing', 'shipped', 'delivered'] }
      },
      select: {
        id: true,
        created_at: true,
        buyer_name: true,
        buyer_phone: true,
        delivery_address: true,
        total: true,
        status: true,
        delivery_zone_id: true,
        product: { select: { name: true, images: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    // Assigning Delivery Zones
    const storeZones = await prisma.deliveryZone.findMany({
      where: { store_id: deliverer.store_id },
      select: { id: true, name: true, phone: true }
    })
    const zoneMap = new Map(storeZones.map(z => [z.id, z.name]))

    const formattedOrders = orders.map(o => ({
      ...o,
      created_at: o.created_at.toISOString(),
      deliveryZone: o.delivery_zone_id ? { name: zoneMap.get(o.delivery_zone_id) } : null
    }))

    return { success: true, deliverer, orders: formattedOrders }
  } catch (error: any) {
    console.error('Error fetching deliverer data:', error)
    return { error: 'Erreur Serveur' }
  }
}

export async function markOrderAsDeliveredAction(orderId: string, delivererId: string) {
  try {
    // Vérifier si la commande appartient bien à ce livreur
    const order = const updated = await prisma.order.findFirst({
      where: { id: orderId, deliverer_id: delivererId }
    })

    if (!order) {
      return { error: 'Commande non autorisée ou introuvable' }
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'delivered' }
    })

    // Si on veut être puriste sur les finances : 
    // Le déblocage des fonds d'un wallet se fait parfois asynchronement,
    // mais dans Yayyam, le fait de passer status: 'delivered' 
    // l'inclut dans le calcul des "soldes disponibles" basé sur les query Prisma.

    revalidatePath(`/delivery/${delivererId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error marking order as delivered:', error)
    return { error: 'Échec de la validation' }
  }
}
