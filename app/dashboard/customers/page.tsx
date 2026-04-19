import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import CustomersClient from './CustomersClient'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/onboarding')

  // Récupérer un historique plus large pour construire les segments (1000 dernières commandes)
  const orders = await prisma.order.findMany({ 
    take: 1000,
    where: {
      store_id: store.id,
      status: {
        notIn: ['pending'] // On exclut pending mais on garde cancelled pour le calcul des 'A risque'
      }
    },
    select: {
      buyer_name: true,
      buyer_phone: true,
      buyer_email: true,
      total: true,
      status: true,
      delivery_address: true,
      applied_promo_id: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' },
  })

  // Aggréger en "Clients"
  type CustomerAgg = {
    phone: string
    name: string
    email: string | null
    totalSpent: number
    orderCount: number
    validOrderCount: number
    cancelledCount: number
    promoCount: number
    cities: string[]
    lastOrderAt: Date
    score: number | null
    isBlacklisted: boolean
  }

  const customersMap = new Map<string, CustomerAgg>()

  for (const o of orders) {
    const p = o.buyer_phone || 'Inconnu'
    if (!customersMap.has(p)) {
      customersMap.set(p, {
        phone: p,
        name: o.buyer_name,
        email: o.buyer_email,
        totalSpent: 0,
        orderCount: 0,
        validOrderCount: 0,
        cancelledCount: 0,
        promoCount: 0,
        cities: [],
        lastOrderAt: o.created_at,
        score: null,
        isBlacklisted: false
      })
    }
    const c = customersMap.get(p)!
    c.orderCount += 1
    
    // Si la commande est valide (non annulée)
    if (!['cancelled', 'cod_fraud_suspected'].includes(o.status)) {
      c.validOrderCount += 1
      c.totalSpent += o.total
    } else {
      c.cancelledCount += 1
    }

    if (o.applied_promo_id) c.promoCount += 1

    // Tentative d'extraction de la ville (ex: Dakar, Thies, Abidjan)
    if (o.delivery_address) {
      const parts = o.delivery_address.split(',')
      if (parts.length > 0) {
        let city = parts[0].trim().toUpperCase() // On prend le premier mot
        // Petit nettoyage rapide
        if(city.includes(' - ')) city = city.split(' - ')[0]
        if (!c.cities.includes(city) && city.length > 2) c.cities.push(city)
      }
    }
  }

  const buyerScores = await prisma.buyerScore.findMany({
    where: { phone: { in: Array.from(customersMap.keys()) } }
  })
  
  const buyerBlacklists = await prisma.buyerBlacklist.findMany({
    where: { phone: { in: Array.from(customersMap.keys()) } }
  })

  // Mettre à jour la map avec les scores et statuts de liste noire
  buyerScores.forEach(bs => {
    const c = customersMap.get(bs.phone)
    if (c) c.score = bs.score
  })
  
  buyerBlacklists.forEach(bb => {
    const c = customersMap.get(bb.phone)
    if (c) c.isBlacklisted = true
  })

  const customers = Array.from(customersMap.values())

  return (
    <div className="w-full relative z-10 px-6 lg:px-10 pb-20">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-blue-600 shadow-[0_8px_30px_rgb(37,99,235,0.12)] border border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h1 className="text-xl lg:text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Mini-CRM & LTV</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Gérez vos meilleurs clients et maximisez leur Valeur à Vie (LTV).</p>
            </div>
          </div>
        </header>

        <CustomersClient customers={customers} storeName={store.name} />
      </div>
    </div>
  )
}
