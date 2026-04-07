import {
  PaymentGatewayProvider,
  PaymentIntentParams,
  PaymentIntentResponse,
  VerifyTransactionResponse
} from './types'

import { prisma } from '@/lib/prisma'

/**
 * Bictorys Integration Service
 */
export class BictorysProvider implements PaymentGatewayProvider {
  /**
   * Retrieves the secure API key from DB or environment
   */
  private async getApiKey() {
     const cfg = await prisma.platformConfig.findUnique({ where: { key: 'BICTORYS_SECRET_KEY' }});
     return cfg?.value || process.env.BICTORYS_SECRET_KEY || 'MISSING_SECRET_KEY';
  }

  private getBaseUrl() {
     return process.env.NODE_ENV === 'production' 
       ? 'https://api.bictorys.com' 
       : 'https://api.test.bictorys.com';
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResponse> {
    try {
      // NOTE: Ajuster le payload exact selon la mise à jour de l'API Bictorys
      // La documentation indique `/pay/v1/charges` ou des Checkout/Payment Links
      const payload = {
        amount: params.amount,
        currency: params.currency || 'XOF',
        description: params.description,
        returnUrl: params.returnUrl,
        customerObject: {
           id: params.customerId,
           name: params.customerName
        },
        reference: `TX-${Date.now()}`
      };

      const apiKey = await this.getApiKey();
      const res = await fetch(`${this.getBaseUrl()}/pay/v1/charges?payment_type=card`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        return {
          success: true,
          // Récupérer le lien généré s'il y en a un
          payment_url: data.payment_url || data.checkout_url, 
          transaction_id: data.id || payload.reference
        };
      } else {
        return { success: false, error: data.message || 'Erreur Bictorys' };
      }
    } catch (error: any) {
      console.error("Bictorys Create Payment Error:", error);
      return { success: false, error: error.message };
    }
  }

  async verifyPayment(transaction_id: string): Promise<VerifyTransactionResponse> {
    // Cette partie est normalement traitée par le webhook `X-Secret-Key` directement
    // Mais s'il faut vérifier en polling :
    try {
      const apiKey = await this.getApiKey();
      const res = await fetch(`${this.getBaseUrl()}/pay/v1/charges/${transaction_id}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const data = await res.json();
      
      return {
        success: data.status === 'succeeded' || data.status === 'authorized',
        amount: parseFloat(data.amount),
        currency: data.currency,
        status: data.status,
        data: data
      };
    } catch (error: any) {
      console.error("Bictorys Verify Payment Error:", error);
       return { success: false, error: error.message };
    }
  }
}
