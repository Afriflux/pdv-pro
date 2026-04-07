import { NextResponse } from 'next/server'
import { subscribeNewsletter } from '@/app/actions/biolink'

export async function POST(req: Request) {
  try {
    const { storeId, email } = await req.json()
    if (!storeId || !email) return NextResponse.json({ success: false, error: 'Champs manquants' }, { status: 400 })

    const res = await subscribeNewsletter(storeId, email, '')
    return NextResponse.json(res)
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 })
  }
}
