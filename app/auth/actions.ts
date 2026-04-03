'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { validateAmbassadorCode, linkVendorToAmbassador } from '@/lib/ambassador/ambassador-service'

// ----------------------------------------------------------------
// INSCRIPTION
// ----------------------------------------------------------------
export async function signUp(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const email          = formData.get('email') as string
  const name           = formData.get('name') as string
  const role           = (formData.get('role') as string) || 'vendeur'
  const password       = formData.get('password') as string
  const phone          = (formData.get('phone') as string) || null
  const ambassadorCode = (formData.get('ambassadorCode') as string) || null

  if (!email || !name || !password) {
    redirect('/register?error=champs_requis')
  }

  // ── Validation du code ambassadeur (obligatoire pour vendeur) ──
  if (role === 'vendeur') {
    if (!ambassadorCode || !ambassadorCode.trim()) {
      redirect(`/register?error=code_requis&msg=${encodeURIComponent('Le code ambassadeur est obligatoire pour créer une boutique.')}`)
    }

    const ambassador = await validateAmbassadorCode(ambassadorCode.trim())
    if (!ambassador) {
      redirect(`/register?error=code_invalide&msg=${encodeURIComponent('Code ambassadeur invalide ou inactif. Vérifiez votre code.')}`)
    }
  }

  // Client Admin — SERVICE_ROLE_KEY — bypass RLS
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Double vérification préalable (Email & Téléphone) ──────────

  // A. Vérifier email
  const { data: existingEmail } = await supabaseAdmin
    .from('User')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingEmail) {
    redirect(`/register?error=email_taken&msg=${encodeURIComponent('Cette adresse email est déjà liée à un compte.')}`)
  }

  // B. Vérifier téléphone (si fourni)
  if (phone) {
    const { data: existingPhone } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (existingPhone) {
      redirect(`/register?error=phone_taken&msg=${encodeURIComponent('Ce numéro de téléphone est déjà lié à un compte.')}`)
    }
  }

  // ── Créer l'utilisateur Supabase Auth ──────────────────────────
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
      emailRedirectTo: undefined,
    },
  })

  if (authError || !authData.user) {
    console.error('[SIGNUP ERROR] Auth Supabase:', authError)
    const msg = encodeURIComponent(authError?.message || 'Erreur lors de la création Auth.')
    redirect(`/register?error=auth_error&msg=${msg}`)
  }

  // Connecter directement l'utilisateur
  await supabase.auth.signInWithPassword({ email, password })

  const userId = authData.user!.id

  try {
    // ── Créer User dans la base de données ────────────────────────
    const { error: userError } = await supabaseAdmin.from('User').insert({
      id: userId,
      email,
      name,
      role,    // 'acheteur' ou 'vendeur' — correspond aux valeurs de l'enum Prisma
      phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (userError) {
      if (userError.code === '23505') {
        throw new Error('Ce numéro de téléphone ou cet email est déjà utilisé.')
      }
      throw new Error('Erreur base de données : ' + userError.message)
    }

    // ── Créer Store + Wallet uniquement pour un vendeur ───────────
    if (role === 'vendeur') {
      const storeId  = randomUUID()
      const walletId = randomUUID()
      const slug =
        name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 25) +
        '-' +
        randomUUID().slice(0, 4)

      // Insérer le Store
      const { error: storeError } = await supabaseAdmin.from('Store').insert({
        id: storeId,
        user_id: userId,
        name: name,
        slug: slug,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (storeError) {
        throw new Error('Store insert: ' + storeError.message)
      }

      // Créer le Wallet (si non créé par un trigger)
      const { error: walletError } = await supabaseAdmin
        .from('Wallet')
        .insert({
          id: walletId,
          vendor_id: storeId,
          balance: 0,
          pending: 0,
          total_earned: 0,
          updated_at: new Date().toISOString(),
        })

      // Ignorer 23505 au cas où un trigger aurait déjà créé le wallet
      if (walletError && walletError.code !== '23505') {
        throw new Error('Wallet insert: ' + walletError.message)
      }

      // ── Lier le vendeur à l'ambassadeur ───────────────────────
      if (ambassadorCode && ambassadorCode.trim()) {
        const registrationMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        try {
          await linkVendorToAmbassador(ambassadorCode.trim(), storeId, registrationMonth)
          console.log(`[SIGNUP] Vendeur ${storeId} lié à l'ambassadeur ${ambassadorCode}`)
        } catch (ambassadorError: unknown) {
          // Non bloquant : l'inscription réussit même si le lien ambassadeur échoue
          const msg = ambassadorError instanceof Error ? ambassadorError.message : 'Erreur lien ambassadeur'
          console.error('[SIGNUP] Erreur linkVendorToAmbassador:', msg)
        }
      }
    }

    // ── Rôle acheteur : pas de Store, pas de Wallet ───────────────
    // User créé uniquement — redirection vers le dashboard

  } catch (dbError: unknown) {
    console.error('[SIGNUP ERROR] DB Error:', dbError)

    // Rollback : supprimer le compte Supabase Auth créé
    await supabaseAdmin.auth.admin.deleteUser(userId)

    const msg = dbError instanceof Error ? dbError.message : 'Une erreur interne est survenue.'
    redirect(`/register?error=db_error&msg=${encodeURIComponent(msg)}`)
  }

  // ── Email de bienvenue Brevo ─────────────────────────────────────────
  // Fire-and-forget : ne jamais await, ne jamais bloquer l'inscription
  // Brevo hors ligne = inscription réussie quand même
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${appUrl}/api/brevo/send-welcome`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type:      role === 'vendeur' ? 'vendor' : 'buyer',
      email,
      name,
      storeName: role === 'vendeur' ? name : undefined,
    }),
  }).catch(() => {
    // Silencieux — Brevo ne doit jamais bloquer l'inscription
  })

  revalidatePath('/', 'layout')
  if (role === 'acheteur' || role === 'client') {
    redirect('/client')
  } else if (role === 'affilie') {
    redirect('/portal')
  } else if (role === 'closer') {
    redirect('/closer')
  } else {
    redirect('/dashboard')
  }
}

// ----------------------------------------------------------------
// CONNEXION
// ----------------------------------------------------------------
export async function signIn(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const emailOrPhone = formData.get('emailOrPhone') as string
  const password     = formData.get('password') as string

  if (!emailOrPhone || !password) {
    redirect('/login?error=champs_requis')
  }

  const isEmail = emailOrPhone.includes('@')
  const email   = isEmail
    ? emailOrPhone
    : `${emailOrPhone.replace(/\D/g, '')}@pdvpro.phone`

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !authData.user) {
    redirect('/login?error=identifiants_invalides')
  }

  // Après connexion réussie
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: userData } = await supabaseAdmin.from('User').select('role').eq('id', authData.user.id).single()
  const userRole = userData?.role

  if (userRole === 'acheteur' || userRole === 'client') {
    redirect('/client')
  } else if (userRole === 'affilie') {
    redirect('/portal')
  } else if (userRole === 'closer') {
    redirect('/closer')
  } else if (userRole === 'super_admin' || userRole === 'gestionnaire' || userRole === 'support') {
    redirect('/admin')
  } else {
    redirect('/dashboard')
  }
}

// ----------------------------------------------------------------
// DÉCONNEXION
// ----------------------------------------------------------------
export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Erreur déconnexion (ignorée):', error)
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ----------------------------------------------------------------
// GOOGLE OAUTH
// ----------------------------------------------------------------
export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    }
  })
  
  if (error) {
    console.error('[OAUTH ERROR]', error.message)
    redirect('/login?error=auth_error')
  }

  if (data.url) redirect(data.url)
}
