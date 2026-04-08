import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null

/**
 * Normalise un numéro de téléphone au format E.164
 */
export function normalizeSmsPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
  if (clean.startsWith('+')) return clean
  if (clean.startsWith('00')) return '+' + clean.slice(2)
  if (clean.length === 9) return '+221' + clean
  if (clean.length === 8) return '+221' + clean
  return '+' + clean
}

export async function sendSMS({ 
  to, 
  body, 
  storeId, 
  type = 'campaign',
  campaignId = null
}: { 
  to: string; 
  body: string; 
  storeId: string;
  type?: 'campaign' | 'auto_abandoned' | 'auto_confirm' | 'auto_tracking' | 'workflow';
  campaignId?: string | null;
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  
  // 1. Vérifier les crédits
  const creditRecord = await prisma.smsCredit.findUnique({
    where: { store_id: storeId }
  })

  // Si pas de crédits ou solde à 0, on refuse l'envoi
  if (!creditRecord || creditRecord.credits <= 0) {
    return { success: false, error: 'Crédits SMS insuffisants' }
  }

  // Fallback number si env var absente
  // On retire le préfixe whatsapp: s'il est présent dans le fallback
  const rawFrom = process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_WHATSAPP_FROM || '+14155238886'
  const fromNumber = rawFrom.replace('whatsapp:', '')
  const toFormatted = normalizeSmsPhone(to)

  try {
    let sid = 'SIMULATED_SMS_SID'

    if (twilioClient) {
      const message = await twilioClient.messages.create({
        body: body,
        from: fromNumber,
        to: toFormatted
      })
      sid = message.sid
    } else {
      console.log('[SMS DEV SIMULATION] to:', toFormatted, 'body:', body)
    }

    // 2. Transaction pour déduire le crédit et logger
    await prisma.$transaction([
      prisma.smsCredit.update({
        where: { store_id: storeId },
        data: {
          credits: { decrement: 1 },
          used: { increment: 1 }
        }
      }),
      prisma.smsLog.create({
        data: {
          store_id: storeId,
          phone: toFormatted,
          message: body,
          type: type,
          status: 'sent',
          twilio_sid: sid,
          campaign_id: campaignId
        }
      })
    ])

    return { success: true, sid }

  } catch (err: any) {
    console.error('[SMS Twilio Error] :', err)
    
    // Logger l'échec même si Twilio a échoué (erreur numéro invalide, etc.)
    await prisma.smsLog.create({
      data: {
        store_id: storeId,
        phone: toFormatted,
        message: body,
        type: type,
        status: 'failed',
        campaign_id: campaignId
      }
    })

    return { success: false, error: err.message || 'Erreur Twilio' }
  }
}
