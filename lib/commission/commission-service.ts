/**
 * Service central de calcul des commissions Yayyam
 *
 * MODÈLE DE COMMISSION :
 * ─────────────────────────────────────────────────────────────
 * Ventes en ligne (Wave / OM / CB) — Commission DÉGRESSIVE basée sur le CA du mois N-1 :
 *   0      – 100 000 FCFA/mois  → 8%  (1er mois = 8% par défaut)
 *   100 001 – 500 000 FCFA/mois → 7%
 *   500 001 – 1 000 000         → 6%
 *   +1 000 000                  → 5%
 *
 * COD (paiement à la livraison) — Taux FIXE :
 *   5% quel que soit le CA
 *   Uniquement sur produits physiques
 *   Condition : Wallet.balance >= commission_due avant acceptation
 *
 * IMPORTANT : Le taux est déterminé par le CA du MOIS PRÉCÉDENT (N-1).
 * => Le 1er du mois, le taux est fixé pour tout le mois.
 * => Si le CA baisse au mois N-1, la commission remonte (régression).
 * ─────────────────────────────────────────────────────────────
 */

import { getPlatformConfig } from '@/lib/admin/adminActions'
import { createAdminClient } from '@/lib/supabase/admin'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES UTILES
// ─────────────────────────────────────────────────────────────────────────────

/** Méthodes de paiement considérées comme "en ligne" (non-COD) */
const ONLINE_PAYMENT_METHODS = new Set([
  'wave',
  'orange_money',
  'cinetpay',
  'paytech',
  'card',
  'card_cinetpay',
  'card_paytech',
])

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS ASYNC (Configuration et Calculs)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère la grille tarifaire (les paliers + COD) depuis la BDD dynamique.
 * Valeurs par défaut : 8% / 7% / 6% / 5% (configurables via /admin/settings)
 */
export async function getCommissionTiers() {
  const cfg = await getPlatformConfig()
  return {
    COD_RATE: 0.05,
    TIERS: [
      { maxCA: 100_000,   rate: cfg.tier_1 / 100 },  // Défaut: 8%
      { maxCA: 500_000,   rate: cfg.tier_2 / 100 },  // Défaut: 7%
      { maxCA: 1_000_000, rate: cfg.tier_3 / 100 },  // Défaut: 6%
      { maxCA: Infinity,  rate: cfg.tier_4 / 100 },   // Défaut: 5%
    ]
  }
}

/**
 * Détermine le taux de commission applicable selon le CA du mois N-1.
 * Utilise le modèle dégressif Yayyam pour les ventes en ligne.
 * 
 * @param previousMonthCA - CA du mois PRÉCÉDENT (N-1) en FCFA
 */
export async function getCommissionRate(previousMonthCA: number): Promise<number> {
  const { TIERS } = await getCommissionTiers()
  const tier = TIERS.find(t => previousMonthCA <= t.maxCA)
  return tier?.rate ?? 0.08 // Fallback: 8% (palier le plus élevé)
}

/**
 * Retourne le label du palier actif pour affichage UI.
 */
export async function getCommissionTierLabel(monthlyCA: number): Promise<string> {
  const rate = await getCommissionRate(monthlyCA)
  const percent = Math.round(rate * 100)

  if (monthlyCA <= 100_000)   return `${percent}% (CA N-1 ≤ 100 000 FCFA)`
  if (monthlyCA <= 500_000)   return `${percent}% (CA N-1 ≤ 500 000 FCFA)`
  if (monthlyCA <= 1_000_000) return `${percent}% (CA N-1 ≤ 1 000 000 FCFA)`
  return `${percent}% (CA N-1 > 1 000 000 FCFA)`
}

/**
 * Calcule la commission Yayyam sur une vente.
 */
