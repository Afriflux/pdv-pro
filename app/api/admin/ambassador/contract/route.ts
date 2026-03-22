// ─── app/api/admin/ambassador/contract/route.ts ──────────────────────────────
// Route PATCH — Enregistrer la signature du contrat ambassadeur
// Body : { id: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Vérifier rôle : super_admin ou gestionnaire
    const { data: callerData } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['super_admin', 'gestionnaire']
    if (!callerData?.role || !allowedRoles.includes(callerData.role as string)) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    // 2. Parser le body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Body JSON invalide' }, { status: 400 })
    }

    const { id } = body as { id?: string }

    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Champ requis : id (string)' },
        { status: 400 }
      )
    }

    // 3. Vérifier que l'ambassadeur existe
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('Ambassador')
      .select('id, contract_accepted')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: 'Ambassadeur introuvable' }, { status: 404 })
    }

    if ((existing as { id: string; contract_accepted: boolean }).contract_accepted) {
      // Déjà signé → idempotent, on retourne success sans re-UPDATE
      return NextResponse.json({ success: true, already_signed: true }, { status: 200 })
    }

    // 4. UPDATE : marquer le contrat comme accepté
    const { error: updateErr } = await supabaseAdmin
      .from('Ambassador')
      .update({
        contract_accepted:    true,
        contract_accepted_at: new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .eq('id', id)

    if (updateErr) {
      console.error('[ambassador/contract] Erreur update:', updateErr.message)
      return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    console.log(`[ambassador/contract] ✅ Contrat signé pour l'ambassadeur ${id}`)

    return NextResponse.json({ success: true, already_signed: false }, { status: 200 })

  } catch (err: unknown) {
    console.error('[ambassador/contract]', err)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
