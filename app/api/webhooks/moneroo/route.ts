import { NextResponse } from 'next/server'
import { captureError } from '@/lib/monitoring'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmOrder } from '@/lib/payments/confirmOrder'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const payload = JSON.parse(rawBody)

    // Extraction robuste de l'ID de paiement depuis la charge utile (webhook)
    const paymentId = payload.paymentId || payload.data?.id || payload.id

    if (!paymentId) {
      console.warn('[Moneroo Webhook] Aucun paymentId trouvé dans la requête:', payload);
      return NextResponse.json({ message: 'Ignored, missing paymentId' }, { status: 200 })
    }

    const supabase = createAdminClient()
    
    // Pour vérifier l'authenticité de facon absolue sans dépendre d'une signature HMAC,
    // on va interroger l'API Moneroo avec notre clé secrète.
    // On essaie d'abord la clé LIVE, puis la clé TEST si non trouvée/API répond 401/404.
    const { data: liveKeyRecord } = await supabase.from('IntegrationKey').select('value').eq('key', 'MONEROO_SECRET_KEY').single()
    const { data: testKeyRecord } = await supabase.from('IntegrationKey').select('value').eq('key', 'MONEROO_SECRET_KEY_TEST').single()

    const secretKeys = [liveKeyRecord?.value, testKeyRecord?.value].filter(Boolean)
    
    if (secretKeys.length === 0) {
      console.error('[Moneroo Webhook] Aucune clé secrète Moneroo trouvée en base.')
      return NextResponse.json({ error: 'Config Error' }, { status: 500 })
    }

    let monerooData = null;
    let isValid = false;

    // Tentative de vérification Active (Pull Method)
    for (const key of secretKeys) {
      try {
        const verifyRes = await fetch(`https://api.moneroo.io/v1/payments/${paymentId}/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Accept': 'application/json'
          }
        })
        
        if (verifyRes.ok) {
          const verifyJson = await verifyRes.json()
          if (verifyJson.data) {
            monerooData = verifyJson.data
            isValid = true
            break
          }
        }
      } catch (err) {
        // Ignorer et essayer la clé suivante
      }
    }

    if (!isValid || !monerooData) {
      console.error(`[Moneroo Webhook] Impossible de vérifier la transaction ${paymentId} (Tentative Frauduleuse ou Not Found)`)
      return NextResponse.json({ error: 'Unauthorized or Transaction Not Found' }, { status: 401 })
    }

    // Extraction de order_id inséré lors de l'initialisation
    const orderId = monerooData.metadata?.order_id
    
    if (!orderId) {
      console.error(`[Moneroo Webhook] Aucun order_id trouvé dans les metadata de la transaction ${paymentId}`)
      return NextResponse.json({ error: 'Missing metadata.order_id' }, { status: 400 })
    }

    // Statuts de succès documentés chez Moneroo (souvent success, successful ou paid)
    const status = (monerooData.status || '').toLowerCase()
    
    if (['success', 'successful', 'paid', 'completed'].includes(status)) {
      await confirmOrder(orderId)
      console.log(`[Moneroo Webhook] Paiement validé pour la commande: ${orderId}`)
    } else if (['failed', 'cancelled', 'error'].includes(status)) {
      await supabase.from('Order').update({ status: 'cancelled' }).eq('id', orderId)
      console.log(`[Moneroo Webhook] Paiement échoué/annulé pour la commande: ${orderId}`)
    } else {
      console.log(`[Moneroo Webhook] Statut non décisif (${status}) ignoré pour la commande: ${orderId}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    captureError(error, { context: 'webhook-moneroo' }, 'error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
