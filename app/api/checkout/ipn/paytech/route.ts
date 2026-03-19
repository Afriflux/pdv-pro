export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { confirmOrder } from '@/lib/payments/confirmOrder'

/**
 * IPN PayTech — notification de paiement HMAC-SHA256
 * Body (form-urlencoded) : ref_command, type_event, token, ...
 */
export async function POST(req: NextRequest) {
  try {
    // PayTech envoie du form-urlencoded
    const text = await req.text()
    const body = Object.fromEntries(new URLSearchParams(text))

    const orderId    = body.ref_command as string | undefined
    const typeEvent  = body.type_event  as string | undefined
    const apiKey     = process.env.PAYTECH_API_KEY    ?? ''
    const apiSecret  = process.env.PAYTECH_API_SECRET ?? ''

    if (!orderId || !typeEvent) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Vérification HMAC PayTech
    const token    = body.token as string | undefined
    const expected = crypto
      .createHash('sha256')
      .update(apiKey + apiSecret)
      .digest('hex')

    if (token && token !== expected) {
      console.warn('[IPN PayTech] Token invalide')
      return NextResponse.json({ error: 'Token invalide' }, { status: 403 })
    }

    // Seulement confirmer si c'est un succès
    if (typeEvent !== 'sale_complete') {
      console.log('[IPN PayTech] Événement ignoré:', typeEvent)
      return NextResponse.json({ ignored: true })
    }

    await confirmOrder(orderId, body.custom_field ?? orderId)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[IPN PayTech] Erreur:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur' },
      { status: 500 }
    )
  }
}
