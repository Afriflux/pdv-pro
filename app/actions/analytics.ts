'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Incrémente le compteur de vues d'un produit via une fonction RPC Supabase.
 * @param productId ID du produit à tracker
 */
export async function trackProductView(productId: string) {
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
