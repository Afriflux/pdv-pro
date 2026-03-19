import { createAdminClient } from '@/lib/supabase/admin'

// ----------------------------------------------------------------
// TYPES & INTERFACES EXPORTÉES
// ----------------------------------------------------------------

export interface Affiliate {
  id: string
  store_id: string
  code: string
  balance: number
  total_earned: number
  total_referred: number
  active_referred: number
  commission_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AffiliateReferral {
  id: string
  affiliate_id: string
  referred_store_id: string
  status: 'pending' | 'active' | 'churned'
  first_order_at: string | null
  total_orders: number
  total_revenue: number
  created_at: string
  Store?: { name: string } // Jointure optionnelle
}

export interface AffiliateTransaction {
  id: string
  affiliate_id: string
  referral_id: string | null
  order_id: string | null
  type: 'commission' | 'withdrawal' | 'adjustment'
  amount: number
  rate: number | null
  status: 'pending' | 'completed' | 'cancelled'
  description: string | null
  created_at: string
}

export interface AffiliateStats {
  affiliate: Affiliate
  referrals: AffiliateReferral[]
  recentTransactions: AffiliateTransaction[]
  thisMonthEarnings: number
  thisMonthReferrals: number
}

// ----------------------------------------------------------------
// LOGIQUE MÉTIER
// ----------------------------------------------------------------

/**
 * Génère un code d'affiliation unique basé sur le nom de la boutique.
 * Ex: BOUTIQUE -> BOUTI + 123
 */
export async function generateAffiliateCode(storeName: string): Promise<string> {
  const supabase = createAdminClient()
  
  // Nettoyer le nom (majuscules, pas d'espaces, pas de caractères spéciaux)
  const cleanName = storeName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 5)
  
  // Fonction interne pour générer une tentative
  const generateAttempt = () => {
    const randomDigits = Math.floor(100 + Math.random() * 900).toString()
    return `${cleanName}${randomDigits}`
  }

  let code = generateAttempt()
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 5) {
    const { data } = await supabase
      .from('Affiliate')
      .select('id')
      .eq('code', code)
      .single()
    
    if (!data) {
      isUnique = true
    } else {
      code = generateAttempt()
      attempts++
    }
  }

  return code
}

/**
 * Crée un profil d'affilié pour une boutique existante.
 */
export async function createAffiliate(storeId: string): Promise<Affiliate> {
  const supabase = createAdminClient()

  // 1. Vérifier si l'affilié existe déjà
  const { data: existing } = await supabase
    .from('Affiliate')
    .select('*')
    .eq('store_id', storeId)
    .single()

  if (existing) return existing as Affiliate

  // 2. Récupérer le nom de la boutique pour le code
  const { data: store, error: storeError } = await supabase
    .from('Store')
    .select('name')
    .eq('id', storeId)
    .single()

  if (storeError || !store) {
    throw new Error('Boutique introuvable pour la création du profil affilié')
  }

  // 3. Générer le code et insérer
  const code = await generateAffiliateCode(store.name)

  const { data: created, error: insertError } = await supabase
    .from('Affiliate')
    .insert({
      store_id: storeId,
      code,
      commission_rate: 5.00 // Taux de départ
    })
    .select()
    .single()

  if (insertError || !created) {
    throw new Error(`Erreur lors de l'insertion de l'affilié : ${insertError?.message}`)
  }

  return created as Affiliate
}

/**
 * Calcule le taux de commission dynamique selon le nombre de filleuls actifs.
 */
export function calculateCommissionRate(activeReferrals: number): number {
  if (activeReferrals >= 21) return 12 // Palier 3
  if (activeReferrals >= 6) return 8   // Palier 2
  return 5                            // Palier 1
}

interface ReferralUpdate {
  total_orders: number
  total_revenue: number
  first_order_at?: string
  status?: 'active'
}

/**
 * Crédite la commission à l'affilié lors d'une commande réussie d'un filleul.
 * Cette fonction est conçue pour être "silencieuse" (ne pas bloquer le flux principal).
 */
