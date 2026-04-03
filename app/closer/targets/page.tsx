import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import CloserTargetsClient from './CloserTargetsClient'

export const dynamic = 'force-dynamic'

export default async function CloserTargetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Trouver toutes les Boutiques qui ont activé la fonctionnalité Closer
  const stores = await prisma.store.findMany({
    where: {
      closer_active: true
    },
    include: {
      _count: {
        select: {
          products: { where: { active: true } },
        }
      }
    }
  })

  // Pour chaque boutique, on veut voir combien de leads "new" sont dans le pool global
  const storeIds = stores.map(s => s.id)
  
  const rawLeadsCount = await prisma.lead.groupBy({
    by: ['store_id'],
    where: {
      store_id: { in: storeIds },
      status: 'new',
      closer_id: null // Seulement ceux qui ne sont pas encore pris
    },
    _count: {
      id: true
    }
  })
  
  const leadsCountMap: Record<string, number> = {}
  rawLeadsCount.forEach((item: any) => {
    leadsCountMap[item.store_id] = item._count.id
  })

  // Fusionner les données
  const enrichedStores = stores.map(store => ({
    ...store,
    newLeadsCount: leadsCountMap[store.id] || 0
  })).sort((a, b) => b.newLeadsCount - a.newLeadsCount) // Trier par le plus d'opportunités d'abord

  return (
    <CloserTargetsClient stores={enrichedStores} />
  )
}
