'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

async function getStoreId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, name: true }
  })
  
  return store || null
}

export async function getDeliveriesDataAction() {
  try {
    const store = await getStoreId()
    if (!store) return { error: 'Non autorisé' }

    // On récupère les commandes de type livraison (confirmed, preparing, shipped)
    const orders = await prisma.order.findMany({ take: 50, 
      where: { 
        store_id: store.id,
        status: { in: ['confirmed', 'preparing', 'shipped'] }
      },
      select: {
        id: true, created_at: true, buyer_name: true, buyer_phone: true, 
        delivery_address: true, status: true, total: true, delivery_zone_id: true,
        deliverer_id: true,
        product: { select: { name: true, images: true } },
        deliverer: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    // On fetch le nom des deliveryZone séparément ou on fait le join 
    // Attention: deliveryZone n'est pas lié formellement dans le schéma actuel via @relation
    // (Dans schema.prisma, delivery_zone_id est juste un champ String)
    // Nous utiliserons le mapping manuel si nécessaire, mais pour un premier temps:
    const deliveryZones = await prisma.deliveryZone.findMany({ take: 50, 
      where: { store_id: store.id },
      select: { id: true, name: true }
    })

    // On attache manuellement les noms de zones aux orders
    const zoneMap = new Map(deliveryZones.map(z => [z.id, z.name]))
    
    const formattedOrders = orders.map(o => ({
      ...o,
      created_at: o.created_at.toISOString(),
      deliveryZone: o.delivery_zone_id ? { name: zoneMap.get(o.delivery_zone_id) || 'Zone Inconnue' } : null
    }))

    // On fetch les livreurs
    const deliverers = await prisma.deliverer.findMany({ take: 50, 
      where: { store_id: store.id, active: true },
      orderBy: { created_at: 'desc' },
      select: { id: true, name: true, phone: true }
    })

    return { 
      success: true, 
      store: { id: store.id, name: store.name }, 
      orders: formattedOrders, 
      deliverers 
    }
  } catch (error: any) {
    console.error('[Get Deliveries Error]', error)
    return { error: 'Erreur lors du chargement des livraisons' }
  }
}

export async function createDelivererAction(name: string, phone: string, expirationType: string = 'definitif') {
  try {
    const store = await getStoreId()
    if (!store) return { error: 'Non autorisé' }

    if (!name || !phone) return { error: 'Nom et téléphone requis' }

    let expiresAt = null
    if (expirationType !== 'definitif') {
       const hours = parseInt(expirationType, 10)
       if (!isNaN(hours) && hours > 0) {
          expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
       }
    }

    const deliverer = await prisma.deliverer.create({
      data: {
        store_id: store.id,
        name,
        phone,
        expires_at: expiresAt
      }
    })

    revalidatePath('/dashboard/livraisons')
    return { success: true, deliverer }
  } catch (error: any) {
    console.error('[Create Deliverer Error]', error)
    return { error: 'Erreur lors de la création du livreur' }
  }
}

export async function deleteDelivererAction(delivererId: string) {
  try {
    const store = await getStoreId()
    if (!store) return { error: 'Non autorisé' }

    await prisma.deliverer.deleteMany({
      where: { id: delivererId, store_id: store.id }
    })

    revalidatePath('/dashboard/livraisons')
    return { success: true }
  } catch (error: any) {
    console.error('[Delete Deliverer Error]', error)
    return { error: 'Erreur lors de la suppression du livreur' }
  }
}

export async function assignDelivererToOrderAction(orderId: string, delivererId: string | null) {
  try {
    const store = await getStoreId()
    if (!store) return { error: 'Non autorisé' }

    const order = await prisma.order.findUnique({
      where: { id: orderId, store_id: store.id },
      include: { product: { select: { name: true } } }
    });

    if (!order) return { error: 'Commande introuvable' }

    await prisma.order.update({
      where: { id: orderId },
      data: { deliverer_id: delivererId }
    })

    if (delivererId) {
      const deliverer = await prisma.deliverer.findUnique({ where: { id: delivererId } })
      if (deliverer && deliverer.phone) {
        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'https://yayyam.com'}/delivery/${deliverer.id}`
        const dateStr = format(new Date(), "dd MMM à HH:mm", { locale: fr })
        const message = `🚧 *NOUVELLE COURSE ASSIGNÉE*\n\nSalut ${deliverer.name}, une nouvelle course vient de t'être assignée par ${store.name} le ${dateStr}.\n\n*Client :* ${order.buyer_name}\n*Tél :* ${order.buyer_phone}\n*Adresse :* ${order.delivery_address || 'Non spécifiée'}\n*Produit :* ${order.product?.name}\n\n👉 *Ouvrir ta course ici :*\n${link}`
        
        await sendWhatsApp({
          to: deliverer.phone,
          body: message
        }).catch(err => console.error('[WhatsApp Livreur Error]', err));
      }
    }

    revalidatePath('/dashboard/livraisons')
    return { success: true }
  } catch (error: any) {
    console.error('[Assign Deliverer Error]', error)
    return { error: 'Erreur lors de l\'assignation du livreur' }
  }
}
