import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ----------------------------------------------------------------
// POST /api/admin/roles/create
//
// Crée un nouveau compte administrateur (gestionnaire ou support).
// Protégé : seul un super_admin peut appeler cette route.
//
// Body : { email, name, role, password }
// Retour : { success: true, user: { id, email, role } }
// Erreurs :
//   403 — Tentative de créer un super_admin, ou appelant non super_admin
//   409 — Email déjà utilisé
//   400 — Champ manquant ou invalide
//   500 — Erreur Supabase inattendue
// ----------------------------------------------------------------

interface CreateAdminBody {
  email:    string
  name:     string
  role:     string
  password: string
}

export async function POST(req: NextRequest) {
  try {
    // 1. Vérifier que l'appelant est authentifié et est super_admin
    const supabase      = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: callerData } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    if (callerData?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Accès refusé. Seul un super_admin peut créer des comptes administrateurs.' },
        { status: 403 }
      )
    }

    // 2. Parser et valider le body
    const body = await req.json() as CreateAdminBody
    const { email, name, role, password } = body

    if (!email?.trim() || !name?.trim() || !role || !password) {
      return NextResponse.json(
        { error: 'Tous les champs (email, name, role, password) sont obligatoires.' },
        { status: 400 }
      )
    }

    // 3. Refuser la création d'un super_admin via l'interface
    if (role === 'super_admin') {
      return NextResponse.json(
        { error: 'Le rôle super_admin ne peut pas être attribué via cette interface.' },
        { status: 403 }
      )
    }

    // Valider que le rôle est bien gestionnaire ou support
    if (!['gestionnaire', 'support'].includes(role)) {
      return NextResponse.json(
        { error: `Rôle invalide : "${role}". Valeurs acceptées : gestionnaire, support.` },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit comporter au moins 8 caractères.' },
        { status: 400 }
      )
    }

    // 4. Créer l'utilisateur via l'API Admin Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email:          email.trim(),
      password,
      email_confirm:  true, // Confirmer directement sans email
    })

    if (authError) {
      // 409 Conflict : email déjà utilisé dans Supabase Auth
      if (authError.message.toLowerCase().includes('already') || authError.status === 422) {
        return NextResponse.json(
          { error: `L'email "${email}" est déjà utilisé par un compte existant.` },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const newUserId = authData.user.id

    // 5. Insérer l'utilisateur dans la table "User" de l'application
    //    PAS de Store, PAS de Wallet, PAS de code ambassadeur — compte admin uniquement
    const now = new Date().toISOString()
    const { error: insertError } = await supabaseAdmin
      .from('User')
      .insert({
        id:         newUserId,
        email:      email.trim(),
        name:       name.trim(),
        role,
        created_at: now,
        updated_at: now,
      })

    if (insertError) {
      // Rollback : supprimer l'utilisateur Supabase Auth si l'insert échoue
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil admin : ' + insertError.message },
        { status: 500 }
      )
    }

    console.log(`[Admin Roles] Nouveau ${role} créé : ${email} (${newUserId}) par ${user.id}`)

    return NextResponse.json({
      success: true,
      user: { id: newUserId, email: email.trim(), role },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Admin Roles Create] Erreur fatale:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
