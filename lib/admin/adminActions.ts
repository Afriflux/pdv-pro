'use server'

import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'

/**
 * Fonction métier pour tracer toutes les actions critiques des admins/gestionnaires
 */
export async function logAdminAction(
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('AdminLog').insert({
    admin_id: user.id,
    action,
    target_type: targetType || null,
    target_id: targetId || null,
    details: details || null
  })
}

export interface AdminOverviewStats {
  totalVendors: number;
  totalBuyers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  openReports: number;
}

/**
 * Récupère les KPIs globaux affichés sur /admin
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const supabase = await createClient()

  // On peut paralléliser ces requêtes pour aller plus vite
  const [
    { count: vendorsCount },
    { count: buyersCount },
    { count: ordersCount },
    { data: ordersData },
    { count: withdrawalsCount },
    { count: reportsCount }
  ] = await Promise.all([
    supabase.from('User').select('*', { count: 'exact', head: true }).in('role', ['vendeur']),
    supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'acheteur'),
    supabase.from('Order').select('*', { count: 'exact', head: true }),
    supabase.from('Order').select('platform_fee').in('status', ['confirmed', 'preparing', 'shipped', 'delivered']),
    supabase.from('Withdrawal').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('Report').select('*', { count: 'exact', head: true }).eq('status', 'open')
  ])

  // Yayyam Revenue (La somme des platform_fee)
  const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.platform_fee || 0), 0) || 0

  return {
    totalVendors: vendorsCount || 0,
    totalBuyers: buyersCount || 0,
    totalOrders: ordersCount || 0,
    totalRevenue,
    pendingWithdrawals: withdrawalsCount || 0,
    openReports: reportsCount || 0
  }
}

/**
 * Récupère la liste des logs admin
 */
export async function getAdminLogs(limit = 50) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('AdminLog')
    .select('*, admin:User(name, email, role)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data
}

// ─── GESTION DES VENDEURS ──────────────────────────────────────────────────

export interface AdminVendor {
  id: string
  name: string
  email: string | null
  phone: string
  role: string
  created_at: string
  store: { name: string } | null
  total_revenue: number
}

/**
 * Récupère tous les utilisateurs (hors super_admin)
 */
export async function getAdminVendors(): Promise<AdminVendor[]> {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('User')
    .select(`
      id, name, email, phone, role, created_at,
      store:Store(name),
      orders:Order(platform_fee, status)
    `)
    .neq('role', 'super_admin')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return users.map(user => {
    // Calcul de l'argent généré par ce vendeur (via les fees de ses commandes)
    // NB: On filtre sur les orders valides
    const validStatuses = ['confirmed', 'preparing', 'shipped', 'delivered']
    let revenue = 0
    if (user.orders && Array.isArray(user.orders)) {
      const ordersArray = user.orders as Record<string, unknown>[]
      revenue = ordersArray.reduce((sum, o: Record<string, unknown>) => {
        if (validStatuses.includes(o.status as string)) {
           return sum + ((o.platform_fee as number) || 0)
        }
        return sum
      }, 0)
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
      store: user.store && !Array.isArray(user.store) ? user.store : null,
      total_revenue: revenue
    }
  })
}

/**
 * Permet de suspendre (passer acheteur/bloqué) ou rétablir (passer vendeur)
 * Note: Simplification ici, un vendeur suspendu devient 'acheteur' et perd son dashboard.
 */
export async function toggleVendorStatus(userId: string, currentRole: string) {
  const supabase = await createClient()
  
  // Si c'est un vendeur, on le rétrograde en acheteur = bloqué
  // S'il est acheteur, il devient vendeur.
  const newRole = currentRole === 'vendeur' ? 'acheteur' : 'vendeur'

  const { error } = await supabase
    .from('User')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await logAdminAction(
    `Passage au rôle ${newRole.toUpperCase()}`,
    'User',
    userId
  )

  return newRole
}

// ─── GESTION DES COMMANDES ─────────────────────────────────────────────────

export interface AdminOrder {
  id: string
  created_at: string
  status: string
  total_amount: number
  platform_fee: number
  buyer_email: string
  buyer_phone: string
  store: { name: string } | null
  product_titles: string[]
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const supabase = await createClient()

