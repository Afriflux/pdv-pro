import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Séparation des espaces admin / vendeur ───────────────────────────────────
// Rôles autorisés à accéder à /admin
const ADMIN_ROLES  = ['super_admin', 'gestionnaire', 'support'] as const

type Role = typeof ADMIN_ROLES[number] | 'vendeur' | 'acheteur' | 'client' | 'ambassador' | 'affilie'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options) => {
        res.cookies.set({ name, value, ...options })
      },
      remove: (name, options) => {
        res.cookies.set({ name, value: '', ...options })
      },
    }}
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = req.nextUrl.pathname

  // ── 1. Routes publiques → toujours autoriser ────────────────────────────────
  // /admin/login est public pour permettre la connexion sans session
  if (
    pathname === '/' ||
    pathname === '/admin/login' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/p/') ||
    pathname.startsWith('/checkout/') ||
    pathname.startsWith('/pay/') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/vendeurs') ||
    pathname.startsWith('/verify/') ||
    pathname.startsWith('/dl/') ||
    pathname.startsWith('/conditions-utilisation') ||
    pathname.startsWith('/politique-confidentialite') ||
    pathname.startsWith('/mentions-legales')
  ) {
    // Si déjà connecté sur /login ou /register → rediriger selon le rôle
    if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      const supabaseAdmin = createAdminClient()
      const { data: userData } = await supabaseAdmin
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = userData?.role as Role | undefined
      if (role && ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number])) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Si déjà connecté sur /admin/login → rediriger vers /admin
    if (user && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }


    return res
  }

  // ── 2. Routes /admin/* (hors /admin/login déjà géré ci-dessus) ─────────────
  if (pathname.startsWith('/admin')) {
    // Non connecté → page de login admin
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    // Vérifier le rôle
    const supabaseAdmin = createAdminClient()
    const { data: userData, error } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role as Role | undefined

    if (error || !role || !ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number])) {
      // Vendeur ou rôle inconnu → rediriger vers dashboard vendeur
      console.warn(`[Middleware Admin] Accès refusé — user: ${user.email}, rôle: ${role}`)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Rôle admin valide → laisser passer
    return res
  }

  // ── 3. Routes /dashboard/* ──────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    // Non connecté → page de login vendeur
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Vérifier le rôle
    const supabaseAdmin = createAdminClient()
    const { data: userData } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role as Role | undefined

    // Admin qui tente d'accéder au dashboard → rediriger vers admin
    if (role && ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number])) {
      console.warn(`[Middleware Dashboard] Admin redirigé — user: ${user.email}, rôle: ${role}`)
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    // (L'onboarding est désormais optionnel)

    // Rôle vendeur/client validé → laisser passer
    return res
  }

  // ── 4. Vitrine boutique /[slug] et autres routes non réservées ──────────────
  const reservedRoutes = ['dashboard', 'admin', 'login', 'register', 'api', 'vendeurs']
  const firstSegment = pathname.split('/')[1]
  if (firstSegment && !reservedRoutes.includes(firstSegment)) {
    // Route publique (vitrine boutique, etc.) → autoriser
    return res
  }

  // ── 5. Fallback : route protégée sans correspondance → vérifier connexion ───
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
