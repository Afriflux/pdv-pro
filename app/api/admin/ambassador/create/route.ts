import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

// ─── POST /api/admin/ambassador/create ───────────────────────────────────────

interface CreateAmbassadorBody {
  email: string
  name: string
  code: string
  bio?: string
  commissionPerVendor?: number
  minCaRequirement?: number
}

export async function POST(req: Request): Promise<Response> {
  // 1. Vérifier auth + rôle super_admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const supabaseAdmin = createAdminClient()

  const { data: callerData } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerData?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès réservé aux super admins' }, { status: 403 })
  }

  // 2. Parser le body
  let body: CreateAmbassadorBody
  try {
    body = (await req.json()) as CreateAmbassadorBody
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const {
    email,
    name,
    code,
    bio,
    commissionPerVendor = 1000,
    minCaRequirement    = 50000,
  } = body

  if (!email?.trim() || !name?.trim() || !code?.trim()) {
    return NextResponse.json({ error: 'email, name et code sont obligatoires' }, { status: 400 })
  }

  const normalizedCode = code.trim().toUpperCase()

  try {
    // 3. Trouver le User par email
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('User')
      .select('id, email, name')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: `Aucun compte trouvé pour l'email : ${email}` },
        { status: 404 }
      )
    }

    const targetUserRow = targetUser as { id: string; email: string; name: string }

    // 4. Vérifier qu'il n'est pas déjà ambassadeur
    const { data: existing } = await supabaseAdmin
      .from('Ambassador')
      .select('id')
      .eq('user_id', targetUserRow.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Cet utilisateur est déjà ambassadeur.' },
        { status: 409 }
      )
    }

    // 5. Vérifier l'unicité du code
    const { data: codeExists } = await supabaseAdmin
      .from('Ambassador')
      .select('id')
      .eq('code', normalizedCode)
      .single()

    if (codeExists) {
      return NextResponse.json(
        { error: `Le code "${normalizedCode}" est déjà utilisé. Choisissez un autre code.` },
        { status: 409 }
      )
    }

    // 6. Créer l'ambassadeur
    const ambassadorId = randomUUID()

    const { data: newAmb, error: createError } = await supabaseAdmin
      .from('Ambassador')
      .insert({
        id:                   ambassadorId,
        user_id:              targetUserRow.id,
        code:                 normalizedCode,
        name:                 name.trim(),
        bio:                  bio?.trim() ?? null,
        commission_per_vendor: commissionPerVendor,
        min_ca_requirement:   minCaRequirement,
        total_referred:       0,
        total_qualified:      0,
        total_earned:         0,
        balance:              0,
        is_active:            true,
        created_at:           new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .select('id, code, name')
      .single()

    if (createError || !newAmb) {
      console.error('[Admin/Ambassador Create] Erreur insert:', createError?.message)
      throw new Error('Erreur lors de la création de l\'ambassadeur.')
    }

    // 7. Mettre à jour le rôle de l'utilisateur → 'ambassador'
    await supabaseAdmin
      .from('User')
      .update({ role: 'ambassador', updated_at: new Date().toISOString() })
      .eq('id', targetUserRow.id)

    console.log(
      `[Admin/Ambassador Create] ✅ Ambassadeur ${normalizedCode} créé pour ${email} (userId: ${targetUserRow.id})`
    )

    return NextResponse.json(
      { ambassador: newAmb as { id: string; code: string; name: string } },
      { status: 201 }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[Admin/Ambassador Create] ❌', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
