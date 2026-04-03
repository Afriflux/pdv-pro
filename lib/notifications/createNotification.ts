/**
 * lib/notifications/createNotification.ts
 * Crée une notification interne dans la table Notification
 */
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

interface NotificationPayload {
  userId: string
  type: string      // 'new_order' | 'withdrawal' | 'cod_reminder' | etc.
  title: string
  message: string
  link?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient?: SupabaseClient<any, 'public', any>
}

export async function createNotification(payload: NotificationPayload): Promise<void> {
  const supabase = payload.supabaseClient ?? await createClient()

  await supabase.from('Notification').insert({
    user_id: payload.userId,
    type:    payload.type,
    title:   payload.title,
    message: payload.message,
    link:    payload.link ?? null,
    read:    false,
  })
}

/**
 * Raccourcis métier
 */
export async function notifyNewOrder(params: {
  userId: string
  productName: string
  buyerName: string
  amount: number
  orderId: string
  paymentMethod: string
  city?: string | null
}) {
  const cityStr = params.city ? ` (${params.city})` : ''
  const methodMap: Record<string, string> = {
    wave: 'Wave',
    cinetpay: 'CinetPay',
    paytech: 'PayTech',
    cod: 'Paiement à la livraison',
  }
  const methodLabel = methodMap[params.paymentMethod.toLowerCase()] || params.paymentMethod

  return createNotification({
    userId:  params.userId,
    type:    'new_order',
    title:   '🛍️ Nouvelle commande',
    message: `🛒 ${params.buyerName}${cityStr} vient d'acheter "${params.productName}" — ${methodLabel} · ${params.amount.toLocaleString('fr-FR')} FCFA`,
    link:    `/dashboard/orders`,
  })
}

export async function notifyWithdrawalStatus(params: {
  userId: string
  amount: number
  status: 'approved' | 'processed' | 'rejected'
  notes?: string
}) {
  const labels = { approved: 'approuvé', processed: 'traité ✓', rejected: 'rejeté ❌' }
  return createNotification({
    userId:  params.userId,
    type:    'withdrawal_' + params.status,
    title:   '💰 Retrait ' + labels[params.status],
    message: `Votre retrait de ${params.amount.toLocaleString('fr-FR')} FCFA a été ${labels[params.status]}.${params.notes ? ' Note : ' + params.notes : ''}`,
    link:    '/dashboard/wallet',
  })
}

export async function notifyCodReminder(params: {
  userId: string
  buyerName: string
  productName: string
  orderId: string
}) {
  return createNotification({
    userId:  params.userId,
    type:    'cod_reminder',
    title:   '⚠️ COD en attente +48h',
    message: `La commande de ${params.buyerName} (${params.productName}) attend votre confirmation de livraison.`,
    link:    `/dashboard/orders/${params.orderId}`,
  })
}

export async function notifyNewAffiliateSale(params: {
  userId: string
  productName: string
  buyerName: string
  amount: number
  paymentMethod: string
}) {
  const methodLabel = params.paymentMethod === 'cod' ? 'Paiement à la livraison (En attente)' : 'Prépayé (Immédiat)'
  
  return createNotification({
    userId:  params.userId,
    type:    'affiliate_sale_pending',
    title:   '🎉 Boom ! Nouvelle vente référée !',
    message: `Votre lien a généré une vente de "${params.productName}" pour ${params.buyerName}. Commission estimée : ${params.amount.toLocaleString('fr-FR')} FCFA. (${methodLabel})`,
    link:    `/portal`,
  })
}

export async function notifyAffiliateSaleDelivered(params: {
  userId: string
  productName: string
  amount: number
}) {
  return createNotification({
    userId:  params.userId,
    type:    'affiliate_sale_delivered',
    title:   '✅ Commission Confirmée !',
    message: `La commande pour "${params.productName}" a été livrée. Votre commission de ${params.amount.toLocaleString('fr-FR')} FCFA a été créditée !`,
    link:    `/portal/wallet`,
  })
}
