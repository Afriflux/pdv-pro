import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTransactionalEmail } from '@/lib/brevo/brevo-service'
import { bookingReminderEmail } from '@/lib/brevo/email-templates'

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

    // 3. Rappels de Rendez-vous à -24h
    console.log('[CRON] Envoi des rappels de rendez-vous pour demain...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tmrStart = new Date(tomorrow.setHours(0,0,0,0)).toISOString()
    const tmrEnd = new Date(tomorrow.setHours(23,59,59,999)).toISOString()

    const upcomingBookings = await prisma.booking.findMany({
      where: {
        booking_date: { gte: tmrStart, lte: tmrEnd },
      },
      include: {
        order: { include: { product: true } }
      }
    })

    let sentCount = 0
    for (const b of upcomingBookings) {
      if (b.order?.buyer_email) {
        const link = b.order.product.booking_link || `https://meet.jit.si/PDVPro_${b.order.id}`
        const dateStr = new Date(b.booking_date).toLocaleDateString('fr-FR')
        const html = bookingReminderEmail(
          b.order.buyer_name || 'Client',
          b.order.product.name,
          dateStr,
          `${b.start_time}`,
          link
        )
        await sendTransactionalEmail({
          to: [{ email: b.order.buyer_email }],
          subject: `Rappel : Votre rendez-vous pour ${b.order.product.name}`,
          htmlContent: html
        })
        sentCount++
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Rappels COD et Coaching Inactifs envoyés (Simulation). ${sentCount} rappels de RDV envoyés.`
    })

  } catch (error: any) {
    console.error('CRON REMINDERS ERROR:', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
