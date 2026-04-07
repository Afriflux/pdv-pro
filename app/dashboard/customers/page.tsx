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

  // Récupérer toutes les commandes monétisées
  const orders = await prisma.order.findMany({
    where: {
      store_id: store.id,
      status: {
        notIn: ['cancelled', 'cod_fraud_suspected', 'pending'] // On garde confirmed, paid, delivered, etc.
      }
    },
    select: {
      buyer_name: true,
      buyer_phone: true,
      buyer_email: true,
      total: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' }
  })

  // Aggréger en "Clients"
  type CustomerAgg = {
    phone: string
    name: string
    email: string | null
    totalSpent: number
    orderCount: number
    lastOrderAt: Date
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
        lastOrderAt: o.created_at // comme on est orderBy desc, c'est la toute dernière commande
      })
    }
    const c = customersMap.get(p)!
    c.totalSpent += o.total
    c.orderCount += 1
  }

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
              <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Mini-CRM & LTV</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Gérez vos meilleurs clients et maximisez leur Valeur à Vie (LTV).</p>
            </div>
          </div>
        </header>

        <CustomersClient customers={customers} storeName={store.name} />
      </div>
    </div>
  )
}
