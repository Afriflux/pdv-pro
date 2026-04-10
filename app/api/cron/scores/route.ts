import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/cron-helpers'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vérification de sécurité CRON (Uniquement Vercel en prod)
  if (!verifyCronSecret(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const supabase = await createClient()

    // 1. Récupérer toutes les boutiques avec leurs stats
    const { data: stores, error: storesError } = await supabase
      .from('Store')
      .select(`
        id, 
        logo_url, 
        description:SalePage(sections), 
        products:Product(id), 
        orders:Order(id, status)
      `)

    if (storesError) throw storesError

    // 2. Récupérer les signalements
    const { data: reports } = await supabase.from('Report').select('order:Order(store_id)')

    const storeScores = stores.map((store: any) => {
      let score = 0

      // +10 par produit actif (max 50pts)
      const productsCount = store.products?.length || 0
      score += Math.min(productsCount * 10, 50)

      // +5 par vente complétée
      const completedOrders = (store.orders || []).filter((o: any) => o.status === 'delivered')
      score += completedOrders.length * 5

      // +20 si taux livraison > 90% (simplifié avec delivered / total)
      if (store.orders?.length >= 5) {
        const deliveryRate = completedOrders.length / store.orders.length
        if (deliveryRate > 0.9) score += 20
      }

      // +25 si profil complet (logo)
      if (store.logo_url) score += 25

      // -50 par signalement reçu
      const storeReports = (reports || []).filter((r: any) => r.order?.store_id === store.id)
      score -= storeReports.length * 50

      // Plancher à 0
      score = Math.max(0, score)

      return {
        store_id: store.id,
        score,
        featured: score >= 100, // Automatiquement Featured si score incroyable
        updated_at: new Date().toISOString()
      }
    })

    // Upsert des scores via Prisma/Supabase
    // Attention: Prisma a besoin du backend mais on utilise Supabase ici.
    const { error: upsertError } = await supabase
      .from('StoreScore')
      .upsert(storeScores, { onConflict: 'store_id' })

    if (upsertError) throw upsertError

    return NextResponse.json({ success: true, processed: storeScores.length })

  } catch (error: unknown) {
    console.error('CRON SCORES ERROR:', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
