'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp, msgOrderShipped, msgOrderDelivered, msgOrderCancelled } from '@/lib/whatsapp/sendWhatsApp'

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
      .select('id, name')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return { success: false, updated: 0, error: 'Boutique introuvable ou non autorisée' }
    }

    // 1. Lire l'état actuel des commandes avant modification
    const { data: previousOrders } = await supabase
      .from('Order')
      .select('id, status, vendor_amount, buyer_name, buyer_phone, Product(name)')
      .in('id', orderIds)
      .eq('store_id', store.id)

    // 2. Mise à jour en lot (bulk update)
    const { data: updatedOrders, error: updateError } = await supabase
      .from('Order')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .in('id', orderIds)
      .eq('store_id', store.id)
      .select('id, payment_method, affiliate_token, affiliate_amount')

    if (updateError) {
      console.error('Erreur bulkUpdateOrders:', updateError)
      return { success: false, updated: 0, error: 'Erreur lors de la mise à jour des commandes' }
    }

    if (status === 'delivered' && updatedOrders) {
      const { triggerAmbassadorCommission } = await import('@/lib/affiliation/ambassador-hook')
      for (const order of updatedOrders) {
        if (order.affiliate_token && order.affiliate_amount && order.affiliate_amount > 0) {
          triggerAmbassadorCommission(order.id, order.affiliate_token, order.affiliate_amount)
            .catch(e => console.error('[Ambassadeur Hook COD]', e))
        }
      }
    }

    // 3. Sync Wallet balances (incremental) & Notifications
    if (previousOrders) {
      let balanceDelta = 0;
      let pendingDelta = 0;

      for (const old of previousOrders) {
         const amount = Number(old.vendor_amount) || 0;

         const wasCompleted = ['delivered', 'completed', 'paid'].includes(old.status)
         const isCompleted = ['delivered', 'completed', 'paid'].includes(status)
         
         const wasPending = ['pending', 'confirmed', 'processing', 'preparing', 'shipped', 'cod_pending', 'cod_confirmed'].includes(old.status)
         const isPending = ['pending', 'confirmed', 'processing', 'preparing', 'shipped', 'cod_pending', 'cod_confirmed'].includes(status)

         if (!wasCompleted && isCompleted) balanceDelta += amount;
         else if (wasCompleted && !isCompleted) balanceDelta -= amount;

         if (!wasPending && isPending) pendingDelta += amount;
         else if (wasPending && !isPending) pendingDelta -= amount;
         
         // 4. Notifications WhatsApp pour Mises à Jour Statut
         const buyerPhone = old.buyer_phone as string;
         const buyerName = old.buyer_name as string;
         const productName = (old.Product as any)?.name as string || 'votre commande';
         const vendorName = store.name || 'Notre boutique';
         
         if (buyerPhone && old.status !== status) {
           if (status === 'shipped') {
             sendWhatsApp({
               to: buyerPhone,
               body: msgOrderShipped({ buyerName, productName, vendorName, orderId: old.id })
             }).catch(e => console.error('[WhatsApp Shipped Error]', e))
           } else if (status === 'delivered') {
             sendWhatsApp({
               to: buyerPhone,
               body: msgOrderDelivered({ buyerName, productName, vendorName })
             }).catch(e => console.error('[WhatsApp Delivered Error]', e))
           } else if (status === 'cancelled') {
             sendWhatsApp({
               to: buyerPhone,
               body: msgOrderCancelled({ buyerName, productName })
             }).catch(e => console.error('[WhatsApp Cancelled Error]', e))
           }
         }
      }

      if (balanceDelta !== 0 || pendingDelta !== 0) {
        await updateWalletIncremental(store.id, balanceDelta, pendingDelta).catch(e => console.error('Erreur updateWalletIncremental:', e))
      }
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

async function updateWalletIncremental(storeId: string, balanceDelta: number, pendingDelta: number) {
  if (balanceDelta === 0 && pendingDelta === 0) return;

  try {
    const earnedDelta = balanceDelta > 0 ? balanceDelta : 0;
    
    // ATOMIC UPDATE: 1000000% strict to guarantee no race conditions upon concurrent requests.
    await prisma.wallet.update({
      where: { vendor_id: storeId },
      data: {
        balance: { increment: balanceDelta },
        pending: { increment: pendingDelta },
        total_earned: { increment: earnedDelta },
        updated_at: new Date()
      }
    });
  } catch (error) {
    console.error('[STRICT] Erreur de mise à jour incrémentale du portefeuille:', error);
  }
}
