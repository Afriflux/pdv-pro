import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 1. Rappel des Impayés sur Cash on Delivery
    // Logique: Envoyer WhatsApp au client "N'oubliez pas d'avoir l'appoint pour la livraison..."
    console.log('[CRON] Vérification des commandes COD en transit...')

    // 2. Coaching Vendeurs Inactifs (Zéro connexion/vente depuis 7 jours)
    console.log('[CRON] Envoi des templates WhatsApp motivation aux vendeurs inactifs...')

    return NextResponse.json({ 
      success: true, 
      message: 'Rappels COD et Coaching Inactifs envoyés (Simulation)'
    })

  } catch (error: any) {
    console.error('CRON REMINDERS ERROR:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
