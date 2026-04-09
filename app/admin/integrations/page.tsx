// ─── Page Intégrations — Server Component ──────────────────────────────────
// Les clés sont stockées dans PlatformConfig (key/value).
// L'admin lit les clés masquées et les modifie via un composant client inline.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

import { INTEGRATION_CATEGORIES } from './config'
import IntegrationsClient from './IntegrationsClient'

export type ConfigItem = { value: string; updatedAt: string; updatedBy: string | null }
export type ServiceStats = {
  volume30d: number
  lastActivity: string | null
  recentLogs: { id: string, amount: number, date: string, status: string }[]
  sparklineData: number[]
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default async function AdminIntegrationsPage() {
  // Vérification auth + rôle super_admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  const { data: callerData } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (callerData?.role !== 'super_admin') redirect('/admin')

  // Récupérer toutes les clés stockées dans IntegrationKey (Live et Test)
  const allKeys = INTEGRATION_CATEGORIES.flatMap(c => 
    c.services.flatMap(s => 
      s.fields.flatMap(f => f.testKey ? [f.key, f.testKey] : [f.key])
    )
  )

  const { data: configRows } = await supabaseAdmin
    .from('IntegrationKey')
    .select('key, value, updated_at, updated_by')
    .in('key', allKeys)

  // Fetch AI_ROUTING_PREFS from PlatformConfig
  const { data: routingPrefsRow } = await supabaseAdmin
    .from('PlatformConfig')
    .select('value')
    .eq('key', 'AI_ROUTING_PREFS')
    .single()

  const configMap: Record<string, { value: string; updatedAt: string; updatedBy: string | null }> = {}
  if (configRows) {
    for (const row of configRows) {
      configMap[row.key] = { value: row.value, updatedAt: row.updated_at, updatedBy: row.updated_by }
    }
  }
  // Compteur global (basé sur les services : on considère un service "configuré" s'il a au moins un champ live rempli)
  const allServices   = INTEGRATION_CATEGORIES.flatMap(c => c.services)
  const configuredCount = allServices.filter(s => s.fields.some(f => !!configMap[f.key]?.value)).length

  // -- STATISTIQUES FINANCIÈRES (30 derniers jours) --
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // On récupère les commandes récentes, payées ou confirmées
  const { data: recentOrders } = await supabaseAdmin
    .from('Order')
    .select('id, payment_method, total, status, created_at')
    .in('status', ['paid', 'confirmed', 'processing', 'shipped', 'delivered'])
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  const statsMap: Record<string, ServiceStats> = {}
  const now = new Date()

  // Initialisation
  for (const s of allServices) {
    statsMap[s.id] = { volume30d: 0, lastActivity: null, recentLogs: [], sparklineData: [0,0,0,0,0,0,0] }
  }

  // Agrégation
  if (recentOrders) {
    for (const order of recentOrders) {
      // Mapping basique (ex: orange-money possiblement orange_money en BDD)
      const methodId = order.payment_method.replace('_', '-') 
      const methodIdRaw = order.payment_method

      const statRef = statsMap[methodId] || statsMap[methodIdRaw]
      if (statRef) {
        statRef.volume30d += order.total
        if (!statRef.lastActivity) {
          statRef.lastActivity = order.created_at
        }
        
        // Calcul Sparkline (7 jours)
        const orderDate = new Date(order.created_at)
        // Set both times to midnight to avoid partial day offset issues
        const diffTime = Math.abs(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime())
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays < 7) {
           const bucketIndex = 6 - diffDays
           statRef.sparklineData[bucketIndex] += order.total
        }

        if (statRef.recentLogs.length < 3) {
          statRef.recentLogs.push({
            id: order.id,
            amount: order.total,
            date: order.created_at,
            status: order.status
          })
        }
      }
    }
  }

  return (
    <IntegrationsClient 
      configMap={configMap} 
      statsMap={statsMap} 
      configuredCount={configuredCount}
      totalCount={allServices.length}
      aiRoutingPrefs={routingPrefsRow?.value || undefined}
    />
  )
}
