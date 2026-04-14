import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types exportés ───────────────────────────────────────────────────────────

export interface Ambassador {
  id: string
  userId: string
  storeId: string | null
  code: string
  name: string
  bio: string | null
  commissionPerVendor: number
  minCaRequirement: number
  totalReferred: number
  totalQualified: number
  totalEarned: number
  balance: number
  isActive: boolean
  createdAt: string
}

export interface AmbassadorReferral {
  id: string
  ambassadorId: string
  vendorStoreId: string
  registrationMonth: string
  caInRegistrationMonth: number
  isQualified: boolean
  commissionPaid: boolean
  commissionAmount: number
  createdAt: string
  Store?: { name: string; slug: string } | null
}

export interface AmbassadorTransaction {
  id: string
  ambassadorId: string
  referralId: string | null
  type: 'commission' | 'withdrawal' | 'bonus'
  amount: number
  description: string | null
  status: string
  createdAt: string
}

export interface AmbassadorStats {
  ambassador: Ambassador
  referrals: AmbassadorReferral[]
  recentTransactions: AmbassadorTransaction[]
  thisMonthReferrals: number
  pendingCommissions: number
  qualifiedThisMonth: number
}

// ─── Helpers de mapping snake_case → camelCase ────────────────────────────────

function mapAmbassador(row: Record<string, unknown>): Ambassador {
  return {
    id:                   String(row.id),
    userId:               String(row.user_id),
    storeId:              row.store_id != null ? String(row.store_id) : null,
    code:                 String(row.code),
    name:                 String(row.name),
    bio:                  row.bio != null ? String(row.bio) : null,
    commissionPerVendor:  Number(row.commission_per_vendor),
    minCaRequirement:     Number(row.min_ca_requirement),
    totalReferred:        Number(row.total_referred),
    totalQualified:       Number(row.total_qualified),
    totalEarned:          Number(row.total_earned),
    balance:              Number(row.balance),
    isActive:             Boolean(row.is_active),
    createdAt:            String(row.created_at),
  }
}

function mapReferral(row: Record<string, unknown>): AmbassadorReferral {
  const storeRaw = row.Store as { name: string; slug: string } | null | undefined
  return {
    id:                      String(row.id),
    ambassadorId:            String(row.ambassador_id),
    vendorStoreId:           String(row.vendor_store_id),
    registrationMonth:       String(row.registration_month),
    caInRegistrationMonth:   Number(row.ca_in_registration_month),
    isQualified:             Boolean(row.is_qualified),
    commissionPaid:          Boolean(row.commission_paid),
    commissionAmount:        Number(row.commission_amount),
    createdAt:               String(row.created_at),
    Store:                   storeRaw ?? null,
  }
}

function mapTransaction(row: Record<string, unknown>): AmbassadorTransaction {
  return {
    id:           String(row.id),
    ambassadorId: String(row.ambassador_id),
    referralId:   row.referral_id != null ? String(row.referral_id) : null,
    type:         row.type as 'commission' | 'withdrawal' | 'bonus',
    amount:       Number(row.amount),
    description:  row.description != null ? String(row.description) : null,
    status:       String(row.status),
    createdAt:    String(row.created_at),
  }
}

// ─── 1. Valider un code ambassadeur ──────────────────────────────────────────

/**
 * Vérifie qu'un code ambassadeur existe et est actif.
 * Retourne l'ambassadeur ou null.
 */
export async function validateAmbassadorCode(code: string): Promise<Ambassador | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('Ambassador')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  return mapAmbassador(data as Record<string, unknown>)
}

// ─── 2. Lier un vendeur à un ambassadeur ─────────────────────────────────────

/**
 * Appelée lors de l'inscription d'un nouveau vendeur.
 * Crée un AmbassadorReferral, met à jour la Store et incrémente total_referred.
 */
export async function linkVendorToAmbassador(
  ambassadorCode: string,
  storeId: string,
  registrationMonth: string
): Promise<void> {
  const supabase = createAdminClient()

  // 1. Récupérer l'ambassadeur
  const ambassador = await validateAmbassadorCode(ambassadorCode)
  if (!ambassador) {
    throw new Error('Code ambassadeur invalide ou inactif')
  }

  // 2. Insérer le referral
  const { error: referralError } = await supabase
    .from('AmbassadorReferral')
    .insert({
      ambassador_id:      ambassador.id,
      vendor_store_id:    storeId,
      registration_month: registrationMonth,
    })

  if (referralError) {
    console.error('[Ambassador] Erreur création referral:', referralError.message)
    throw new Error(`Erreur lors du lien ambassadeur : ${referralError.message}`)
  }

  // 3. Mettre à jour la boutique du vendeur
  const { error: storeError } = await supabase
    .from('Store')
    .update({
      referred_by_ambassador: ambassador.id,
      registration_month:     registrationMonth,
    })
    .eq('id', storeId)

  if (storeError) {
    console.error('[Ambassador] Erreur mise à jour Store:', storeError.message)
    // Ne pas bloquer l'inscription — le referral est déjà créé
  }

  // 4. Incrémenter total_referred sur l'ambassadeur
  const { error: updateError } = await supabase
    .from('Ambassador')
    .update({ total_referred: ambassador.totalReferred + 1 })
    .eq('id', ambassador.id)

  if (updateError) {
    console.error('[Ambassador] Erreur incrémentation total_referred:', updateError.message)
    // Non bloquant
  }
}

