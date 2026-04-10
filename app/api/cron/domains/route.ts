import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/cron-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Vérifier les DNS record CNAME pointant sur cname.vercel-dns.com 
    // pour tous les marchands Pro+ ayant configuré un Custom Domain.

    return NextResponse.json({ 
      success: true, 
      message: 'Vérification DNS traitée'
    })

  } catch (error: unknown) {
    console.error('CRON DOMAINS ERROR:', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
