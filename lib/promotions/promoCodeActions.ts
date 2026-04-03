'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PromoCodeData {
  id: string
  store_id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order: number | null
  max_uses: number | null
  uses: number
  expires_at: string | null
  active: boolean
  product_ids: string[]
  affiliate_id?: string | null
  created_at: string
}

export interface CreatePromoCodeInput {
  storeId: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order: number | null
  max_uses: number | null
  expires_at: Date | null
  product_ids: string[]
  affiliate_id?: string | null
}

/**
 * Récupère tous les codes promos d'une boutique
 */
export async function getStorePromoCodes(storeId: string): Promise<PromoCodeData[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('PromoCode')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data as PromoCodeData[]
}

/**
 * Crée un nouveau code promo.
 * Le code est automatiquement mis en majuscules sans espaces pour garantir l'insensibilité à la casse.
 */
export async function createPromoCode(input: CreatePromoCodeInput) {
  const supabase = await createClient()

  // Assainissement du code : majuscules, pas d'espaces
  const cleanCode = input.code.trim().toUpperCase().replace(/\s+/g, '')

  const { data, error } = await supabase
    .from('PromoCode')
    .insert([{
      store_id: input.storeId,
      code: cleanCode,
      type: input.type,
      value: input.value,
      min_order: input.min_order,
      max_uses: input.max_uses,
      expires_at: input.expires_at ? input.expires_at.toISOString() : null,
      product_ids: input.product_ids || [],
      affiliate_id: input.affiliate_id || null
    }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Code d'erreur PostgreSQL pour Duplicate Key
      return { success: false, error: 'Ce code promo existe déjà pour votre boutique.' }
    }
    console.error('Erreur createPromoCode:', error)
    return { success: false, error: "Erreur lors de la création du code promo." }
  }

  revalidatePath('/dashboard/promos')
  return { success: true, data: data as PromoCodeData }
}

/**
 * Active ou désactive un code promo manuellement.
 */
export async function togglePromoCodeActive(promoId: string, active: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('PromoCode')
    .update({ active })
    .eq('id', promoId)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/promos')
  return { success: true }
}

/**
 * Supprime un code promo.
 */
export async function deletePromoCode(promoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('PromoCode')
    .delete()
    .eq('id', promoId)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/promos')
  return { success: true }
}
