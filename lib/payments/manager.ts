import { PaymentGatewayProvider } from './types'
import { CinetPayProvider } from './cinetpay'
import { BictorysProvider } from './bictorys'

/**
 * Registry of all available payment gateways
 */
export const PaymentGateways: Record<string, PaymentGatewayProvider> = {
  'CINETPAY': new CinetPayProvider(),
  'BICTORYS': new BictorysProvider()
  // Vous pouvez ajouter 'WAVE_DIRECT': new WaveDirectProvider() plus tard
}

import { prisma } from '@/lib/prisma'

/**
 * Récupère le processeur actif configuré en base de données.
 * Défaut : CinetPay
 */
export async function getActivePaymentGateway(): Promise<PaymentGatewayProvider> {
  let activeName = process.env.ACTIVE_PAYMENT_GATEWAY || 'CINETPAY';
  
  try {
     const cfg = await prisma.platformConfig.findUnique({ where: { key: 'ACTIVE_PAYMENT_GATEWAY' }});
     if (cfg?.value) activeName = cfg.value;
  } catch(e) {}
  
  if (activeName.toUpperCase() === 'BICTORYS') {
     return new BictorysProvider();
  }

  // Fallback
  return new CinetPayProvider();
}
