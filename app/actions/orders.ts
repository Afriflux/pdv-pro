'use server'

import { createClient } from '@/lib/supabase/server'

const VALID_STATUSES = [
  'pending', 'confirmed', 'processing', 'preparing',
  'shipped', 'delivered', 'completed', 'cancelled',
  'cod_pending', 'cod_confirmed', 'no_answer', 'paid'
]

export async function bulkUpdateOrdersStatus(
  orderIds: string[],
  status:   string,
  storeId:  string
): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    if (!orderIds || orderIds.length === 0) {
      return { success: false, updated: 0, error: 'Aucune commande sélectionnée' }
    }
    
    if (orderIds.length > 100) {
      return { success: false, updated: 0, error: 'Maximum 100 commandes à la fois' }
    }

    if (!VALID_STATUSES.includes(status)) {
      return { success: false, updated: 0, error: 'Statut invalide' }
    }

    const supabase = await createClient()

    // Vérifier l'authentification et l'appartenance du store
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, updated: 0, error: 'Non autorisé' }
    }

    const { data: store, error: storeError } = await supabase
      .from('Store')
      .select('id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return { success: false, updated: 0, error: 'Boutique introuvable ou non autorisée' }
    }

    // Mise à jour en lot (bulk update)
    const { data: updatedOrders, error: updateError } = await supabase
      .from('Order')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .in('id', orderIds)
      .eq('store_id', store.id)
      .select('id')

    if (updateError) {
      console.error('Erreur bulkUpdateOrders:', updateError)
      return { success: false, updated: 0, error: 'Erreur lors de la mise à jour des commandes' }
    }

    return { 
      success: true, 
      updated: updatedOrders?.length || 0 
    }
  } catch (error: unknown) {
    console.error('Exception bulkUpdateOrders:', error)
    return { success: false, updated: 0, error: 'Erreur serveur interne' }
  }
}

export async function updateOrderStatus(
  orderId: string,
  status:  string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: 'Non autorisé' }

  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) return { success: false, error: 'Boutique introuvable' }

  const result = await bulkUpdateOrdersStatus([orderId], status, store.id)
  return { success: result.success, error: result.error }
}
