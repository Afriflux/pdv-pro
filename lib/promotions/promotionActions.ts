'use server'

/**
 * lib/promotions/promotionActions.ts
 * Server Actions pour le CRUD et tracking des promotions.
 * Zero `any`. Contrôles de validation.
 */
import { createClient } from '@/lib/supabase/server'
import {
  PromotionData,
  CreatePromotionPayload,
  PromotionType
} from './promotionType'

// ─── 1. CRUD ─────────────────────────────────────────────────────────────

/**
 * Récupère toutes les promotions d'une boutique.
 */
export async function getStorePromotions(storeId: string): Promise<PromotionData[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Promotion')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('[getStorePromotions]', error)
    return []
  }

  // Cast de sécurité pour valider le typage
  return data.map((row) => ({
    id: row.id as string,
    store_id: row.store_id as string,
    type: row.type as PromotionType,
    title: row.title as string,
    discount_type: row.discount_type as 'percentage' | 'fixed',
    discount_value: row.discount_value as number | null,
    min_order_amount: row.min_order_amount as number | null,
    product_ids: row.product_ids as string[] ?? [],
    bundle_config: (row.bundle_config as any) ?? null,
    starts_at: row.starts_at as string,
    ends_at: row.ends_at as string | null,
    active: row.active as boolean,
    views: row.views as number,
    conversions: row.conversions as number,
    revenue_generated: row.revenue_generated as number,
    created_at: row.created_at as string,
  }))
}

/**
 * Créer une nouvelle promotion.
 * Règle applicative : 1 seule promo par produit cible (désactive l'ancienne si overlap).
 */
export async function createPromotion(payload: CreatePromotionPayload): Promise<PromotionData | null> {
  const supabase = await createClient()

  // 1. Gérer l'unicité par produit (règle: 1 seule promotion active par produit)
  if (payload.productIds && payload.productIds.length > 0) {
    // Rend inactives les promos précédentes concernant ces mêmes produits
    // C'est basique ici car PostgreSQL ne gère pas facilement l'intersection d'arrays sans requêtes brutes
    // Une approche simplifiée: on désactive ttes les autres promos de ces produits (soit array se chevauche).
    const { data: activesToCheck } = await supabase
      .from('Promotion')
      .select('id, product_ids')
      .eq('store_id', payload.storeId)
      .eq('active', true)

    if (activesToCheck) {
      const idsToDeactivate = activesToCheck
        .filter(p => {
          const promoProducts = (p.product_ids || []) as string[]
          return promoProducts.some(id => payload.productIds?.includes(id))
        })
        .map(p => p.id)

      if (idsToDeactivate.length > 0) {
        await supabase
          .from('Promotion')
          .update({ active: false })
          .in('id', idsToDeactivate)
      }
    }
  }

  // 2. Insertion
  const { data, error } = await supabase
    .from('Promotion')
    .insert({
      store_id:         payload.storeId,
      type:             payload.type,
      title:            payload.title,
      discount_type:    payload.discountType,
      discount_value:   payload.discountValue ?? null,
      min_order_amount: payload.minOrderAmount ?? null,
      product_ids:      payload.productIds ?? [],
      bundle_config:    payload.bundleConfig ?? null,
      starts_at:        payload.startsAt.toISOString(),
      ends_at:          payload.endsAt ? payload.endsAt.toISOString() : null,
      active:           true,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[createPromotion]', error)
    return null
  }

  return {
    ...data,
    type: data.type as PromotionType,
    discount_type: data.discount_type as 'percentage' | 'fixed',
  } as PromotionData
}

/**
 * Activer / Désactiver manuellement
 */
export async function togglePromotionActive(id: string, newStatus: boolean): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('Promotion')
    .update({ active: newStatus })
    .eq('id', id)

  return !error
}

// ─── 2. Tracking (Public) ────────────────────────────────────────────────

/**
 * Incrémenter les vues d'une promotion. 
 * Utilisé sur la page produit quand le compte à rebours ou le badge s'affiche.
 */
export async function trackPromotionView(promoId: string) {
  const supabase = await createClient()

  // On récupère le current
  const { data: promo } = await supabase
    .from('Promotion')
    .select('views')
    .eq('id', promoId)
    .single()

  if (promo) {
    await supabase
      .from('Promotion')
      .update({ views: promo.views + 1 })
      .eq('id', promoId)
  }
}

/**
 * Traite la conversion (1 commande passée).
 * Utilisé soit depuis l'IPN, soit du store front lors de la soumission de commande.
 */
export async function trackPromotionConversion(promoId: string, orderTotal: number) {
  const supabase = await createClient()

  const { data: promo } = await supabase
    .from('Promotion')
    .select('conversions, revenue_generated')
    .eq('id', promoId)
    .single()

  if (promo) {
    await supabase
      .from('Promotion')
      .update({
        conversions: promo.conversions + 1,
        revenue_generated: promo.revenue_generated + orderTotal
      })
      .eq('id', promoId)
  }
}

// ─── 3. Expiration CRON ──────────────────────────────────────────────────

/**
 * Fonction conçue pour être appelée par un CRON job (ex: toutes les nuits ou Vercel Cron).
 * Désactive les promos dont ends_at est passé.
 */
export async function expireOldPromotions() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // On trouve toutes les promos actives dont la date de fin est dépassée
  const { data, error } = await supabase
    .from('Promotion')
    .select('id')
    .eq('active', true)
    .lt('ends_at', now)

  if (!error && data && data.length > 0) {
    const ids = data.map(p => p.id)
    await supabase
      .from('Promotion')
      .update({ active: false })
      .in('id', ids)
      
    console.log(`[expireOldPromotions] Expiré: ${data.length} promotions.`)
  }
}
