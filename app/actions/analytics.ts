'use server'

import { createClient } from '@/lib/supabase/server'
import { triggerViewContentCAPI } from '@/lib/tracking/trigger-funnel'

/**
 * Incrémente le compteur de vues d'un produit via une fonction RPC Supabase.
 * Déclenche aussi les événements ViewContent CAPI (Meta + TikTok) côté serveur.
 * @param productId ID du produit à tracker
 */
export async function trackProductView(productId: string, clientIp?: string, clientUserAgent?: string) {
  try {
    const supabase = await createClient()
    
    // On appelle la fonction RPC 'increment_views' que l'utilisateur doit créer en SQL
    const { error } = await supabase.rpc('increment_views', { 
      product_id: productId 
    })

    if (error) {
      console.error('[Analytics] Error incrementing views:', error)
      return { success: false, error: error.message }
    }

    // Déclencher CAPI ViewContent (Meta + TikTok) côté serveur
    // On récupère le store_id pour savoir quels pixels sont configurés
    const { data: product } = await supabase
      .from('Product')
      .select('store_id')
      .eq('id', productId)
      .single()

    if (product?.store_id) {
      triggerViewContentCAPI(productId, product.store_id, clientIp, clientUserAgent)
        .catch(e => console.error('[CAPI ViewContent Error]', e))
    }

    return { success: true }
  } catch (err) {
    console.error('[Analytics] Critical error in trackProductView:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Enregistre une visite sur une SalePage.
 */
export async function recordPageVisit(pageId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('record_page_visit', { 
      p_page_id: pageId 
    })
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('[Analytics] Error recording page visit:', err)
    return { success: false }
  }
}
