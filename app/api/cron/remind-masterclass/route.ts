import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp, msgMasterclassReminder } from '@/lib/whatsapp/sendWhatsApp'
import { sendMessage } from '@/lib/telegram/bot-service'

// Vous pouvez configurer un CRON_SECRET dans Vercel ou Supabase
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      // return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      // For testing, we might want to allow it manually or rely on secret. 
      // Keep it loose if CRON_SECRET is not set for local dev.
      if (process.env.NODE_ENV === 'production') {
         return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }
    }

    // 1. Utilisateurs créés il y a plus de 3 jours
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

    const usersToRemind = await prisma.user.findMany({
      where: {
        created_at: {
          lte: threeDaysAgo
        },
        masterclassProgresses: {
          none: {} // N'a lu aucun cours
        },
        notifications: {
          none: { type: 'masterclass_reminder' } // N'a pas encore reçu la relance
        }
      },
      include: {
        store: true
      },
      take: 20 // Batching pour ne pas exploser les limites d'API
    })

    if (usersToRemind.length === 0) {
      return NextResponse.json({ message: 'Aucun utilisateur à relancer.' })
    }

    let sentCount = 0

    for (const user of usersToRemind) {
      let messageSent = false
      const vendorName = user.store?.name || user.name || 'Partenaire Yayyam'
      const academyLink = 'https://yayyam.com/dashboard/tips'

      // Priorité 1 : WhatsApp
      if (user.store?.whatsapp) {
        const text = msgMasterclassReminder({ vendorName, academyLink })
        const success = await sendWhatsApp({ to: user.store.whatsapp, body: text })
        if (success) messageSent = true
      } 
      // Priorité 2 : Telegram
      else if (user.store?.telegram_chat_id) {
        const text = `🚀 *Salut ${vendorName}, bienvenue sur Yayyam !*\n\nNous avons remarqué que tu n'as pas encore jeté un œil à l'Académie Yayyam.\nDes stratégies inédites t'y attendent (gratuitement) pour lancer ta boutique et exploser tes ventes en Afrique.\n\n👉 Découvre les secrets du Top 1% ici : \n${academyLink}\n\nÀ très vite ! 🎓`
        
        try {
          await sendMessage(user.store.telegram_chat_id, text, {
             parse_mode: 'Markdown'
          })
          messageSent = true
        } catch (e) {
          console.error(`Erreur Telegram pour ${user.id}`, e)
        }
      }

      // 3. Mark as Reminded if success (or even if we tried and failed to avoid infinite loops, but tracking success is better)
      // Here, we log the notification regardless so we don't spam if they don't have WA/TG valid.
      await prisma.notification.create({
        data: {
          user_id: user.id,
          type: 'masterclass_reminder',
          title: 'Relance Académie envoyée',
          message: 'Relance automatique J+3 envoyée via WhatsApp/Telegram.',
          read: true
        }
      })

      if (messageSent) sentCount++
    }

    return NextResponse.json({ 
      success: true, 
      processed: usersToRemind.length,
      sent: sentCount
    })

  } catch (error: any) {
    console.error('[CRON Remind Masterclass]', error)
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 })
  }
}
