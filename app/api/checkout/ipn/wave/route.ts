import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { confirmOrder } from '@/lib/payments/confirmOrder'

/**
 * IPN Wave — reçoit un webhook JSON signé
 * Body : { id, client_reference, checkout_status, ... }
 * Header : Wave-Signature (HMAC-SHA256 du body)
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // ── Vérification HMAC Wave ────────────────────────────────────────────────
    const waveSecret = process.env.WAVE_WEBHOOK_SECRET ?? ''
    const signature  = req.headers.get('wave-signature') ?? ''

    if (waveSecret) {
      // Si le secret est configuré → vérifier la signature
      const expectedSig = crypto
        .createHmac('sha256', waveSecret)
        .update(rawBody)
        .digest('hex')

      if (signature !== expectedSig) {
        console.warn('[IPN Wave] ⛔ Signature HMAC invalide')
        return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
      }
    } else {
      // Pas de secret → env de dev, on log un avertissement
      console.warn('[IPN Wave] ⚠️ WAVE_WEBHOOK_SECRET non configuré — vérification HMAC désactivée')
    }

    // ── Traitement du payload ─────────────────────────────────────────────────
    const body = JSON.parse(rawBody) as Record<string, string>

    const orderId = body.client_reference as string | undefined
    const status  = body.checkout_status  as string | undefined

    if (!orderId) {
      return NextResponse.json({ error: 'client_reference manquant' }, { status: 400 })
    }

    // Wave : checkout_status === 'succeeded'
    if (status !== 'succeeded') {
      return NextResponse.json({ ignored: true })
    }

    await confirmOrder(orderId, body.id ?? orderId)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[IPN Wave] Erreur:', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
