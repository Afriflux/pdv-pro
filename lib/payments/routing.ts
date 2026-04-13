import { createAdminClient } from '@/lib/supabase/admin'
import { createWavePayment } from './wave/client'
import { createPaytechPayment } from './paytech/client'
import { createBictorysPayment } from './bictorys/client'
import { createCinetpayPayment } from './cinetpay/client'

export type PaymentEnvironment = 'test' | 'prod'

export interface PaymentRequestPayload {
  amount: number
  currency: string
  orderId: string
  method: 'wave' | 'paytech' | 'bictorys' | 'cinetpay' | 'moneroo'
  customer: {
    name: string
    phone: string
    email?: string
    address?: string
    city?: string
    country?: string
  }
  description: string
  returnUrl: string
  notifyUrl: string
  env: PaymentEnvironment
}

export interface PaymentResponse {
  success: boolean
  paymentUrl?: string
  transactionId?: string
  error?: string
  fallbackUsed?: boolean
}

/**
 * Récupère une clé d'intégration depuis la BDD en tenant compte de l'environnement
 */
export async function getIntegrationKey(baseKey: string, env: PaymentEnvironment): Promise<string | null> {
  const supabase = createAdminClient()
  const targetKey = env === 'test' ? `${baseKey}_TEST` : baseKey
  
  const { data } = await supabase
    .from('IntegrationKey')
    .select('value')
    .eq('key', targetKey)
    .single()
    
  return data?.value || null
}

/**
 * Vérifie si le basculement d'urgence (Smart Routing Fallback) est actif pour un service donné
 */
export async function isFallbackActive(fallbackKey: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('IntegrationKey')
    .select('value')
    .eq('key', fallbackKey)
    .single()
    
  return data?.value === 'true'
}

import { triggerSystemAlertTelegram } from '@/lib/telegram/notify-hooks'

/**
 * Routeur Intelligent de Paiement (Smart Payment Router)
 */
export async function createPaymentSession(payload: PaymentRequestPayload): Promise<PaymentResponse> {
  // 1. Gestion du Smart Routing / Fallback d'urgence
  if (payload.method === 'wave') {
    const usePaytechFallback = await isFallbackActive('FALLBACK_WAVE_PAYTECH')
    if (usePaytechFallback) {
      console.log('⚡️ [Smart Routing] Wave est en maintenance, bascule automatique vers PayTech.')
      
      // Alerte Telegram
      await triggerSystemAlertTelegram(
        'Bascule (Smart Routing) Activée', 
        `La méthode 'wave' est indisponible. Redirection automatique vers 'paytech' pour la commande ${payload.orderId} (${payload.amount} FCFA).`
      )

      // On mute le payload pour utiliser PayTech comme agrégateur
      payload.method = 'paytech'
      // Appel du client Paytech en redirigeant le fallback
      const response = await createPaytechPayment(payload)
      return { ...response, fallbackUsed: true }
    }
  }

  // 2. Routage vers le bon provider
  switch (payload.method) {
    case 'wave':
      return await createWavePayment(payload)
      
    case 'paytech':
      return await createPaytechPayment(payload)

    case 'bictorys':
      return await createBictorysPayment(payload)

    case 'cinetpay':
      return await createCinetpayPayment(payload)

    default:
      return { success: false, error: 'Méthode de paiement non supportée par le Routeur' }
  }
}

