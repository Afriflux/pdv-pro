import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: adminUser } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminUser?.role || !['super_admin', 'gestionnaire'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()
    const updates = body.updates || [{ key: body.key, value: body.value }]

    if (!updates || updates.length === 0) {
      return NextResponse.json({ error: 'Données requises' }, { status: 400 })
    }

    const transactionWrites = updates.map((u: any) => {
      if (!u.key || u.value === undefined) throw new Error('Tuple invalide')
      return prisma.platformConfig.upsert({
        where: { key: u.key },
        update: { value: u.value.toString(), updated_by: user.id },
        create: { key: u.key, value: u.value.toString(), updated_by: user.id }
      })
    })

    await prisma.$transaction(transactionWrites)

    // Log admin (bulk)
    await supabaseAdmin.from('AdminLog').insert({
      admin_id: user.id,
      action: 'UPDATE_PRICING_BULK',
      details: { updates }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Admin Monetization Config Error]:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}
