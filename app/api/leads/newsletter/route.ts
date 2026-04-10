import { NextResponse } from 'next/server'
import { subscribeNewsletter } from '@/app/actions/biolink'
import { getRateLimitStatus } from '@/lib/rate-limit'
import { validate, newsletterSchema } from '@/lib/validation'

export async function POST(req: Request) {
  try {
    // Rate limit: 5 requêtes max par minute par IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const { success } = await getRateLimitStatus(`newsletter_${ip}`, 5, 60000)
    if (!success) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes' }, { status: 429 })
    }

    const body = await req.json()

    // Validation structurée
    const result = validate(body, newsletterSchema)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    const { storeId, email } = body
    const res = await subscribeNewsletter(storeId, email, '')
    return NextResponse.json(res)
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 })
  }
}
