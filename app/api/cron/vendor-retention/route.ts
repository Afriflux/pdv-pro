import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmptyStoreEmail, sendMasterclassReminderEmail } from '@/lib/brevo/brevo-service'
import { sendWhatsApp, msgVendorEmptyStore, msgMasterclassReminder } from '@/lib/whatsapp/sendWhatsApp'
import { verifyCronSecret } from '@/lib/cron/cron-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Sécurité CRON
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'
    const now = new Date()

    // ─── 1. Scénario : Boutique Vide (J+1) ──────────────────────────────────
    // Vendeurs créés il y a entre 24h et 48h (pour une exécution cron quotidienne)
    const start24h = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const end24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const emptyStores = await prisma.store.findMany({
      where: {
        created_at: { gte: start24h, lt: end24h },
        products: { none: {} }
      },
      include: { user: true }
    })

    const emptyStoreResults = []
    for (const store of emptyStores) {
      if (!store.user) continue
      const vendorName = store.user.name || 'Vendeur'
      
      const emailSent = store.user.email ? await sendEmptyStoreEmail(store.user.email, vendorName) : false
      const wppSent = store.user.phone ? await sendWhatsApp({
        to: store.user.phone,
        body: msgVendorEmptyStore({ vendorName, dashboardLink: `${appUrl}/dashboard/products/new` })
      }) : false

      emptyStoreResults.push({ storeId: store.id, userEmail: store.user.email, emailSent, wppSent })
    }

    // ─── 2. Scénario : Masterclass Non Lue (J+3) ──────────────────────────
    // Vendeurs créés il y a entre 72h et 96h
    const start72h = new Date(now.getTime() - 96 * 60 * 60 * 1000)
    const end72h = new Date(now.getTime() - 72 * 60 * 60 * 1000)

    const unreadMasterclassUsers = await prisma.user.findMany({
      where: {
        role: 'vendeur',
        created_at: { gte: start72h, lt: end72h },
        masterclassProgresses: { none: {} }
      }
    })

    const unreadMasterclassResults = []
    for (const user of unreadMasterclassUsers) {
      const vendorName = user.name || 'Vendeur'

      const emailSent = user.email ? await sendMasterclassReminderEmail(user.email, vendorName) : false
      const wppSent = user.phone ? await sendWhatsApp({
        to: user.phone,
        body: msgMasterclassReminder({ vendorName, academyLink: `${appUrl}/dashboard/tips` })
      }) : false

      unreadMasterclassResults.push({ userId: user.id, userEmail: user.email, emailSent, wppSent })
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      emptyStoresRetained: emptyStoreResults.length,
      masterclassReminded: unreadMasterclassResults.length,
      details: {
        emptyStores: emptyStoreResults,
        masterclassReminders: unreadMasterclassResults
      }
    })

  } catch (error) {
    console.error('[CRON Vendor Retention] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
