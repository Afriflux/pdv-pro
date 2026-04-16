import { prisma } from '@/lib/prisma'

export interface SendSMSResult {
  code: number
  error: boolean
  msg: string
  data: any[]
}

/**
 * Envoie un SMS pour une boutique.
 * - Si isCod = true, c'est gratuit pour le vendeur (pris en charge par Yayyam via la comm 5%).
 * - Sinon, ça décrémente ses crédits SMS (`SmsCredit`).
 */
export async function sendStoreSMS(
  storeId: string,
  to: string[],
  content: string,
  isCod: boolean = false,
  sender: string = 'Yayyam'
): Promise<SendSMSResult> {
  const appKey = process.env.INTECH_APP_KEY

  if (!appKey) {
    console.warn('[IntechSMS] INTECH_APP_KEY manquante. Simulation de l\'envoi.')
    return { code: 201, error: false, msg: 'Simulé (clé manquante)', data: [] }
  }

  // Si ce n'est pas un SMS gratuit (COD), on vérifie et débite les crédits
  if (!isCod) {
    const creditRecord = await prisma.smsCredit.findUnique({ where: { store_id: storeId } })
    const needed = to.length
    
    if (!creditRecord || creditRecord.credits < needed) {
      console.warn(`[IntechSMS] Crédits insuffisants pour la boutique ${storeId}`)
      return { code: 402, error: true, msg: 'Crédits SMS insuffisants', data: [] }
    }

    // Débit des crédits
    await prisma.smsCredit.update({
      where: { store_id: storeId },
      data: {
        credits: { decrement: needed },
        used: { increment: needed }
      }
    })
  }

  // Formatage des numéros (Intech attend un tableau de numéros avec le code pays, ex: +221...)
  const formattedNumbers = to.map(num => {
    let clean = num.replace(/[^0-9+]/g, '')
    if (!clean.startsWith('+')) {
      // Si aucun indicatif, on ajoute +221 par défaut au cas où
      // (Dans l'idéal, les numéros en base devraient l'avoir)
      clean = clean.startsWith('221') ? `+${clean}` : `+221${clean}`
    }
    return clean
  })

  const payload = {
    app_key: appKey,
    sender,
    content,
    msisdn: formattedNumbers
  }

  try {
    const response = await fetch('https://gateway.intechsms.sn/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('[IntechSMS] Erreur API:', data.msg)
    }
    
    return data
  } catch (error) {
    console.error('[IntechSMS] Exception réseau:', error)
    return {
      code: 500,
      error: true,
      msg: 'Erreur réseau lors de l\'envoi du SMS',
      data: []
    }
  }
}