  // On récupère toutes les commandes avec leurs relations
  const { data, error } = await supabase
    .from('Order')
    .select(`
      id, created_at, status, total_amount, platform_fee,
      buyer:User!buyer_id(email, phone),
      store:Store(name),
      items:OrderItem(product_title)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data.map((o: Record<string, unknown>) => ({
    id: o.id as string,
    created_at: o.created_at as string,
    status: o.status as string,
    total_amount: o.total_amount as number,
    platform_fee: (o.platform_fee as number) || 0,
    buyer_email: (o.buyer as Record<string, unknown>)?.email as string || 'Inconnu',
    buyer_phone: (o.buyer as Record<string, unknown>)?.phone as string || 'Inconnu',
    store: o.store && !Array.isArray(o.store) ? (o.store as { name: string }) : null,
    product_titles: o.items ? (o.items as Record<string, unknown>[]).map((i: Record<string, unknown>) => i.product_title as string) : []
  }))
}

// ─── GESTION DES SIGNALEMENTS / LITIGES ──────────────────────────────────────

export interface AdminComplaint {
  id: string
  created_at: string
  status: string
  type: string
  description: string
  admin_notes: string | null
  reporter: { name: string; email: string; phone: string } | null
  store: { name: string } | null
  order?: { id: string; total_amount: number; store?: { name: string } | null } | null
}

export async function getAdminReports(): Promise<AdminComplaint[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Complaint')
    .select(`
      id, created_at, status, type, description, admin_notes,
      reporter:User!reporter_id(name, email, phone),
      store:Store!store_id(name),
      order:Order!order_id(id, total_amount, store:Store!store_id(name))
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    created_at: r.created_at as string,
    status: r.status as string,
    type: r.type as string,
    description: r.description as string,
    admin_notes: r.admin_notes as string | null,
    reporter: r.reporter && !Array.isArray(r.reporter) ? (r.reporter as { name: string; email: string; phone: string }) : null,
    store: r.store && !Array.isArray(r.store) ? (r.store as { name: string }) : null,
    order: (r.order && !Array.isArray(r.order)) ? (r.order as { id: string; total_amount: number; store?: { name: string } | null }) : null
  }))
}

