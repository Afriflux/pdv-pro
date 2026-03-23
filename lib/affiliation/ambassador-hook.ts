import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Crédite le portefeuille d'un ambassadeur (affilié) lorsqu'une commande
 * contenant son code de tracking est confirmée/livrée.
 */
export async function triggerAmbassadorCommission(
  orderId: string,
  affiliateToken: string | null,
  affiliateAmount: number | null
): Promise<void> {
  if (!affiliateToken || !affiliateAmount || affiliateAmount <= 0) return

  try {
    const supabaseAdmin = createAdminClient()

    // 1. Trouver l'affilié via son code
    const { data: affiliate, error: affError } = await supabaseAdmin
      .from('Affiliate')
      .select('id, user_id, total_earnings, total_sales, status')
      .eq('code', affiliateToken)
      .single()

    if (affError || !affiliate || affiliate.status !== 'active') {
      console.log(`[AmbassadorHook] Affilié ignoré (inactif ou non trouvé) - Code: ${affiliateToken}`)
      return
    }

    // 2. Mettre à jour les statistiques globales de l'Affilié
    const newTotalEarnings = (affiliate.total_earnings || 0) + affiliateAmount
    const newTotalSales = (affiliate.total_sales || 0) + 1

    await supabaseAdmin
      .from('Affiliate')
      .update({
        total_earnings: newTotalEarnings,
        total_sales: newTotalSales
      })
      .eq('id', affiliate.id)

    // 3. Trouver la boutique (Store) appartenant à cet utilisateur pour créditer son Wallet
    //    En effet, chaque utilisateur gagnant de l'argent doit avoir un Wallet lié à son Store_id.
    const { data: userStore, error: storeError } = await supabaseAdmin
      .from('Store')
      .select('id')
      .eq('user_id', affiliate.user_id)
      .single()

    if (!storeError && userStore) {
      // Vérifier si le wallet existe
      const { data: wallet } = await supabaseAdmin
        .from('Wallet')
        .select('id, balance, total_earned')
        .eq('vendor_id', userStore.id)
        .single()

      if (wallet) {
        // Mettre à jour le Wallet existant
        await supabaseAdmin
          .from('Wallet')
          .update({
            balance: (wallet.balance || 0) + affiliateAmount,
            total_earned: (wallet.total_earned || 0) + affiliateAmount
          })
          .eq('id', wallet.id)
      } else {
        // Créer le Wallet s'il n'existe pas encore
        await supabaseAdmin.from('Wallet').insert({
          vendor_id: userStore.id,
          balance: affiliateAmount,
          total_earned: affiliateAmount,
          pending: 0
        })
      }
      
      console.log(`[AmbassadorHook] Succès: ${affiliateAmount} F crédités à l'ambassadeur ${affiliateToken} pour l'ordre ${orderId}.`)
    } else {
      console.warn(`[AmbassadorHook] Attention: L'affilié ${affiliateToken} n'a pas de Store/Wallet pour recevoir l'argent. Gain mis en attente sur son profil Affilié.`)
    }

  } catch (err) {
    console.error(`[AmbassadorHook] Erreur générale lors du crédit ambassadeur pour l'ordre ${orderId}:`, err)
  }
}
