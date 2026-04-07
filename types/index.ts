// Types globaux Yayyam Pro
// Jamais de `any` — TypeScript strict

export type Role = 'super_admin' | 'gestionnaire' | 'vendeur' | 'affilie' | 'acheteur'

export type ProductType = 'digital' | 'physical' | 'coaching'

export type OrderStatus = 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export type PaymentMethod = 'cinetpay' | 'paytech' | 'wave'

export type PromoType = 'percent' | 'fixed'

export type SalePageTemplate = 'physical' | 'digital' | 'formation' | 'coaching' | 'multi'
