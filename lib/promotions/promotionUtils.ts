/**
 * lib/promotions/promotionUtils.ts
 * Utilitaires pour calculer les réductions côté client ou serveur de manière sécurisée (Zéro any).
 */
import { PromotionData } from './promotionType'

export interface ComputedPrice {
  originalPrice: number
  finalPrice: number
  hasDiscount: boolean
  activePromo: PromotionData | null
}

/**
 * Calcule le prix final d'un produit selon la liste totale de promotions actives d'une boutique.
 * Applique la règle : la meilleure promotion spécifique l'emporte, 
 * sinon la meilleure promotion globale à la boutique.
 */
export function computeProductPrice(
  basePrice: number, 
  productId: string, 
  activePromotions: PromotionData[]
): ComputedPrice {
  // Ignorer les promos futures ou expirées
  const now = new Date()
  const validPromos = activePromotions.filter(p => {
    if (!p.active) return false
    if (new Date(p.starts_at) > now) return false
    if (p.ends_at && new Date(p.ends_at) < now) return false
    return true
  })

  // Sépare promos spécifiques au produit vs promos globales (store-wide)
  const productPromos = validPromos.filter(p => p.product_ids.length > 0 && p.product_ids.includes(productId))
  const globalPromos = validPromos.filter(p => p.product_ids.length === 0)

  // Priorité : Promo Spécifique la plus avantageuse, sinon Globale la plus avantageuse
  const candidates = productPromos.length > 0 ? productPromos : globalPromos

  if (candidates.length === 0) {
    return {
      originalPrice: basePrice,
      finalPrice: basePrice,
      hasDiscount: false,
      activePromo: null
    }
  }

  // Trouver la meilleure promo (celle qui donne le prix le plus bas)
  let bestPromo: PromotionData | null = null
  let lowestPrice = basePrice

  for (const promo of candidates) {
    let currentPrice = basePrice
    
    // Traitement de réduction basique
    if (promo.discount_value) {
      if (promo.discount_type === 'percentage') {
        currentPrice = basePrice - (basePrice * (promo.discount_value / 100))
      } else if (promo.discount_type === 'fixed') {
        currentPrice = basePrice - promo.discount_value
      }
    }
    
    // Limitation pour ne jamais avoir de prix négatif
    currentPrice = Math.max(0, currentPrice)

    if (currentPrice < lowestPrice) {
      lowestPrice = currentPrice
      bestPromo = promo
    }
  }

  return {
    originalPrice: basePrice,
    finalPrice: lowestPrice,
    hasDiscount: lowestPrice < basePrice,
    activePromo: bestPromo
  }
}
