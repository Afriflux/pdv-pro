/**
 * Module d'Automatisation des Retraits (Payouts) Yayyam
 * Effectue des virements automatiques via l'API (Wave Bulk, Bictorys Payout, ou InTouch Cashout) 
 * pour éliminer les retraits manuels du BackOffice.
 */

import { getIntegrationKey } from './routing'

export async function processAutomatedPayout(
  destinationPhoneOrAccount: string,
  amount: number,
  method: string,
  referenceId: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // 1. Récupération des clés secrètes plateforme
    const bictorysKey = await getIntegrationKey('BICTORYS_SECRET_KEY', 'prod') || process.env.BICTORYS_SECRET_KEY;
    const waveKey = process.env.WAVE_API_KEY;

    if (method.toLowerCase().includes('wave') && waveKey) {
        // [SIMULATION / PROXY] - Ajout de la spec Wave Payout
        const res = await fetch('https://api.wave.com/v1/payouts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${waveKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount.toString(),
                currency: 'XOF',
                mobile: destinationPhoneOrAccount,
                client_reference: referenceId
            })
        });

        if (res.ok) {
            const data = await res.json();
            return { success: true, transactionId: data.id };
        } else {
            console.error('[Wave Payout Error]', await res.text());
            return { success: false, error: 'Échec de la transaction Wave' };
        }
    } 
    else if (method.toLowerCase().includes('bictorys') || method.toLowerCase().includes('paytech') || bictorysKey) {
        // [SIMULATION / PROXY] - Bictorys Payout
        const res = await fetch('https://api.bictorys.com/v1/payouts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${bictorysKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                currency: 'XOF',
                account_number: destinationPhoneOrAccount,
                reference: referenceId,
                payment_method: method
            })
        });

        if (res.ok) {
            const data = await res.json();
            return { success: true, transactionId: data.transaction_id || `TX_${Date.now()}` };
        } else {
            console.error('[Processor Payout Error]', await res.text());
            return { success: false, error: 'Échec de la transaction Processeur.' };
        }
    }

    return { success: false, error: 'Configuration manquante pour cette méthode (clés API Introuvables).' }
  } catch (err: any) {
    console.error('Erreur Payout Service:', err)
    return { success: false, error: err.message }
  }
}
