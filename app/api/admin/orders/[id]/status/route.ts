// ─── app/api/admin/orders/[id]/status/route.ts ───────────────────────────────
// Route PATCH — Changer le statut d'une commande (admin)
// Body : { status: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_STATUSES = [
  'pending', 'pending_payment', 'paid', 'processing',
  'shipped', 'delivered', 'completed', 'cancelled', 'refunded',
] as const

type OrderStatus = typeof VALID_STATUSES[number]

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // 1. Auth admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: adminUser } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['super_admin', 'gestionnaire', 'support']
    if (!adminUser?.role || !allowedRoles.includes(adminUser.role as string)) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    // 2. Parser le body
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ success: false, error: 'Body invalide' }, { status: 400 })
    }

    const { status, reason } = body as { status: string, reason?: string }
    if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json({ success: false, error: 'Statut invalide' }, { status: 400 })
    }

    if (['cancelled', 'refunded'].includes(status) && !reason) {
      return NextResponse.json({ success: false, error: 'Un motif est requis pour ce statut.' }, { status: 400 })
    }

    // 3. Mettre à jour le statut
    const { error: updateErr } = await supabaseAdmin
      .from('Order')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (updateErr) {
      return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    // 4. Trace dans l'Audit Center (Governance)
    const { error: logErr } = await supabaseAdmin
      .from('AdminLog')
      .insert({
        admin_id: user.id,
        action: 'UPDATE_STATUS',
        target_type: 'ORDER',
        target_id: params.id,
        details: {
          new_status: status,
          reason: reason || null,
        }
      })

    if (logErr) {
      console.error('[Gouvernance] Erreur log statut commande :', logErr.message)
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('[Gouvernance] Exception PATCH:', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
