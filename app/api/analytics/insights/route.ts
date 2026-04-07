// ─── app/api/analytics/insights/route.ts ─────────────────────────────────────
// Route POST — IA heuristique Yayyam
// 12 règles métier + score santé boutique 0-100
// 0 appel externe, 0 latence supplémentaire

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InsightsBody {
  storeId: string
  kpis: {
    views:        number
    viewsTrend:   number
    sales:        number
    salesTrend:   number
    revenue:      number
    revenueTrend: number
    conversion:   number
  }
  topProducts: { name: string; revenue: number; sales: number }[]
  funnel: {
    views:     number
    checkouts: number
    purchases: number
  }
  chartData: { date: string; revenue: number }[]
  days: number
}

export interface Insight {
  type:    'alert' | 'warning' | 'opportunity' | 'success'
  icon:    string
  title:   string
  message: string
  action?: string
}

export interface InsightsResponse {
  insights:       Insight[]
  score:          number   // santé boutique 0–100
  recommendation: string   // recommandation principale
}

// ─── Moteur heuristique ───────────────────────────────────────────────────────

function analyzeData(body: InsightsBody): InsightsResponse {
  const { kpis, topProducts, funnel } = body
  const insights: Insight[] = []

  const topRevShare =
    topProducts.length > 0 && kpis.revenue > 0
      ? (topProducts[0].revenue / kpis.revenue) * 100
      : 0

  const checkoutRate  = funnel.views > 0 ? (funnel.checkouts / funnel.views) * 100 : 0
  const purchaseRate  = funnel.checkouts > 0 ? (funnel.purchases / funnel.checkouts) * 100 : 0

  // ────────────────────────────────────────────────────────────────────────────
  // 🚨 ALERTES
  // ────────────────────────────────────────────────────────────────────────────

  // 1. Baisse de revenus > 20 %
  if (kpis.revenueTrend < -20) {
    insights.push({
      type:    'alert',
      icon:    '🚨',
      title:   'Baisse de revenus détectée',
      message: `Vos revenus ont chuté de ${Math.abs(kpis.revenueTrend).toFixed(0)} % par rapport à la période précédente.`,
      action:  'Créez une promotion pour relancer vos ventes',
    })
  }

  // 2. Taux de conversion critique
  if (kpis.conversion < 1 && kpis.views > 50) {
    insights.push({
      type:    'alert',
      icon:    '🚨',
      title:   'Taux de conversion critique',
      message: `Seulement ${kpis.conversion.toFixed(2)} % de vos visiteurs achètent malgré ${kpis.views} visites.`,
      action:  'Améliorez vos pages produit : photos HD, descriptions convaincantes, prix compétitifs',
    })
  }

  // 3. Peu de visiteurs passent à l'achat
  if (checkoutRate < 5 && funnel.views > 30) {
    insights.push({
      type:    'alert',
      icon:    '🚨',
      title:   'Peu de visiteurs passent à l\'achat',
      message: `Seulement ${checkoutRate.toFixed(1)} % de vos visiteurs lancent une commande.`,
      action:  'Ajoutez des témoignages clients et des badges de confiance (paiement sécurisé)',
    })
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ⚠️ AVERTISSEMENTS
  // ────────────────────────────────────────────────────────────────────────────

  // 4. Dépendance à un seul produit
  if (topRevShare > 70 && topProducts.length >= 1) {
    insights.push({
      type:    'warning',
      icon:    '⚠️',
      title:   'Dépendance à un seul produit',
      message: `"${topProducts[0].name}" génère ${topRevShare.toFixed(0)} % de vos revenus — risque élevé.`,
      action:  'Diversifiez votre catalogue pour sécuriser vos revenus',
    })
  }

  // 5. Légère baisse des ventes
  if (kpis.salesTrend < -10 && kpis.salesTrend >= -20) {
    insights.push({
      type:    'warning',
      icon:    '⚠️',
      title:   'Légère baisse des ventes',
      message: `Vos ventes ont reculé de ${Math.abs(kpis.salesTrend).toFixed(0)} % par rapport à la période précédente.`,
      action:  'Relancez via WhatsApp ou une campagne ciblée sur vos réseaux sociaux',
    })
  }

  // 6. Abandon de panier élevé
  if (purchaseRate < 30 && funnel.checkouts > 5) {
    insights.push({
      type:    'warning',
      icon:    '⚠️',
      title:   'Abandon de panier élevé',
      message: `${(100 - purchaseRate).toFixed(0)} % des acheteurs abandonnent avant de payer.`,
      action:  'Vérifiez que Wave et Orange Money fonctionnent correctement',
    })
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 💡 OPPORTUNITÉS
  // ────────────────────────────────────────────────────────────────────────────

  // 7. Trafic en hausse mais ventes stagnantes
  if (kpis.viewsTrend > 30 && kpis.salesTrend < 5) {
    insights.push({
      type:    'opportunity',
      icon:    '💡',
      title:   'Trafic en hausse mais ventes plates',
      message: `Vos visites ont augmenté de ${kpis.viewsTrend.toFixed(0)} % mais vos ventes ne suivent pas.`,
      action:  'Optimisez vos prix ou ajoutez une offre à durée limitée pour convertir ce trafic',
    })
  }

  // 8. Bon taux de conversion — potentiel de croissance
  if (kpis.conversion >= 3 && kpis.conversion < 5) {
    insights.push({
      type:    'opportunity',
      icon:    '💡',
      title:   'Bon taux de conversion !',
      message: `${kpis.conversion.toFixed(1)} % de vos visiteurs achètent — c'est au-dessus de la moyenne.`,
      action:  'Augmentez votre trafic via les réseaux sociaux pour multiplier vos ventes',
    })
  }

  // 9. Croissance des revenus détectée
  if (kpis.revenue > 0 && kpis.revenueTrend > 20 && kpis.revenueTrend <= 50) {
    insights.push({
      type:    'opportunity',
      icon:    '💡',
      title:   'Croissance des revenus détectée !',
      message: `Vos revenus ont progressé de ${kpis.revenueTrend.toFixed(0)} % — belle dynamique !`,
      action:  'Capitalisez avec du stock supplémentaire et des publicités sponsorisées',
    })
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ✅ SUCCÈS
  // ────────────────────────────────────────────────────────────────────────────

  // 10. Excellent taux de conversion
  if (kpis.conversion >= 5) {
    insights.push({
      type:    'success',
      icon:    '✅',
      title:   'Excellent taux de conversion !',
      message: `${kpis.conversion.toFixed(1)} % de conversions — vous êtes dans le top des boutiques Yayyam.`,
      action:  'Partagez vos techniques et inspirez votre communauté',
    })
  }

  // 11. Ventes en forte hausse
  if (kpis.salesTrend > 30) {
    insights.push({
      type:    'success',
      icon:    '✅',
      title:   'Ventes en forte hausse !',
      message: `+${kpis.salesTrend.toFixed(0)} % de ventes par rapport à la période précédente.`,
      action:  'Maintenez cette dynamique avec des contenus réguliers',
    })
  }

  // 12. Milestone 100 000 FCFA
  if (kpis.revenue >= 100_000) {
    insights.push({
      type:    'success',
      icon:    '🎉',
      title:   `${Math.floor(kpis.revenue / 100_000) * 100} 000 FCFA atteints sur la période !`,
      message: `Vous avez généré ${Math.round(kpis.revenue).toLocaleString('fr-FR')} FCFA — félicitations !`,
    })
  }

  // ─── Score santé boutique 0–100 ──────────────────────────────────────────

  let score = 50
  score += kpis.conversion >= 5 ? 20 : kpis.conversion >= 3 ? 15 : kpis.conversion >= 1 ? 10 : -10
  score += kpis.revenueTrend > 20 ? 15 : kpis.revenueTrend >= 0 ? 8 : kpis.revenueTrend > -10 ? 0 : -15
  score += kpis.salesTrend > 10 ? 15 : kpis.salesTrend >= 0 ? 8 : -5

  // Malus alertes critiques
  score -= insights.filter(i => i.type === 'alert').length * 8
  score = Math.max(0, Math.min(100, Math.round(score)))

  // ─── Recommandation principale ────────────────────────────────────────────

  let recommendation: string
  if (score >= 80) {
    recommendation = '🚀 Votre boutique performe très bien — focalisez-vous sur la croissance du trafic.'
  } else if (score >= 60) {
    recommendation = '📈 Bonne santé globale — travaillez votre taux de conversion pour atteindre le niveau supérieur.'
  } else if (score >= 40) {
    recommendation = '⚠️ Des améliorations sont nécessaires — commencez par vos pages produit et vos méthodes de paiement.'
  } else {
    recommendation = '🚨 Votre boutique nécessite une attention urgente — consultez les alertes ci-dessous et agissez maintenant.'
  }

  // Trier : alertes → warnings → opportunities → success
  const ORDER: Record<Insight['type'], number> = {
    alert:       0,
    warning:     1,
    opportunity: 2,
    success:     3,
  }
  insights.sort((a, b) => ORDER[a.type] - ORDER[b.type])

  return { insights, score, recommendation }
}

// ─── Route POST ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth vendeur
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Lire le body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
    }

    const data = body as InsightsBody

    if (!data?.storeId || !data?.kpis || !data?.funnel) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Vérifier que le store appartient à ce vendeur (sécurité)
    const { data: store } = await supabase
      .from('Store')
      .select('id')
      .eq('id', data.storeId)
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Générer les insights via le moteur heuristique
    const result = analyzeData(data)

    return NextResponse.json(result, { status: 200 })

  } catch (err: unknown) {
    console.error('[analytics/insights]', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
