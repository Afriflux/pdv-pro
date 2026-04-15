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
    const orders = await prisma.order.findMany({ take: 50, 
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
    const storeZones = await prisma.deliveryZone.findMany({ take: 50, 
      where: { store_id: deliverer.store_id },
      select: { id: true, name: true }
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

export async function markOrderAsDeliveredAction(orderId: string, delivererId: string, otpInput?: string) {
  try {
    // Vérifier si la commande appartient bien à ce livreur
    const order = await prisma.order.findFirst({
      where: { id: orderId, deliverer_id: delivererId },
      select: { id: true, delivery_otp: true, delivery_otp_created_at: true, payment_method: true }
    })

    if (!order) {
      return { error: 'Commande non autorisée ou introuvable' }
    }

    // Vérification de l'OTP si c'est une commande COD avec OTP
    if (order.payment_method === 'cod' && order.delivery_otp) {
      if (!otpInput) {
        return { error: 'OTP_REQUIRED' } // Signale au front qu'il faut demander l'OTP
      }
      
      if (order.delivery_otp_created_at) {
        const expiresAt = new Date(order.delivery_otp_created_at.getTime() + 24 * 60 * 60 * 1000)
        if (new Date() > expiresAt) {
          return { error: 'Code OTP expiré.' }
        }
      }

      if (order.delivery_otp !== otpInput.trim()) {
        return { error: 'Code OTP incorrect.' }
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'delivered',
        delivery_otp: null,
        delivery_otp_created_at: null
      }
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