export async function resolveReport(reportId: string, status: string, notes: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non authentifié")
  const { data: userData } = await supabase.from('User').select('role').eq('id', user.id).single()
  if (!userData || !['super_admin', 'gestionnaire'].includes(userData.role)) {
    throw new Error("Accès refusé")
  }

  const { data: complaint } = await supabase.from('Complaint').select('status, store_id, reporter_id, type').eq('id', reportId).single()
  if (!complaint) throw new Error("Plainte introuvable")

  const currentStatus = complaint.status
  const allowedTransitions: Record<string, string[]> = {
    pending: ['investigating', 'resolved', 'dismissed'],
    investigating: ['resolved', 'dismissed'],
    resolved: [],
    dismissed: []
  }

  if (!allowedTransitions[currentStatus]?.includes(status)) {
    throw new Error(`Transition impossible de '${currentStatus}' vers '${status}'`)
  }

  const safeNotes = notes.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")

  const { error } = await supabase
    .from('Complaint')
    .update({ 
      status: status, 
      admin_notes: safeNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', reportId)

  if (error) throw new Error(error.message)

  await logAdminAction(
    `Signalement marqué comme: ${status.toUpperCase()}`,
    'Complaint',
    reportId,
    { notes: safeNotes }
  )

  if (status === 'resolved' || status === 'dismissed') {
     if (complaint.reporter_id) {
       const { data: reporterObj } = await supabase.from('User').select('phone').eq('id', complaint.reporter_id).single()
       if (reporterObj?.phone) {
         await sendWhatsApp({
           to: reporterObj.phone,
           body: `📢 *Mise à jour de votre signalement*\n\nVotre réclamation concernant "${complaint.type}" vient d'être traitée et son statut est passé à : *${status === 'resolved' ? '✅ Résolu' : '❌ Rejeté'}*.\n\nMerci pour votre vigilance.\n_Support Yayyam Pro_`
         })
       }
     }
     if (complaint.store_id) {
       const { data: storeObj } = await supabase.from('Store').select('user_id').eq('id', complaint.store_id).single()
       if (storeObj?.user_id) {
         const { data: storeOwner } = await supabase.from('User').select('phone').eq('id', storeObj.user_id).single()
         if (storeOwner?.phone) {
            await sendWhatsApp({
              to: storeOwner.phone,
              body: `⚠️ *Info de l'administration Yayyam*\n\nLe signalement ("${complaint.type}") vous concernant a été analysé et clôturé avec le statut: *${status === 'resolved' ? '✅ Résolu' : '❌ Rejeté'}*.\n\nConsultez l'historique de votre boutique si nécessaire.`
            })
         }
       }
     }
  }
}

// ─── CONFIGURATION GLOBALE ───────────────────────────────────────────────────

export interface AdminPlatformConfig {
  tier_1: number
  tier_2: number
  tier_3: number
  tier_4: number
  cod: number
  min_withdrawal: number
  fee_fixed: number
  tax_vat_enabled: boolean
  tax_vat_rate: number
}

export async function getPlatformConfig(): Promise<AdminPlatformConfig> {
  const supabase = await createClient()

  const keys = [
    'commission_tier_1', 'commission_tier_2', 'commission_tier_3', 'commission_tier_4',
    'commission_cod', 'min_withdrawal', 'fee_fixed', 'tax_vat_enabled', 'tax_vat_rate'
  ]

  const { data: kvRows } = await supabase
    .from('PlatformConfig')
    .select('key, value')
    .in('key', keys)

  const kvStr = (kvRows || []).reduce((acc: Record<string, string>, row: { key: string | null, value: string | null }) => {
    if (row.key && row.value) acc[row.key] = row.value
    return acc
  }, {})

  return {
    tier_1: Number(kvStr['commission_tier_1']) || 8,
    tier_2: Number(kvStr['commission_tier_2']) || 7,
    tier_3: Number(kvStr['commission_tier_3']) || 6,
    tier_4: Number(kvStr['commission_tier_4']) || 5,
    cod: Number(kvStr['commission_cod']) || 5,
    min_withdrawal: Number(kvStr['min_withdrawal']) || 5000,
    fee_fixed: Number(kvStr['fee_fixed']) || 0,
    tax_vat_enabled: kvStr['tax_vat_enabled'] === 'true',
    tax_vat_rate: Number(kvStr['tax_vat_rate']) || 18,
  }
}

export async function updatePlatformConfig(payload: AdminPlatformConfig) {
  const supabase = await createClient()

  const upserts = [
    { key: 'commission_tier_1', value: String(payload.tier_1) },
    { key: 'commission_tier_2', value: String(payload.tier_2) },
    { key: 'commission_tier_3', value: String(payload.tier_3) },
    { key: 'commission_tier_4', value: String(payload.tier_4) },
    { key: 'commission_cod', value: String(payload.cod) },
    { key: 'min_withdrawal', value: String(payload.min_withdrawal) },
    { key: 'fee_fixed', value: String(payload.fee_fixed) },
    { key: 'tax_vat_enabled', value: payload.tax_vat_enabled ? 'true' : 'false' },
    { key: 'tax_vat_rate', value: String(payload.tax_vat_rate) },
  ]

  // Upsert the kv pairs
  for (const item of upserts) {
    const { data: exist } = await supabase.from('PlatformConfig').select('id').eq('key', item.key).limit(1).single()
    if (exist) {
      await supabase.from('PlatformConfig').update({ value: item.value, commission_rate: 0 }).eq('id', exist.id)
    } else {
      await supabase.from('PlatformConfig').insert([{ key: item.key, value: item.value, commission_rate: 0 }])
    }
  }

  await logAdminAction(
    'Mise à jour des règles de commission (KV)',
    'PlatformConfig',
    'dynamic-tiers',
    payload as unknown as Record<string, unknown>
  )
}

// ─── GESTION DE L'ÉQUIPE (STAFF) ─────────────────────────────────────────────

export interface AdminTeamMember {
  id: string
  name: string
  email: string | null
  phone: string
  role: string
  created_at: string
}

export async function getAdminTeam(): Promise<AdminTeamMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('User')
    .select('id, name, email, phone, role, created_at')
    .in('role', ['super_admin', 'gestionnaire'])
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return data.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    created_at: u.created_at
  }))
}

export async function toggleManagerRole(userId: string, isManager: boolean) {
  const supabase = await createClient()

  // Seuls les rôles peuvent être basculés entre 'acheteur' (défaut) et 'gestionnaire'
  // On ne peut pas downgrade un 'super_admin' avec cette fonction par sécurité
  
  const { data: user } = await supabase.from('User').select('role').eq('id', userId).single()
  if (user?.role === 'super_admin') {
    throw new Error("Impossible de modifier les droits du super administrateur fondateur.")
  }

  const newRole = isManager ? 'gestionnaire' : 'acheteur'

  const { error } = await supabase
    .from('User')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await logAdminAction(
    isManager ? 'A accordé les droits de Gestionnaire' : 'A révoqué les droits de Gestionnaire',
    'User',
    userId
  )
}

// ─── ANALYTICS GLOBALES (PLATEFORME) ─────────────────────────────────────────

