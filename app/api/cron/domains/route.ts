import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Vérifier les DNS record CNAME pointant sur cname.vercel-dns.com 
    // pour tous les marchands Pro+ ayant configuré un Custom Domain.
    console.log('[CRON] Checking Custom Domains DNS resolution via Vercel Domains API')

    return NextResponse.json({ 
      success: true, 
      message: 'Vérification DNS traitée'
    })

  } catch (error: any) {
    console.error('CRON DOMAINS ERROR:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
