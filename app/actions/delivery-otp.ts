'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'
import { sendStoreSMS } from '@/lib/sms/intech-sms'

/**
 * Generate a 6-digit OTP for COD order validation.
 * Called when the closer confirms the order (closing → cod_confirmed).
 */
export async function generateDeliveryOTP(orderId: string): Promise<{ success: boolean; otp?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, payment_method: true, status: true, store_id: true, buyer_phone: true, store: { select: { name: true } } }
    })

    if (!order) return { success: false, error: 'Commande introuvable' }
    if (order.payment_method !== 'cod') return { success: false, error: 'OTP uniquement pour les commandes COD' }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))

    await prisma.order.update({
      where: { id: orderId },
      data: {
        delivery_otp: otp,
        delivery_otp_created_at: new Date()
      }
    })

    // Envoi de l'OTP au client
    if (order.buyer_phone) {
      try {
        const storeName = order.store?.name || 'Yayyam'
        
        // 1. Envoi par SMS (Prioritaire et hors-ligne) COD = Gratuit
        await sendStoreSMS(
          order.store_id,
          [order.buyer_phone], 
          `CODE DE SECURITE: ${otp}\nVotre commande sur ${storeName} est confirmée. Veuillez donner ce code au livreur.`,
          true // isCod = true (Gratuit)
        ).catch(e => console.error('Failed to send OTP SMS:', e))

        // 2. Envoi WhatsApp (En backup / confort)
        await sendWhatsApp({
          to: order.buyer_phone,
          body: `Bonjour ! Votre commande sur ${storeName} est confirmée.\n\n🔒 *CODE DE SÉCURITÉ : ${otp}*\n\nVeuillez communiquer ce code d'accès de 6 chiffres au livreur à la réception de votre colis pour valider la livraison.`
        }).catch(e => console.error('Failed to send OTP WP:', e))
        
      } catch (e) {
        console.error('Failed to send OTP notifications:', e)
      }
    }

    return { success: true, otp }
  } catch (error: any) {
    console.error('[GenerateOTP] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verify OTP at delivery. If valid, the order can transition to 'delivered'.
 */
export async function verifyDeliveryOTP(orderId: string, otpInput: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        delivery_otp: true,
        delivery_otp_created_at: true,
        payment_method: true,
        status: true,
        store_id: true,
        store: { select: { user_id: true } }
      }
    })

    if (!order) return { success: false, error: 'Commande introuvable' }
    if (order.payment_method !== 'cod') return { success: false, error: 'OTP uniquement pour les commandes COD' }
    if (!order.delivery_otp) return { success: false, error: 'Aucun OTP généré pour cette commande' }

    // OTP expiration: 24 hours
    if (order.delivery_otp_created_at) {
      const expiresAt = new Date(order.delivery_otp_created_at.getTime() + 24 * 60 * 60 * 1000)
      if (new Date() > expiresAt) {
        return { success: false, error: 'OTP expiré. Veuillez en regénérer un.' }
      }
    }

    // Verify OTP
    if (order.delivery_otp !== otpInput.trim()) {
      return { success: false, error: 'Code OTP incorrect' }
    }

    // OTP valid → mark as delivered
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'delivered',
        delivery_otp: null, // Clear OTP after use
        delivery_otp_created_at: null,
        updated_at: new Date()
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('[VerifyOTP] Error:', error)
    return { success: false, error: error.message }
  }
}
