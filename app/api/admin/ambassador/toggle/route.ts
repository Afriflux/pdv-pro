// ─── app/api/admin/ambassador/toggle/route.ts ─────────────────────────────────
// Route POST — Activer / Désactiver un ambassadeur
// Body : { id: string, is_active: boolean }
//
// CORRECTION : l'ancien code attendait { ambassadorId, isActive }
// mais le client envoie { id, is_active } → UPDATE jamais exécuté.
// Fix : accepter les deux formats (rétrocompatibilité).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
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
      return NextResponse.json({ error: 'Accès réservé aux admins' }, { status: 403 })
    }

    // 2. Parser le body
    // Support des deux formats : { id, is_active } ET { ambassadorId, isActive }
    let body: Record<string, unknown>
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
    }

    // Normalisation des clés (rétrocompatibilité)
    const ambassadorId = (body['id'] ?? body['ambassadorId']) as string | undefined
    const isActive     = (body['is_active'] ?? body['isActive']) as boolean | undefined

    if (!ambassadorId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Champs requis : id (string) et is_active (boolean)' },
        { status: 400 }
      )
    }

    // 3. UPDATE Ambassador.is_active
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('Ambassador')
      .update({
        is_active:  isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ambassadorId)
      .select('id, is_active')
      .single()

    if (updateError) {
      console.error('[ambassador/toggle] Erreur update:', updateError.message)
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    console.log(
      `[ambassador/toggle] ✅ Ambassador ${ambassadorId} → is_active = ${isActive}`
    )

    return NextResponse.json({
      success:   true,
      is_active: (updated as { id: string; is_active: boolean } | null)?.is_active ?? isActive,
    }, { status: 200 })

  } catch (err: unknown) {
    console.error('[ambassador/toggle]', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
