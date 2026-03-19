import { createAdminClient } from '@/lib/supabase/admin'
import { creditAffiliateCommission } from './affiliate-service'

// ----------------------------------------------------------------
// INTÉGRATION DANS confirmOrder.ts :
// Après l'étape 5 (créditage wallet vendeur), ajouter :
// triggerAffiliateCommission(orderId, order.store_id, order.total, order.vendor_amount)
//   .catch(e => console.error('[Affiliation]', e))
// ----------------------------------------------------------------

/**
 * Déclenche le calcul et le crédit de la commission d'affiliation après une vente.
 * Cette opération est asynchrone et silencieuse pour ne pas impacter le tunnel de commande.
 */
export async function triggerAffiliateCommission(
  orderId: string,
  storeId: string,
  orderTotal: number,
  vendorAmount: number
): Promise<void> {
  try {
    const supabaseAdmin = createAdminClient()

    // 1. Récupérer le parrain de la boutique qui a fait la vente
    const { data: store, error: storeError } = await supabaseAdmin
      .from('Store')
      .select('referred_by')
      .eq('id', storeId)
      .single()

    if (storeError || !store || !store.referred_by) {
      return // Pas de parrain pour cette boutique
    }

    // 2. Trouver le profil affilié correspondant au parrain
    const { data: affiliate, error: affError } = await supabaseAdmin
      .from('Affiliate')
      .select('id, is_active')
      .eq('store_id', store.referred_by)
      .single()

    if (affError || !affiliate || !affiliate.is_active) {
      return // Le parrain n'a pas de profil affilié ou il est inactif
    }

    // 3. Calculer la commission de la plateforme (base de calcul pour l'affilié)
    // platformCommission = total payé par le client - somme reçue par le vendeur
    const platformCommission = orderTotal - vendorAmount

    if (platformCommission <= 0) {
      return // Pas de marge plateforme, pas de commission affiliation possible
    }

    // 4. Créditer la commission via le service métier
    await creditAffiliateCommission(
      orderId,
      storeId,
      orderTotal,
      platformCommission
    )

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error(`[AffiliateHook] Erreur lors du déclenchement de la commission: ${msg}`, error)
  }
}