// ─── 3. Traitement mensuel des commissions ────────────────────────────────────

/**
 * Appelée par le cron le 1er de chaque mois.
 * Pour chaque referral du mois `month` non encore payé :
 *   - Calcule le CA du vendeur sur son mois d'inscription
 *   - Si CA >= seuil → crédite la commission à l'ambassadeur
 *
 * @param month Format "2026-03"
 */
export async function processMonthlyAmbassadorCommissions(month: string): Promise<{
  processed: number
  paid: number
  totalAmount: number
}> {
  const supabase = createAdminClient()

  // Plage de dates du mois (UTC)
  const [year, monthNum] = month.split('-').map(Number)
  const monthStart = new Date(year, monthNum - 1, 1).toISOString()
  const monthEnd   = new Date(year, monthNum, 1).toISOString()

  // Tous les referrals du mois non encore payés
  const { data: referrals, error: fetchError } = await supabase
    .from('AmbassadorReferral')
    .select('*')
    .eq('registration_month', month)
    .eq('commission_paid', false)

  if (fetchError) {
    console.error('[Ambassador Cron] Erreur récupération referrals:', fetchError.message)
    return { processed: 0, paid: 0, totalAmount: 0 }
  }

  const rows = (referrals ?? []) as Record<string, unknown>[]
  let processed = 0
  let paid = 0
  let totalAmount = 0

  for (const row of rows) {
    const referral = mapReferral(row)
    processed++

    try {
      // a. Récupérer l'ambassadeur
      const { data: ambRow, error: ambError } = await supabase
        .from('Ambassador')
        .select('*')
        .eq('id', referral.ambassadorId)
        .single()

      if (ambError || !ambRow) {
        console.warn(`[Ambassador Cron] Ambassadeur introuvable pour referral ${referral.id}`)
        continue
      }

      const ambassador = mapAmbassador(ambRow as Record<string, unknown>)

      // b. Calculer le CA du vendeur sur son mois d'inscription
      const { data: orders, error: ordersError } = await supabase
        .from('Order')
        .select('total')
        .eq('store_id', referral.vendorStoreId)
        .in('status', ['completed', 'confirmed', 'paid'])
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd)

      if (ordersError) {
        console.warn(`[Ambassador Cron] Erreur CA pour store ${referral.vendorStoreId}:`, ordersError.message)
        continue
      }

      const ca = (orders ?? []).reduce(
        (sum, order) => sum + Number((order as Record<string, unknown>).total ?? 0),
        0
      )

      // c. Mettre à jour le CA dans le referral
      await supabase
        .from('AmbassadorReferral')
        .update({ ca_in_registration_month: ca })
        .eq('id', referral.id)

      // d. Vérifier KYC du filleul (condition obligatoire)
      const { data: referralStore } = await supabase
        .from('Store')
        .select('kyc_status')
        .eq('id', referral.vendorStoreId)
        .single()

      if (referralStore?.kyc_status !== 'verified') {
        console.log(
          `[Ambassador Cron] Referral ${referral.id} : KYC non vérifié — skip`
        )
        continue
      }

      // e. Vérifier si le vendeur a atteint le seuil de CA
      if (ca < ambassador.minCaRequirement) {
        console.log(
          `[Ambassador Cron] Referral ${referral.id} : CA ${ca} < seuil ${ambassador.minCaRequirement} — pas de commission`
        )
        continue
      }

      const commissionAmount = ambassador.commissionPerVendor

      // Marquer le referral comme qualifié et payé
      const { error: qualifyError } = await supabase
        .from('AmbassadorReferral')
        .update({
          is_qualified:     true,
          commission_paid:  true,
          commission_amount: commissionAmount,
        })
        .eq('id', referral.id)

      if (qualifyError) {
        console.error(`[Ambassador Cron] Erreur qualification referral ${referral.id}:`, qualifyError.message)
        continue
      }

      // Créditer l'ambassadeur (atomique via RPC)
      const { error: creditError } = await supabase
        .rpc('credit_ambassador', {
          p_ambassador_id: ambassador.id,
          p_amount:        commissionAmount,
        })

      if (creditError) {
        console.error(`[Ambassador Cron] Erreur crédit ambassadeur ${ambassador.id}:`, creditError.message)
        continue
      }

      // Enregistrer la transaction
      const { error: txError } = await supabase
        .from('AmbassadorTransaction')
        .insert({
          ambassador_id: ambassador.id,
          referral_id:   referral.id,
          type:          'commission',
          amount:        commissionAmount,
          description:   `Commission vendeur qualifié — mois ${month}`,
          status:        'completed',
        })

      if (txError) {
        console.error(`[Ambassador Cron] Erreur insertion transaction:`, txError.message)
        // Non bloquant — le crédit est déjà effectué
      }

      paid++
      totalAmount += commissionAmount

      console.log(
        `[Ambassador Cron] ✅ Commission ${commissionAmount} FCFA créditée à ${ambassador.name} (referral ${referral.id})`
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      console.error(`[Ambassador Cron] ❌ Erreur silencieuse referral ${referral.id}:`, message)
      // Continuer les autres referrals
    }
  }

  return { processed, paid, totalAmount }
}