export interface AdminAnalyticsData {
  totalRevenueVolume: number
  totalPlatformFees: number
  totalOrders: number
  totalStores: number
  totalBuyers: number
  recentOrdersCount: number
  activePromosCount: number
  recentLogsCount: number
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsData> {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysIso = thirtyDaysAgo.toISOString()

  // 1. Volumes Financiers Globaux (Commandes confirmées/livrées)
  const { data: orders } = await supabase
    .from('Order')
    .select('total_amount, platform_fee')
    .in('status', ['confirmed', 'preparing', 'shipped', 'delivered'])

  const totalRevenueVolume = (orders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const totalPlatformFees = (orders || []).reduce((sum, o) => sum + (o.platform_fee || 0), 0)
  const totalOrders = orders?.length || 0

  // 2. Utilisateurs et Boutiques
  const [{ count: storesCount }, { count: buyersCount }] = await Promise.all([
    supabase.from('Store').select('id', { count: 'exact', head: true }),
    supabase.from('User').select('id', { count: 'exact', head: true }).eq('role', 'acheteur')
  ])

  // 3. Activité Récente (30 derniers jours)
  const [{ count: recentOrdersCount }, { count: activePromosCount }, { count: recentLogsCount }] = await Promise.all([
    supabase.from('Order').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysIso),
    supabase.from('Promotion').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('AdminLog').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysIso)
  ])

  return {
    totalRevenueVolume,
    totalPlatformFees,
    totalOrders,
    totalStores: storesCount || 0,
    totalBuyers: buyersCount || 0,
    recentOrdersCount: recentOrdersCount || 0,
    activePromosCount: activePromosCount || 0,
    recentLogsCount: recentLogsCount || 0
  }
}

// ─── GESTION DES RETRAITS (PAYTECH) ──────────────────────────────────────────

import { msgWithdrawalApproved, msgWithdrawalFailed, msgWithdrawalRejected } from '@/lib/whatsapp/sendWhatsApp'

export interface AdminWithdrawal {
  id: string
  amount: number
  status: string
  payment_method: string
  requested_at: string
  processed_at: string | null
  notes: string | null
  vendor_name?: string
  vendor_phone?: string
  store_name?: string
  wallet?: {
    vendor: {
      user_id: string
      name: string
      store: { name: string } | null
    }
  }
}

export async function getAdminWithdrawals(): Promise<AdminWithdrawal[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Withdrawal')
    .select(`
      id, amount, status, payment_method, requested_at, processed_at, notes,
      wallet:Wallet(
        vendor:Store(
          user_id,
          name
        )
      )
    `)
    .order('requested_at', { ascending: false })

  if (error) throw new Error(error.message)

  // On récupère le nom/tel du vendeur en croisant avec User
  const withdrawals = await Promise.all(data.map(async (w: Record<string, unknown>) => {
    let vendorPhone = ''
    let vendorName = 'Inconnu'
    const wallet = w.wallet as Record<string, unknown> | null
    const vendor = wallet?.vendor as Record<string, unknown> | undefined
    const userId = vendor?.user_id as string | undefined

    if (userId) {
      const { data: ud } = await supabase.from('User').select('name, phone').eq('id', userId).single()
      if (ud) {
        vendorName = ud.name || 'Inconnu'
        vendorPhone = ud.phone || ''
      }
    }

    return {
      id: w.id as string,
      amount: w.amount as number,
      status: w.status as string,
      payment_method: w.payment_method as string,
      requested_at: w.requested_at as string,
      processed_at: w.processed_at as string | null,
      notes: w.notes as string | null,
      vendor_phone: vendorPhone,
      vendor_name: vendorName,
      store_name: (vendor?.name as string) || 'Boutique introuvable'
    }
  }))

  return withdrawals
}

