export interface PaymentIntentParams {
  amount: number;
  currency?: string;
  description: string;
  returnUrl: string;
  notifyUrl: string;
  customerId: string;
  customerName: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  payment_url?: string;
  transaction_id?: string;
  error?: string;
}

export interface VerifyTransactionResponse {
  success: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  data?: any;
  error?: string;
}

export interface PaymentGatewayProvider {
  /**
   * Crée un lien de paiement pour être renvoyé au client
   */
  createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResponse>;

  /**
   * Vérifie le statut d'un paiement en ligne de manière active (Souvent via webhook callback)
   */
  verifyPayment(transaction_id: string): Promise<VerifyTransactionResponse>;
}