export async function creditAffiliateCommission(
  orderId: string,
  referredStoreId: string,
  orderAmount: number,
  platformCommission: number
): Promise<void> {
  try {
    const supabase = createAdminClient()

    // 1. Trouver le lien de parrainage
    const { data: referral, error: refError } = await supabase
      .from('AffiliateReferral')
      .select('*, affiliate_id')
      .eq('referred_store_id', referredStoreId)
      .single()

    if (refError || !referral) return // Pas de parrain, on arrête silencieusement

    // 2. Trouver le parrain (Affiliate)
    const { data: affiliate, error: affError } = await supabase
      .from('Affiliate')
      .select('*')
      .eq('id', referral.affiliate_id)
      .single()

    if (affError || !affiliate || !affiliate.is_active) return

    // 3. Calculer le montant de la commission
    // commissionAmount = platformCommission * (taux_affilié / 100)
    const commissionAmount = Number((platformCommission * (affiliate.commission_rate / 100)).toFixed(2))

    if (commissionAmount < 1) return // Commission trop petite pour être traitée

    // 4. Créer la transaction de commission
    const { error: txError } = await supabase
      .from('AffiliateTransaction')
      .insert({
        affiliate_id: affiliate.id,
        referral_id: referral.id,
        order_id: orderId,
        type: 'commission',
        amount: commissionAmount,
        rate: affiliate.commission_rate,
        status: 'completed',
        description: `Commission sur commande ${orderId}`
      })

    if (txError) throw txError

    // 5. Mettre à jour le solde du parrain
    const { error: balError } = await supabase
      .from('Affiliate')
      .update({
        balance: affiliate.balance + commissionAmount,
        total_earned: affiliate.total_earned + commissionAmount
      })
      .eq('id', affiliate.id)

    if (balError) throw balError

    // 6. Mettre à jour les stats du filleul
    const isFirstOrder = !referral.first_order_at
    const updateReferral: ReferralUpdate = {
      total_orders: referral.total_orders + 1,
      total_revenue: referral.total_revenue + orderAmount,
    }

    if (isFirstOrder) {
      updateReferral.first_order_at = new Date().toISOString()
      updateReferral.status = 'active'
    }

    await supabase
      .from('AffiliateReferral')
      .update(updateReferral)
      .eq('id', referral.id)

    // 7. Recalculer et mettre à jour le taux de commission si nécessaire
    // Note: Pour une implémentation complète, "active_referred" devrait être recalculé périodiquement
    // Ici on utilise la valeur stockée
    const nextRate = calculateCommissionRate(affiliate.active_referred)
    if (nextRate !== affiliate.commission_rate) {
      await supabase
        .from('Affiliate')
        .update({ commission_rate: nextRate })
        .eq('id', affiliate.id)
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error(`[AffiliateService] Erreur lors du crédit de commission: ${msg}`, error)
  }
}

/**
 * Récupère les statistiques complètes d'un affilié pour son dashboard.
 */
export async function getAffiliateStats(storeId: string): Promise<AffiliateStats | null> {
  const supabase = createAdminClient()

  // 1. Récupérer le profil affilié
  const { data: affiliate } = await supabase
    .from('Affiliate')
    .select('*')
    .eq('store_id', storeId)
    .single()

  if (!affiliate) return null

  // 2. Récupérer les filleuls (avec le nom de leur boutique)
  const { data: referrals } = await supabase
    .from('AffiliateReferral')
    .select('*, Store:referred_store_id(name)')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  // 3. Récupérer les 10 dernières transactions
  const { data: transactions } = await supabase
    .from('AffiliateTransaction')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // 4. Calculs mensuels
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Gains du mois
  const { data: monthTx } = await supabase
    .from('AffiliateTransaction')
    .select('amount')
    .eq('affiliate_id', affiliate.id)
    .eq('type', 'commission')
    .gte('created_at', startOfMonth.toISOString())

  const thisMonthEarnings = (monthTx || []).reduce((sum, tx) => sum + Number(tx.amount), 0)

  // Nouveaux filleuls du mois
  const { count: thisMonthReferrals } = await supabase
    .from('AffiliateReferral')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_id', affiliate.id)
    .gte('created_at', startOfMonth.toISOString())

  return {
    affiliate: affiliate as Affiliate,
    referrals: (referrals || []).map(r => ({
      ...r,
      Store: (r as AffiliateReferral & { Store: { name: string } }).Store // Formatage pour l'interface
    })) as AffiliateReferral[],
    recentTransactions: (transactions || []) as AffiliateTransaction[],
    thisMonthEarnings,
    thisMonthReferrals: thisMonthReferrals || 0
  }
}