export async function processWithdrawal(withdrawalId: string, action: 'approve' | 'reject', rejectReason?: string) {
  const supabase = await createClient()

  // 1. Récupérer les infos du retrait
  const { data: w, error: fetchErr } = await supabase
    .from('Withdrawal')
    .select('amount, status, payment_method, wallet_id')
    .eq('id', withdrawalId)
    .single()

  if (fetchErr || !w) throw new Error("Retrait introuvable")
  if (w.status !== 'pending') throw new Error(`Ce retrait est déjà ${w.status}`)

  const { data: wallet } = await supabase.from('Wallet').select('vendor_id').eq('id', w.wallet_id).single()
  
  let vendorName = 'Marchand'
  let vendorPhone = ''
  if (wallet?.vendor_id) {
     const { data: storeInfo } = await supabase.from('Store').select('user_id').eq('id', wallet.vendor_id).single()
     if (storeInfo?.user_id) {
       const { data: user } = await supabase.from('User').select('name, phone').eq('id', storeInfo.user_id).single()
       if (user) {
         vendorName = user.name
         vendorPhone = user.phone
       }
     }
  }

  if (action === 'reject') {
    // REJET MANUEL
    // 1. Revert du solde (Pending -> Balance)
    // NB: on va incrémenter balance et décrémenter pending via RPC ou get/set
    const { data: currentWallet } = await supabase.from('Wallet').select('balance, pending').eq('id', w.wallet_id).single()
    if (currentWallet) {
      await supabase.from('Wallet').update({
        balance: currentWallet.balance + w.amount,
        pending: currentWallet.pending - w.amount,
        updated_at: new Date().toISOString()
      }).eq('id', w.wallet_id)
    }

    // 2. Maj Statut
    await supabase.from('Withdrawal').update({
      status: 'rejected',
      processed_at: new Date().toISOString(),
      notes: rejectReason || 'Rejeté par l’administration.'
    }).eq('id', withdrawalId)

    // 3. Log & WhatsApp
    await logAdminAction('Retrait rejeté', 'Withdrawal', withdrawalId, { reason: rejectReason })
    
    if (vendorPhone) {
      await sendWhatsApp({
        to: vendorPhone,
        body: msgWithdrawalRejected({ amount: w.amount, reason: rejectReason || 'Non spécifié.' })
      })
    }

    return { success: true, message: 'Retrait rejeté avec succès.' }
  }


  // APPROBATION -> PAYTECH TRANSFER
  // 1. Passer en Processing avant l'appel API (évite les doublons)
  await supabase.from('Withdrawal').update({ status: 'processing' }).eq('id', withdrawalId)

  try {
    const apiKey = process.env.PAYTECH_API_KEY
    const apiSecret = process.env.PAYTECH_API_SECRET

    if (!apiKey || !apiSecret) {
      // MODE DEV / SIMULATION
      console.warn("⚠️ Cles API PayTech manquantes. Validation de test exécutée.")
      // On s'arrête pas s'il veut simuler, mais en prod ça plantera si manquant
    }

    const res = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'API_KEY': apiKey || '',
        'API_SECRET': apiSecret || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item_name: `Retrait Yayyam - ${vendorName}`,
        item_price: w.amount,
        currency: "XOF",
        ref_command: `WITHDRAWAL-${withdrawalId}`,
        ipn_url: "https://yayyam.com/api/ipn/withdrawal",
        success_url: "https://yayyam.com/admin/withdrawals",
        cancel_url: "https://yayyam.com/admin/withdrawals",
        payment_method: w.payment_method
      })
    })

    // On suppose que res.ok ou un flag json valident le succès. 
    // Si PayTech retourne une erreur (fonds insuffisants côté Yayyam, etc.), res.ok est ptet false.
    const textData = await res.text()
    console.log("[PayTech Transfer API] Réponse :", textData)

    if (res.ok) {
      // SUCCÈS PAYTECH
      await supabase.from('Withdrawal').update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        notes: 'PayTech Transfer Validé.'
      }).eq('id', withdrawalId)

      await logAdminAction('Retrait payé (PayTech)', 'Withdrawal', withdrawalId, { amount: w.amount })
      
      if (vendorPhone) {
        await sendWhatsApp({
          to: vendorPhone,
          body: msgWithdrawalApproved({ amount: w.amount, method: w.payment_method })
        })
      }
      return { success: true, message: 'Transfert d’argent réussi.' }

    } else {
      throw new Error(`Erreur API PayTech : ${res.statusText}`)
    }

  } catch (err: unknown) {
    // ÉCHEC PAYTECH (Réseau ou 400/500)
    const errMessage = err instanceof Error ? err.message : 'Erreur réseau inconnue'
    console.error("[processWithdrawal] Échec CashOut:", err)
    
    // 1. Revert du Pending -> Balance
    const { data: currentWallet } = await supabase.from('Wallet').select('balance, pending').eq('id', w.wallet_id).single()
    if (currentWallet) {
      await supabase.from('Wallet').update({
        balance: currentWallet.balance + w.amount,
        pending: currentWallet.pending - w.amount,
        updated_at: new Date().toISOString()
      }).eq('id', w.wallet_id)
    }

    // 2. Remettre statut 'failed'
    await supabase.from('Withdrawal').update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      notes: errMessage || 'Échec de la transaction PayTech.'
    }).eq('id', withdrawalId)

    await logAdminAction('Échec de transfert', 'Withdrawal', withdrawalId, { error: errMessage })

    if (vendorPhone) {
      await sendWhatsApp({
        to: vendorPhone,
        body: msgWithdrawalFailed({ amount: w.amount })
      })
    }

    throw new Error(`Échec du transfert PayTech. Solde restauré. Détail: ${errMessage}`)
  }
}
