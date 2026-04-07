'use server'

import { prisma } from '@/lib/prisma'

const FAKE_NAMES = ["Mamadou D.", "Fatou S.", "Koffi A.", "Aïcha B.", "Jean M.", "Marie T.", "Amadou T.", "Sophie K."]
const FAKE_CITIES = ["Dakar", "Abidjan", "Paris", "Lyon", "Thiès", "Bamako", "Douala", "Bordeaux"]

export async function getRecentSocialProof(storeId: string) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { social_proof_active: true, social_proof_config: true }
    })
    
    if (!store?.social_proof_active) return { success: false, data: [] }
    
    let config: any = store.social_proof_config || {}
    if (typeof config === 'string') config = JSON.parse(config)

    const recentOrders = await prisma.order.findMany({
      where: {
        store_id: storeId,
        status: { in: ['confirmed', 'paid', 'delivered'] } 
      },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        buyer_name: true,
        created_at: true,
        delivery_address: true,
        product: { select: { name: true, images: true } }
      }
    })

    const anonymized = recentOrders.map(o => {
      const parts = o.buyer_name.split(' ')
      const firstName = parts[0]
      const initial = parts.length > 1 ? parts[parts.length - 1][0] + '.' : ''
      const name = `${firstName} ${initial}`
      
      const city = o.delivery_address ? o.delivery_address.split(',')[0].trim() : "En ligne"
      
      return {
        id: o.id,
        name: name,
        city: city,
        time: o.created_at.toISOString(),
        productName: o.product.name,
        productImage: o.product.images[0] || null
      }
    })

    // FAKE DATA GENERATION (if enabled and we don't have enough data)
    if (config.useFakeData && anonymized.length < 6) {
      const products = await prisma.product.findMany({
        where: { store_id: storeId, active: true },
        take: 5,
        select: { id: true, name: true, images: true }
      })
      
      if (products.length > 0) {
        const fakeCount = 10 - anonymized.length
        for (let i = 0; i < fakeCount; i++) {
          const product = products[Math.floor(Math.random() * products.length)]
          const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)]
          const city = FAKE_CITIES[Math.floor(Math.random() * FAKE_CITIES.length)]
          
          // Generate a fake time between now and 8 hours ago
          const fakeTime = new Date()
          fakeTime.setMinutes(fakeTime.getMinutes() - Math.floor(Math.random() * 480) - 2)
          
          anonymized.push({
            id: `fake-${i}`,
            name,
            city,
            time: fakeTime.toISOString(),
            productName: product.name,
            productImage: product.images[0] || null
          })
        }
        
        // Sort by time descending
        anonymized.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      }
    }

    return { success: true, data: anonymized, config }
  } catch (e) {
    return { success: false, data: [] }
  }
}
