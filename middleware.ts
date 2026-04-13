import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


// ─── Séparation des espaces admin / vendeur ───────────────────────────────────
// Rôles autorisés à accéder à /admin
const ADMIN_ROLES  = ['super_admin', 'gestionnaire', 'support'] as const

type Role = typeof ADMIN_ROLES[number] | 'vendeur' | 'acheteur' | 'client' | 'ambassador' | 'affilie' | 'closer'

// ─── Rate Limiting (in-memory, per Vercel instance) ──────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 10_000 // 10 seconds
const RATE_LIMIT_MAX = 30 // 30 requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

// Clean up stale entries periodically (every 60s)
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now()
    rateLimitMap.forEach((entry, key) => {
      if (now > entry.resetAt) rateLimitMap.delete(key)
    })
  }
  setInterval(cleanup, 60_000)
}

export async function middleware(req: NextRequest) {
  // Configurer la réponse par défaut et injecter le pathname
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname
  res.headers.set('x-pathname', pathname)

  // ── Rate Limit — API et auth endpoints ────────────────────────────────────
  if (pathname.startsWith('/api/') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    if (isRateLimited(ip)) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '10' } })
    }
  }

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

  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  const user = supabaseUser

  // --- MIGRATION FALLBACK: Update user_metadata.role if missing ---
  if (user && !user.user_metadata?.role) {
    try {
      const { data: dbUser } = await supabase.from('User').select('role').eq('id', user.id).single()
      if (dbUser?.role) {
        await supabase.auth.updateUser({ data: { role: dbUser.role } })
        user.user_metadata = { ...user.user_metadata, role: dbUser.role }
      }
    } catch (e) {
      console.error('[Middleware] Error updating user metadata role fallback', e)
    }
  }

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
      const role = user?.user_metadata?.role as Role | undefined
      if (role && ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number])) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      if (role === 'affilie') {
        return NextResponse.redirect(new URL('/portal', req.url))
      }
      if (role === 'closer') {
        return NextResponse.redirect(new URL('/closer', req.url))
      }
      if (role === 'acheteur' || role === 'client') {
        return NextResponse.redirect(new URL('/client', req.url))
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
    const role = user?.user_metadata?.role as Role | undefined

    if (!role || !ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number])) {
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
    const role = user?.user_metadata?.role as Role | undefined

    // Admin qui tente d'accéder au dashboard → rediriger vers admin
    if (role && ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number])) {
      console.warn(`[Middleware Dashboard] Admin redirigé — user: ${user.email}, rôle: ${role}`)
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    if (role === 'affilie') {
      return NextResponse.redirect(new URL('/portal', req.url))
    }

    if (role === 'closer') {
      return NextResponse.redirect(new URL('/closer', req.url))
    }

    if (role === 'acheteur' || role === 'client') {
      console.warn(`[Middleware Dashboard] Clic acheteur bloqué — user: ${user.email}, rôle: ${role}`)
      return NextResponse.redirect(new URL('/client', req.url))
    }

    // (L'onboarding est désormais optionnel)

    // Rôle vendeur validé → laisser passer
    return res
  }

  // ── 3.5. Routes /portal/* ──────────────────────────────────────────────────
  if (pathname.startsWith('/portal')) {
    if (!user) return NextResponse.redirect(new URL('/login', req.url))
    
    if (user?.user_metadata?.role !== 'affilie') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  // ── 3.6. Routes /closer/* ──────────────────────────────────────────────────
  if (pathname.startsWith('/closer')) {
    if (!user) return NextResponse.redirect(new URL('/login', req.url))
    
    if (user?.user_metadata?.role !== 'closer') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  // ── 3.7. Routes /client/* ──────────────────────────────────────────────────
  if (pathname.startsWith('/client')) {
    if (!user) return NextResponse.redirect(new URL('/login', req.url))
    
    if (user?.user_metadata?.role !== 'acheteur' && user?.user_metadata?.role !== 'client') {
      // Les vendeurs et affiliés sont redirigés vers leur propre dashboard s'ils tentent d'accéder au client portal
      if (user?.user_metadata?.role === 'affilie') return NextResponse.redirect(new URL('/portal', req.url))
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  // ── 4. Vitrine boutique /[slug] et autres routes non réservées ──────────────
  const reservedRoutes = ['dashboard', 'admin', 'login', 'register', 'api', 'vendeurs', 'portal', 'client', 'closer']
  const firstSegment = pathname.split('/')[1]
  if (firstSegment && !reservedRoutes.includes(firstSegment)) {
    // Route publique (vitrine boutique, etc.) → autoriser
    return res
  }

  // ── 5. Fallback : route protégée sans correspondance → vérifier connexion ───
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  res.headers.set('x-pathname', pathname)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
