import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Normalise un numéro de téléphone au format E.164
 */
export function normalizeSmsPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
  if (clean.startsWith('+')) return clean.substring(1)
  if (clean.startsWith('00')) return clean.slice(2)
  if (clean.length === 9) return '221' + clean
  if (clean.length === 8) return '221' + clean
  return clean
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
  const toFormatted = normalizeSmsPhone(to)

  // Fetch Meta API Config
  const supabaseAdmin = createAdminClient()
  const { data: configRows } = await supabaseAdmin
    .from('PlatformConfig')
    .select('key, value')
    .in('key', ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN'])

  const configMap = Object.fromEntries(configRows?.map(row => [row.key, row.value]) || [])
  const phoneId = configMap['WHATSAPP_PHONE_NUMBER_ID'] || process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = configMap['WHATSAPP_ACCESS_TOKEN'] || process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneId || !token) {
    return { success: false, error: 'Configuration WhatsApp API manquante.' }
  }

  try {
    let sid = `wa_mock_${Date.now()}`

    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toFormatted,
        type: 'text',
        text: { preview_url: false, body: body }
      })
    })

    const data = await res.json()

    if (!res.ok) {
       console.error('[WhatsApp API Send Error]:', data)
       throw new Error(`Meta API Error: ${data.error?.message || 'Unknown'}`)
    }
    
    sid = data.messages?.[0]?.id || sid

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

  } catch (err: unknown) {
    console.error('[WhatsApp Messaging Error] :', err)
    
    // Logger l'échec
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

    return { success: false, error: err instanceof Error ? err.message : 'Erreur Envoi' }
  }
}
