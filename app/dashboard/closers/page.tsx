import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import CloserClient from './CloserClient'

export const dynamic = 'force-dynamic';

export default async function ClosersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Récupération du store
  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, closer_active: true, closer_margin: true }
  })

  if (!store) redirect('/dashboard')

  // 2. Récupérer les produits pour les exceptions
  const products = await prisma.product.findMany({
    where: { store_id: store.id },
    select: { id: true, name: true, closer_active: true, closer_margin: true }
  })

  // 3. Agréger les performances des closers sur ce store
  // Pour chaque closer_id ayant des leads sur ce store, on calcule les métriques
  const leadsGrouped = await prisma.lead.groupBy({
    by: ['closer_id', 'status'],
    where: { 
      store_id: store.id,
      closer_id: { not: null } 
    },
    _count: { id: true },
    _sum: { commission_amount: true }
  })

  // Récupérer les noms des closers (utilisateurs Supabase/Prisma)
  // Attention: si la table User dans Prisma n'est pas remplie, le nom peut manquer.
  // Gérons l'agrégation en JS
  const performanceMap: Record<string, any> = {}

  for (const group of leadsGrouped) {
    if (!group.closer_id) continue
    if (!performanceMap[group.closer_id]) {
      performanceMap[group.closer_id] = {
        closer_id: group.closer_id,
        name: 'Closer ' + group.closer_id.substring(0, 5), // Nom temporaire (besoin du join User)
        contacted_count: 0,
        won_count: 0,
        lost_count: 0,
        total_commissions: 0
      }
    }
    const pc = performanceMap[group.closer_id]
    if (group.status === 'contacted' || group.status === 'qualified') pc.contacted_count += group._count.id
    if (group.status === 'won') {
      pc.won_count += group._count.id
      pc.total_commissions += Number(group._sum.commission_amount || 0)
    }
    if (group.status === 'lost') pc.lost_count += group._count.id
  }

  // Tenter de récupérer les vrais noms si la table User existe
  const closerIds = Object.keys(performanceMap)
  if (closerIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: closerIds } },
      select: { id: true, name: true }
    })
    for (const u of users) {
      if (performanceMap[u.id]) {
        performanceMap[u.id].name = u.name || 'Anonyme'
      }
    }
  }

  const performances = Object.values(performanceMap)

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      {/* Header Premium */}
      <header className="bg-white border-b border-gray-100 px-6 py-8 md:px-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl shadow-sm">
                📞
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Closers & Force de Vente</h1>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium max-w-xl leading-relaxed">
              Confiez vos prospects indécis et vos paniers abandonnés à des experts.
              Configurez vos commissions et suivez leurs performances.
            </p>
          </div>
        </div>
      </header>

      <div className="w-full px-4 md:px-6 py-8">
        <CloserClient
          storeId={store.id}
          initialActive={store.closer_active}
          initialMargin={store.closer_margin}
          products={products.map(p => ({
             ...p,
             closer_margin: p.closer_margin ? p.closer_margin : null
          }))}
          performances={performances as any}
        />
      </div>
    </main>
  )
}
