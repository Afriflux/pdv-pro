import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { code, source } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Code manquant' }, { status: 400 })
    }

    // 1. Chercher l'affilié par son code
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: code }
    })

    if (!affiliate || affiliate.status !== 'active') {
      return NextResponse.json({ error: 'Affilié inactif ou introuvable' }, { status: 404 })
    }

    // Extraction des basiques device (le parsing complet est lourd, on prend l'User-Agent brut ou un mot clé)
    const userAgent = req.headers.get('user-agent') || ''
    let deviceType = 'desktop'
    if (/mobile/i.test(userAgent)) deviceType = 'mobile'
    else if (/tablet/i.test(userAgent)) deviceType = 'tablet'

    const ip = req.headers.get('x-forwarded-for') || req.ip || ''
    // Le pays peut être fourni par Cloudflare (CF-IPCountry) ou Vercel (x-vercel-ip-country)
    const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || 'SN'

    // 2. Insérer le clic silencieusement
    await prisma.affiliateClickLog.create({
      data: {
        id: crypto.randomUUID(),
        affiliate_id: affiliate.id,
        source: source || null,
        country: country,
        device: deviceType,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Affiliate Track Error]', error)
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 })
  }
}
