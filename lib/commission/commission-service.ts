/**
 * Service central de calcul des commissions PDV Pro
 *
 * MODÈLE DE COMMISSION :
 * ─────────────────────────────────────────────────────────────
 * Ventes en ligne (Wave / OM / CB) — Commission DÉGRESSIVE :
 *   0      – 100 000 FCFA/mois  → 7%
 *   100 001 – 500 000 FCFA/mois → 6%
 *   500 001 – 1 000 000         → 5%
 *   +1 000 000                  → 4%
 *
 * COD (paiement à la livraison) — Taux FIXE :
 *   5% quel que soit le CA
 *   Uniquement sur produits physiques
 *   Condition : Wallet.balance >= commission_due avant acceptation
 * ─────────────────────────────────────────────────────────────
 */

import { createAdminClient } from '@/lib/supabase/admin'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

/** Paliers de commission dégressive pour les ventes en ligne */
const COMMISSION_TIERS = [
  { maxCA: 100_000,   rate: 0.08 },  // 8% — 0 à 100 000 FCFA/mois
  { maxCA: 500_000,   rate: 0.07 },  // 7% — 100 001 à 500 000 FCFA/mois
  { maxCA: 1_000_000, rate: 0.06 },  // 6% — 500 001 à 1 000 000 FCFA/mois
  { maxCA: Infinity,  rate: 0.05 },  // 5% — Au-delà de 1 000 000 FCFA/mois
] as const

/** Taux fixe pour le COD — 5% indépendamment du CA */
export const COD_RATE = 0.05

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
// FONCTIONS PURES (calculateurs)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Détermine le taux de commission applicable selon le CA mensuel du vendeur.
 * Utilise le modèle dégressif PDV Pro pour les ventes en ligne.
 *
 * @param monthlyCA - CA mensuel du vendeur en FCFA
 * @returns Taux de commission (ex: 0.07 pour 7%)
 */
export function getCommissionRate(monthlyCA: number): number {
  // Retourner le taux du premier palier dont le CA est inférieur au maxCA
  const tier = COMMISSION_TIERS.find(t => monthlyCA <= t.maxCA)
  // Le dernier palier (Infinity) garantit qu'un tier est toujours trouvé
  return tier?.rate ?? 0.05
}

/**
 * Retourne le label du palier actif pour affichage UI.
 *
 * @param monthlyCA - CA mensuel du vendeur en FCFA
 * @returns Ex: "4% (CA > 1 000 000 FCFA)"
 */
export function getCommissionTierLabel(monthlyCA: number): string {
  const rate = getCommissionRate(monthlyCA)
  const percent = Math.round(rate * 100)

  if (monthlyCA <= 100_000)   return `${percent}% (CA ≤ 100 000 FCFA)`
  if (monthlyCA <= 500_000)   return `${percent}% (CA ≤ 500 000 FCFA)`
  if (monthlyCA <= 1_000_000) return `${percent}% (CA ≤ 1 000 000 FCFA)`
  return `${percent}% (CA > 1 000 000 FCFA)`
}

/**
 * Calcule la commission PDV Pro sur une vente.
 *
 * @param orderTotal     - Montant total de la commande en FCFA
 * @param paymentMethod  - 'cod' | 'wave' | 'orange_money' | 'cinetpay' | 'paytech' | 'card_*'
 * @param monthlyCA      - CA mensuel du vendeur (utilisé uniquement pour les ventes en ligne)
 * @returns Objet contenant le taux appliqué, la commission en FCFA, et le montant net vendeur
 */
export function calculateCommission(
  productBase:   number, // (subtotal - promo_discount)
  deliveryFee:   number,
  paymentMethod: string,
  monthlyCA:     number
): { rate: number; platformFee: number; deliveryCommission: number; vendorAmount: number } {
  // Déterminer le taux selon le type de paiement
  const isCOD = paymentMethod === 'cod'
  const rate   = isCOD ? COD_RATE : getCommissionRate(monthlyCA)

  const platformFee = Math.round(productBase * rate)
  const deliveryCommission = Math.round(deliveryFee * rate)
  const vendorAmount = (productBase + deliveryFee) - (platformFee + deliveryCommission)

  return { rate, platformFee, deliveryCommission, vendorAmount }
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS ASYNC (accès Supabase)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère le CA mensuel (CA confirmé) d'un vendeur depuis Supabase.
 * Somme des commandes avec les statuts 'paid', 'confirmed', 'completed'.
 * du mois calendaire en cours.
 *
 * @param storeId - UUID de la boutique
 * @returns CA mensuel en FCFA (0 si aucune vente ce mois)
 */
export async function getVendorMonthlyCA(storeId: string): Promise<number> {
  const supabase = createAdminClient()

  // Début du mois courant en UTC
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data, error } = await supabase
    .from('Order')
    .select('total')
    .eq('store_id', storeId)
    .in('status', ['paid', 'confirmed', 'completed'])
    .gte('created_at', monthStart)

  if (error) {
    // Erreur silencieuse : retourner 0 pour appliquer le taux le plus bas (7%)
    console.error('[CommissionService] getVendorMonthlyCA error:', error.message)
    return 0
  }

  // Sommer tous les totaux de commandes du mois
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

  const { rate, platformFee, deliveryCommission, vendorAmount } = calculateCommission(
    productBase,
    deliveryFee,
    paymentMethod,
    monthlyCA
  )

  return { rate, platformFee, deliveryCommission, vendorAmount, monthlyCA }
}
