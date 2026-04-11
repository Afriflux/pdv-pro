// Types globaux Yayyam
// Jamais de `any` — TypeScript strict

export type Role = 
  | 'super_admin' 
  | 'gestionnaire' 
  | 'support'
  | 'vendeur' 
  | 'affilie' 
  | 'closer'
  | 'acheteur' 
  | 'client'
  | 'ambassador'

export type AdminRole = 'super_admin' | 'gestionnaire' | 'support'

export type ProductType = 'digital' | 'physical' | 'coaching'

export type VendorType = 'digital' | 'physical' | 'hybrid'

export type OrderStatus = 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export type PaymentMethod = 'cinetpay' | 'paytech' | 'wave'

export type PromoType = 'percent' | 'fixed'

export type SalePageTemplate = 'physical' | 'digital' | 'formation' | 'coaching' | 'multi'

export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected'

export type OwnerType = 'vendor' | 'affiliate' | 'closer' | 'client'
