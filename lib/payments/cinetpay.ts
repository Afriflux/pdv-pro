import crypto from 'crypto'
import {
  PaymentGatewayProvider,
  PaymentIntentParams,
  PaymentIntentResponse,
  VerifyTransactionResponse
} from './types'

/**
 * CinetPay Integration Service
 * Utilise les identifiants depuis les variables d'environnement.
 */

import { prisma } from '@/lib/prisma'

export class CinetPayProvider implements PaymentGatewayProvider {
  /**
   * Fetch secure variables from the database (PlatformConfig)
   */
  private async getCreds() {
    const keys = await prisma.platformConfig.findMany({
      where: { key: { in: ['CINETPAY_API_KEY', 'CINETPAY_SITE_ID'] } }
    });
    
    const configMap = keys.reduce<Record<string, string>>((acc, curr) => {
      if (curr.key) acc[curr.key] = curr.value || '';
      return acc;
    }, {});
    
    return {
      API_KEY: configMap['CINETPAY_API_KEY'] || process.env.CINETPAY_API_KEY || 'MISSING_API_KEY',
      SITE_ID: configMap['CINETPAY_SITE_ID'] || process.env.CINETPAY_SITE_ID || 'MISSING_SITE_ID',
      BASE_URL: 'https://api-checkout.cinetpay.com/v2/payment'
    };
  }

  /**
   * Crée un lien de paiement pour un Dépôt dans le portefeuille / Achat de Produit
   */
  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResponse> {
    try {
      const transaction_id = `TX-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      
      const creds = await this.getCreds();
      
      const payload = {
        apikey: creds.API_KEY,
        site_id: creds.SITE_ID,
        transaction_id,
        amount: params.amount,
        currency: params.currency || 'XOF',
        description: params.description,
        return_url: params.returnUrl,
        notify_url: params.notifyUrl,
        customer_id: params.customerId,
        customer_name: params.customerName,
        customer_surname: "Client",
        channels: 'ALL'
      };

      const res = await fetch(creds.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.code === '201') {
        return {
          success: true,
          payment_url: data.data.payment_url,
          transaction_id
        };
      } else {
        return { success: false, error: data.description || 'Erreur CinetPay' };
      }
    } catch (error: any) {
      console.error("CinetPay Create Payment Error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifie le statut d'un paiement (Webhook Notification)
   */
  async verifyPayment(transaction_id: string): Promise<VerifyTransactionResponse> {
    try {
      const creds = await this.getCreds();
      
      const payload = {
        apikey: creds.API_KEY,
        site_id: creds.SITE_ID,
        transaction_id
      };

      const res = await fetch(`${creds.BASE_URL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      // '00' signifie que le paiement est passé avec succès
      return {
        success: data.code === '00',
        amount: data.data?.amount,
        currency: data.data?.currency,
        status: data.data?.status, // 'ACCEPTED' / 'REFUSED'
        data: data.data
      };
    } catch (error: any) {
      console.error("CinetPay Verify Payment Error:", error);
      return { success: false, error: error.message };
    }
  }
}
