/**
 * lib/promotions/promotionType.ts
 * Définition des types stricts pour le module Promotions.
 * Zéro any.
 */

export type PromotionType = 
  | 'flash'         // Compte à rebours visible
  | 'seasonal'      // Tabaski, Ramadan, etc.
  | 'bundle'        // Ex: Achetez 2, payez 1
  | 'conditional'   // Livraison gratuite ou autre conditionnelle
  | 'first_order'   // 1ère commande
  | 'ai'            // Suggérée par l'IA

export type DiscountType = 'percentage' | 'fixed'

// Configuration JSONB pour les bundles (ex: acheter N, avoir M gratuit ou un % sur M)
export interface BundleConfig {
  buyQuantity: number
  rewardType: 'free_item' | 'percentage_off'
  rewardValue: number // ex: 1 (pour 1 gratuit) ou 50 (pour 50% sur le Nème item)
}

export interface PromotionData {
  id: string
  store_id: string
  type: PromotionType
  title: string
  discount_type: DiscountType
  discount_value: number | null
  min_order_amount: number | null
  product_ids: string[] // [] = s'applique à toute la boutique
  bundle_config: BundleConfig | null
  starts_at: string
  ends_at: string | null
  active: boolean
  views: number
  conversions: number
  revenue_generated: number
  created_at: string
}

export interface CreatePromotionPayload {
  storeId: string
  type: PromotionType
  title: string
  discountType: DiscountType
  discountValue?: number
  minOrderAmount?: number
  productIds?: string[]
  bundleConfig?: BundleConfig
  startsAt: Date
  endsAt?: Date
}
