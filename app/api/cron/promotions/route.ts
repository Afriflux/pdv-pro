import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const now = new Date()

    // 1. Désactiver les promotions expirées
    const { count: disabledPromos } = await prisma.promotion.updateMany({
      where: {
        active: true,
        ends_at: { lt: now }
      },
      data: { active: false }
    })

    // 2. Désactiver les codes promos expirés
    const { count: disabledCodes } = await prisma.promoCode.updateMany({
      where: {
        active: true,
        expires_at: { lt: now }
      },
      data: { active: false }
    })

    console.log(`[CRON] Promos échues: ${disabledPromos} | Codes échus: ${disabledCodes}`)

    return NextResponse.json({ 
      success: true, 
      disabledPromos,
      disabledCodes
    })

  } catch (error: any) {
    console.error('CRON PROMOTIONS ERROR:', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