// ─── 4. Statistiques d'un ambassadeur ────────────────────────────────────────

/**
 * Retourne toutes les statistiques d'un ambassadeur à partir de son user_id.
 */
export async function getAmbassadorStats(userId: string): Promise<AmbassadorStats | null> {
  const supabase = createAdminClient()

  // Récupérer l'ambassadeur
  const { data: ambRow, error: ambError } = await supabase
    .from('Ambassador')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (ambError || !ambRow) return null

  const ambassador = mapAmbassador(ambRow as Record<string, unknown>)

  // Mois courant au format "YYYY-MM"
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Referrals avec info boutique
  const { data: referralRows } = await supabase
    .from('AmbassadorReferral')
    .select('*, Store(name, slug)')
    .eq('ambassador_id', ambassador.id)
    .order('created_at', { ascending: false })

  const referrals = (referralRows ?? []).map(r => mapReferral(r as Record<string, unknown>))

  // 10 dernières transactions
  const { data: txRows } = await supabase
    .from('AmbassadorTransaction')
    .select('*')
    .eq('ambassador_id', ambassador.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const recentTransactions = (txRows ?? []).map(t => mapTransaction(t as Record<string, unknown>))

  // Stats du mois courant
  const thisMonthReferrals = referrals.filter(r => r.registrationMonth === currentMonth).length
  const qualifiedThisMonth = referrals.filter(
    r => r.registrationMonth === currentMonth && r.isQualified
  ).length
  const pendingCommissions = referrals.filter(
    r => !r.commissionPaid && !r.isQualified
  ).length

  return {
    ambassador,
    referrals,
    recentTransactions,
    thisMonthReferrals,
    pendingCommissions,
    qualifiedThisMonth,
  }
}

// ─── 5. Activer le Profil Ambassadeur ────────────────────────────────────────

/**
 * Génère un code de parrainage et inscrit l'utilisateur au programme Ambassadeur.
 */
export async function activateAmbassadorProfile(userId: string): Promise<Ambassador | null> {
  const supabase = createAdminClient()
  
  // 1. Récupérer les infos de l'utilisateur
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('name')
    .eq('id', userId)
    .single()
    
  if (userError || !user) throw new Error('Utilisateur introuvable')
  
  // 2. Générer un code unique (3 premières lettres + 4 chiffres)
  const prefix = (user.name || 'YAY').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'Y')
  const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
  
  // 3. Récupérer les taux par défaut (PlatformConfig)
  const { data: configs } = await supabase
    .from('PlatformConfig')
    .select('key, value')
    .in('key', ['ambassador_commission_fixed', 'ambassador_min_revenue'])
    
  const configMap = Object.fromEntries(configs?.map(c => [c.key, c.value]) || [])
  const commission = parseInt(configMap['ambassador_commission_fixed'] || '10000', 10)
  const minCa = parseInt(configMap['ambassador_min_revenue'] || '50000', 10)
  
  // Chercher un store existant
  const { data: store } = await supabase.from('Store').select('id').eq('user_id', userId).maybeSingle()
  
  // 4. Créer l'ambassadeur
  const { data: newAmbassador, error: insertError } = await supabase
    .from('Ambassador')
    .insert({
      user_id: userId,
      store_id: store?.id || null,
      code,
      name: user.name,
      commission_per_vendor: commission,
      min_ca_requirement: minCa,
      is_active: true
    })
    .select()
    .single()
    
  if (insertError) {
    if (insertError.code === '23505') { // Unique violation
      return getAmbassadorStats(userId).then(stats => stats?.ambassador || null)
    }
    throw new Error(`Erreur lors de la création du profil ambassadeur: ${insertError.message}`)
  }
  
  return mapAmbassador(newAmbassador as Record<string, unknown>)
}
