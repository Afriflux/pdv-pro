import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { confirmOrder } from '@/lib/payments/confirmOrder'

/**
 * IPN CinetPay — reçoit la notification de paiement
 * Méthode : POST (JSON ou form-urlencoded)
 * Body : { cpm_site_id, cpm_trans_id, cpm_result, cpm_trans_status, ... }
 * Header : x-token (SHA256 de cpm_site_id + cpm_trans_id + secret)
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Parser le body (JSON ou form-urlencoded) ──────────────────────────
    const rawText = await req.text()
    let body: Record<string, string>

    try {
      body = JSON.parse(rawText) as Record<string, string>
    } catch {
      body = Object.fromEntries(new URLSearchParams(rawText))
    }

    const orderId = body.cpm_trans_id as string | undefined
    const siteId  = body.cpm_site_id as string | undefined
    const result  = body.cpm_result  as string | undefined  // '00' = succès

    if (!orderId) {
      return NextResponse.json({ error: 'cpm_trans_id manquant' }, { status: 400 })
    }

    // ── 2. Vérification token CinetPay ───────────────────────────────────────
    const cinetpaySecret = process.env.CINETPAY_API_SECRET ?? ''

    if (cinetpaySecret) {
      const xToken = req.headers.get('x-token') ?? ''
      const expectedToken = crypto
        .createHash('sha256')
        .update((siteId ?? '') + orderId + cinetpaySecret)
        .digest('hex')

      if (xToken !== expectedToken) {
        console.warn('[IPN CinetPay] ⛔ Token x-token invalide')
        return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
      }
    } else {
      console.warn('[IPN CinetPay] ⚠️ CINETPAY_API_SECRET non configuré — vérification token désactivée')
    }

    // ── 3. Traitement du paiement ────────────────────────────────────────────
    // CinetPay : cpm_result === '00' = succès
    if (result !== '00') {
      return NextResponse.json({ ignored: true })
    }

    const paymentRef = (body.cpm_payid ?? body.cpm_trans_id) as string

    await confirmOrder(orderId, paymentRef)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[IPN CinetPay] Erreur:', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}

// CinetPay peut aussi utiliser GET pour test ping
export async function GET() {
  return NextResponse.json({ status: 'IPN CinetPay actif' })
}
