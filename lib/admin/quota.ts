import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export type QuotaFeature = 'link_bio' | 'telegram_vip' | 'workflows'

/**
 * Fonction métier pour vérifier si un utilisateur a atteint son plafond Freemium.
 * Renvoie { allowed: true } si autorisé, ou { allowed: false, limit: X } s'il est bloqué
 */
export async function checkUserQuota(userId: string, feature: QuotaFeature): Promise<{ allowed: boolean; currentCount: number; limit: number; isPremium: boolean }> {
  try {
    const supabase = await createClient()

    // 1. Récupération du Vendeur et de la Boutique
    const { data: user } = await supabase.from('User').select('role').eq('id', userId).single()
    if (!user) return { allowed: false, currentCount: 0, limit: 0, isPremium: false }

    const { data: store } = await supabase.from('Store').select('id').eq('user_id', userId).single()
    if (!store) return { allowed: false, currentCount: 0, limit: 0, isPremium: false }

    // 2. Vérification s'il est VIP/Premium de façon globale (ex: abonnement fondateur)
    const IS_SUPER_ADMIN = user.role === 'super_admin' || user.role === 'gestionnaire'
    if (IS_SUPER_ADMIN) {
      return { allowed: true, currentCount: 0, limit: Infinity, isPremium: true }
    }

    // 3. Charger les limites configurées par l'Admin (Fallback local si non trouvées)
    const keys = ['freemium_link_bio', 'freemium_telegram_vip', 'freemium_workflows']
    const configRows = await prisma.platformConfig.findMany({ take: 50,  where: { key: { in: keys } } })
    
    const getConfigMap = (k: string, fallback: number) => {
       const row = configRows.find(r => r.key === k)
       return row && row.value ? parseInt(row.value, 10) : fallback
    }

    let defaultLimit = 1;
    let currentUsage = 0;
    let hasBoughtPremiumApp = false;

    // --- LOGIQUE PAR FONCTIONNALITÉ ---
    switch(feature) {
       case 'link_bio':
         defaultLimit = getConfigMap('freemium_link_bio', 1)
         // Vérifier s'il a acheté le thème ou "Link In Bio Pro" dans AssetPurchase
         hasBoughtPremiumApp = await prisma.assetPurchase.count({
            where: { store_id: store.id, asset_type: 'app', asset_id: 'links' }
         }) > 0
         
         // Compter le nombre de pages Link in bio créées
         currentUsage = await prisma.bioLink.count({
            where: { user_id: userId }
         }).catch(() => 0)
         break;

       case 'telegram_vip':
         defaultLimit = getConfigMap('freemium_telegram_vip', 50)
         // S'il a activé Telegram Hub Illimité
         hasBoughtPremiumApp = await prisma.assetPurchase.count({
            where: { store_id: store.id, asset_type: 'app', asset_id: 'telegram' }
         }) > 0

         // Nombre d'acheteurs ayant accès à ses groupes
         currentUsage = await prisma.telegramMember.count({
            where: { order: { store_id: store.id }, status: 'active' }
         }).catch(() => 0)
         break;

       case 'workflows':
         defaultLimit = getConfigMap('freemium_workflows', 2)
         // S'il a débloqué des packs workflows
         hasBoughtPremiumApp = await prisma.assetPurchase.count({
            where: { store_id: store.id, asset_type: 'app', asset_id: 'workflows' }
         }) > 0

         // Nombre d'automatisations actives (ou créées)
         currentUsage = await prisma.workflow.count({
            where: { store_id: store.id, status: 'active' }
         }).catch(() => 0)
         break;
    }

    // S'il a acheté le module premium une fois, il n'a plus de limite ! 🔥
    if (hasBoughtPremiumApp) {
       return { allowed: true, currentCount: currentUsage, limit: Infinity, isPremium: true }
    }

    // Validation Freemium
    return {
       allowed: currentUsage < defaultLimit,
       currentCount: currentUsage,
       limit: defaultLimit,
       isPremium: false
    }

  } catch (error) {
     console.error("Erreur de Quota:", error)
     return { allowed: false, currentCount: 0, limit: 0, isPremium: false }
  }
}
