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
    <div className="w-full relative">
      <div className="mb-8 px-6 pt-6">
        <h1 className="text-3xl font-display font-black text-ink">Mini-CRM & LTV</h1>
        <p className="text-dust mt-1 flex items-center gap-2">
          Gérez vos meilleurs clients et maximisez leur Valeur à Vie (LTV).
        </p>
      </div>

      <CustomersClient customers={customers} storeName={store.name} />
    </div>
  )
}
