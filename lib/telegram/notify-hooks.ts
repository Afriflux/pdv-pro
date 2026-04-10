/**
 * lib/telegram/notify-hooks.ts
 * Pont entre la logique métier et le service Telegram.
 * Permet de déclencher les notifications sans alourdir les fichiers API/Service.
 */

import { 
  notifyNewOrder, 
  notifyPaymentReceived, 
  notifyNewWhatsApp, 
  notifyLowStock 
} from './bot-service'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Déclenche une notification de nouvelle commande sur Telegram
 */
export async function triggerNewOrderTelegram(storeId: string, orderId: string) {
  try {
    // 1. Récupérer les détails de la commande pour le message
    const { data: order } = await supabaseAdmin
      .from('Order')
      .select(`
        id,
        total,
        quantity,
        buyer_name,
        payment_method,
        product:Product(name)
      `)
      .eq('id', orderId)
      .single()

    if (!order) return

    // 2. Envoyer la notification
    await notifyNewOrder(storeId, {
      orderId: order.id,
      customerName: order.buyer_name,
      amount: order.total,
      itemCount: order.quantity,
      paymentMethod: order.payment_method === 'wave' ? 'Wave' : 
                     order.payment_method === 'orange_money' ? 'Orange Money' :
                     order.payment_method === 'cinetpay' ? 'CinetPay' : 
                     order.payment_method === 'cod' ? 'Paiement à la livraison' : 
                     order.payment_method
    })
  } catch (error) {
    console.error('[Telegram Hook] Erreur NewOrder:', error)
  }
}

/**
 * Déclenche une notification de paiement reçu sur Telegram
 */
export async function triggerPaymentTelegram(storeId: string, amount: number, method: string) {
  try {
    await notifyPaymentReceived(storeId, amount, method)
  } catch (error) {
    console.error('[Telegram Hook] Erreur Payment:', error)
  }
}

/**
 * Déclenche une notification WhatsApp entrant sur Telegram
 */
export async function triggerWhatsAppTelegram(storeId: string, from: string, message: string) {
  try {
    await notifyNewWhatsApp(storeId, from, message)
  } catch (error) {
    console.error('[Telegram Hook] Erreur WhatsApp:', error)
  }
}

/**
 * Déclenche une notification de stock faible sur Telegram
 */
export async function triggerLowStockTelegram(storeId: string, productId: string) {
  try {
    // Récupérer le nom du produit
    const { data: product } = await supabaseAdmin
      .from('Product')
      .select('name')
      .eq('id', productId)
      .single()

    if (!product) return

    // Récupérer le stock actuel (somme de toutes les variantes ou stock direct si applicable)
    const { data: variants } = await supabaseAdmin
      .from('ProductVariant')
      .select('stock')
      .eq('product_id', productId)

    const currentStock = (variants || []).reduce((acc: number, v: { stock: number }) => acc + (v.stock || 0), 0)

    await notifyLowStock(storeId, product.name, currentStock)
  } catch (error) {
    console.error('[Telegram Hook] Erreur LowStock:', error)
  }
}

/**
 * Déclenche une alerte système (Smart Routing Fallback, etc.)
 */
export async function triggerSystemAlertTelegram(title: string, details: string) {
  try {
    const { notifySystemAlert } = await import('./bot-service')
    await notifySystemAlert(title, details)
  } catch (error) {
    console.error('[Telegram Hook] Erreur SystemAlert:', error)
  }
}

