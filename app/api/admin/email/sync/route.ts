import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createOrUpdateContact } from '@/lib/brevo/brevo-service'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* readonly in routes */ }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // ── 1. Fetch Vendeurs ──
    const vendors = await prisma.user.findMany({
      where: { role: 'vendeur', email: { not: null } },
      select: { email: true, name: true }
    })

    // ── 2. Fetch Acheteurs ──
    const orders = await prisma.order.findMany({
      where: { buyer_email: { not: null } },
      select: { buyer_email: true, buyer_name: true },
      distinct: ['buyer_email']
    })

    let syncedVendors = 0
    let syncedBuyers = 0

    // Synchronisation séquentielle par lots légers pour éviter le rate-limit
    // Note : Brevo conseille une approche Batch en production massive, mais la limite POST /contacts est tolérante.
    
    for (const vendor of vendors) {
      if (!vendor.email) continue
      const names = vendor.name.split(' ')
      const prenom = names[0] || ''
      const nom = names.slice(1).join(' ') || ''
      
      const success = await createOrUpdateContact(
        vendor.email,
        { PRENOM: prenom, NOM: nom, ROLE: 'Vendeur' },
        [2] // Liste 2 = Vendeurs
      )
      if (success) syncedVendors++
    }

    for (const order of orders) {
      if (!order.buyer_email) continue
      const names = order.buyer_name.split(' ')
      const prenom = names[0] || ''
      const nom = names.slice(1).join(' ') || ''
      
      const success = await createOrUpdateContact(
        order.buyer_email,
        { PRENOM: prenom, NOM: nom, ROLE: 'Acheteur' },
        [1] // Liste 1 = Acheteurs
      )
      if (success) syncedBuyers++
    }

    return NextResponse.json({
      success: true,
      data: { syncedVendors, syncedBuyers }
    })

  } catch (error: unknown) {
    console.error('[API Sync Brevo] Erreur:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
