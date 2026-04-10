import { NextResponse } from 'next/server'
import { recordBioLinkClick } from '@/app/actions/biolink'
import { getRateLimitStatus } from '@/lib/rate-limit'
import { validate, clickSchema } from '@/lib/validation'

export async function POST(req: Request) {
  try {
    // Rate limit: 30 requêtes max par minute par IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const { success } = await getRateLimitStatus(`click_${ip}`, 30, 60000)
    if (!success) {
      return NextResponse.json({ success: false }, { status: 429 })
    }

    const body = await req.json()

    // Validation structurée
    const result = validate(body, clickSchema)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    await recordBioLinkClick(body.slug)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