export async function calculateCommission(
  productBase:   number, // (subtotal - promo_discount)
  deliveryFee:   number,
  paymentMethod: string,
  previousMonthCA: number  // CA du mois N-1
): Promise<{ rate: number; platformFee: number; deliveryCommission: number; vendorAmount: number }> {
  // Déterminer le taux selon le type de paiement
  const isCOD = paymentMethod === 'cod'
  const { COD_RATE } = await getCommissionTiers()
  
  const rate   = isCOD ? COD_RATE : await getCommissionRate(previousMonthCA)

  const platformFee = Math.round(productBase * rate)
  const deliveryCommission = Math.round(deliveryFee * rate)
  const vendorAmount = (productBase + deliveryFee) - (platformFee + deliveryCommission)

  return { rate, platformFee, deliveryCommission, vendorAmount }
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS ASYNC (accès Supabase)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère le CA du mois PRÉCÉDENT (N-1) d'un vendeur depuis Supabase.
 * Somme des commandes avec les statuts 'paid', 'confirmed', 'completed'
 * entre le 1er et le dernier jour du mois précédent.
 *
 * C'est cette valeur qui détermine le taux de commission du mois en cours.
 * => Premier mois d'activité : CA N-1 = 0 → taux = 8%
 * => Si le CA baisse au mois N-1, le taux remonte (régression dégressive)
 *
 * @param storeId - UUID de la boutique
 * @returns CA du mois précédent en FCFA (0 si nouveau vendeur ou aucune vente)
 */
export async function getVendorMonthlyCA(storeId: string): Promise<number> {
  const supabase = createAdminClient()

  // Mois N-1 : du 1er du mois précédent au 1er du mois courant
  const now              = new Date()
  const prevMonthStart   = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data, error } = await supabase
    .from('Order')
    .select('total')
    .eq('store_id', storeId)
    .in('status', ['paid', 'confirmed', 'completed'])
    .gte('created_at', prevMonthStart)
    .lt('created_at', currentMonthStart)

  if (error) {
    // Erreur silencieuse : retourner 0 pour appliquer le taux le plus haut (8%)
    console.error('[CommissionService] getVendorMonthlyCA error:', error.message)
    return 0
  }

  // Sommer tous les totaux de commandes du mois N-1
  return (data ?? []).reduce((acc, order) => acc + (order.total ?? 0), 0)
}

/**
 * Vérifie si un vendeur peut accepter une commande COD.
 * Règle COD : Wallet.balance >= commission_due (5% du montant de la commande).
 *
 * @param storeId    - UUID de la boutique
 * @param orderTotal - Montant total de la commande COD en FCFA
 * @returns Objet { canAccept, walletBalance, commissionDue }
 */
export async function canAcceptCOD(
  storeId:    string,
  orderTotal: number, // subtotal - discount + delivery_fee
  closingFee: number = 0
): Promise<{ canAccept: boolean; walletBalance: number; commissionDue: number }> {
  const { COD_RATE } = await getCommissionTiers()
  const supabase        = createAdminClient()
  const commissionDue   = Math.round(orderTotal * COD_RATE) + closingFee

  const { data: wallet, error } = await supabase
    .from('Wallet')
    .select('balance')
    .eq('vendor_id', storeId)
    .single()

  if (error || !wallet) {
    // Pas de wallet → ne peut pas accepter le COD
    return { canAccept: false, walletBalance: 0, commissionDue }
  }

  const walletBalance = wallet.balance ?? 0
  const canAccept     = walletBalance >= commissionDue

  return { canAccept, walletBalance, commissionDue }
}

/**
 * Calcule la commission complète pour une commande en cours de création.
 * Récupère le CA mensuel si nécessaire, puis applique le bon taux.
 *
 * @param storeId       - UUID de la boutique
 * @param orderTotal    - Montant total en FCFA
 * @param paymentMethod - Méthode de paiement
 * @returns Résultat complet avec rate, commission, vendorAmount et monthlyCA
 */
export async function resolveOrderCommission(
  storeId:       string,
  productBase:   number,
  deliveryFee:   number,
  paymentMethod: string
): Promise<{
  rate:         number
  platformFee:   number
  deliveryCommission: number
  vendorAmount: number
  monthlyCA:    number
}> {
  const isCOD = paymentMethod === 'cod'

  // Pour le COD, le CA n'est pas pertinent (taux fixe)
  const monthlyCA = isCOD || !ONLINE_PAYMENT_METHODS.has(paymentMethod)
    ? 0
    : await getVendorMonthlyCA(storeId)

  const { rate, platformFee, deliveryCommission, vendorAmount } = await calculateCommission(
    productBase,
    deliveryFee,
    paymentMethod,
    monthlyCA
  )

  return { rate, platformFee, deliveryCommission, vendorAmount, monthlyCA }
}
