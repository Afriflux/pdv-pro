'use server'

// ─── Server Action : Connexion Admin Yayyam ──────────────────────────────────
// Vérifie l'identité + le rôle avant d'autoriser l'accès à /admin
// Rôles autorisés : super_admin, gestionnaire, support

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Rôles ayant accès à l'espace admin
const ADMIN_ROLES = ['super_admin', 'gestionnaire', 'support'] as const
type AdminRole = typeof ADMIN_ROLES[number]

export async function adminSignIn(formData: FormData): Promise<void> {
  let email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validation basique des champs
  if (!email || !password) {
    redirect('/admin/login?error=invalid_credentials')
  }

  email = email.trim().toLowerCase()

  const supabase = await createClient()

  // 1. Connexion via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    // Mauvais identifiants ou compte inexistant
    redirect('/admin/login?error=invalid_credentials')
  }

  // 2. Vérifier le rôle admin dans la table User (via admin client pour bypasser RLS)
  const supabaseAdmin = createAdminClient()
  const { data: userData } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  // 3. Rôle non autorisé → déconnecter immédiatement + rediriger avec erreur
  if (!userData || !ADMIN_ROLES.includes(userData.role as AdminRole)) {
    // Déconnexion forcée pour ne pas laisser une session active non admin
    await supabase.auth.signOut()
    redirect('/admin/login?error=unauthorized')
  }

  // 4. Accès autorisé → invalider le cache du layout admin et rediriger
  revalidatePath('/admin', 'layout')
  redirect('/admin')
}
