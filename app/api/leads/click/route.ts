import { NextResponse } from 'next/server'
import { recordBioLinkClick } from '@/app/actions/biolink'

export async function POST(req: Request) {
  try {
    const { slug } = await req.json()
    if (!slug) return NextResponse.json({ success: false }, { status: 400 })

    await recordBioLinkClick(slug)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
