import { GlobalHomeButton } from '@/components/shared/GlobalHomeButton'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminMobileBottomNav } from '@/components/admin/AdminMobileBottomNav'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface AdminUser {
  role: string
  email: string
  name: string
  avatar_url: string | null
}

// ----------------------------------------------------------------
// LAYOUT SUPER ADMIN (Server Component)
// ----------------------------------------------------------------
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Double Protection Serveur — Vérification authentification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Vérification du rôle admin via le client admin Supabase
  const supabaseAdmin = createAdminClient()
  const { data: userData } = await supabaseAdmin
    .from('User')
    .select('role, email, name, avatar_url')
    .eq('id', user.id)
    .single<AdminUser>()

  if (userData?.role !== 'super_admin') {
    console.warn(`[Admin Layout] Accès bloqué pour ${user.id} (Rôle: ${userData?.role})`)
    redirect('/dashboard')
  }

  return (
    <div className="flex h-[100dvh] bg-gray-50 font-sans overflow-hidden">
      
      {/* ─────────────────────────────────────────────────────────
          SIDEBAR DYNAMIQUE — Gestion des états desktop/mobile
      ───────────────────────────────────────────────────────── */}
      <AdminSidebar
        adminName={userData?.name || userData?.email?.split('@')[0] || 'Admin'}
        adminEmail={userData?.email ?? ''}
        adminRole={userData?.role ?? 'support'}
        avatarUrl={userData?.avatar_url ?? null}
      />

      {/* ─────────────────────────────────────────────────────────
          CONTENU PRINCIPAL
      ───────────────────────────────────────────────────────── */}
      <main className="relative flex-1 min-w-0 bg-gray-50 h-[100dvh] overflow-y-auto overflow-x-hidden flex flex-col">
        <GlobalHomeButton />

        {/* 🌟 UNIVERSAL MESH BACKGROUND 🌟 */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-300/10 blur-[130px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:10s]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-teal-300/10 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:12s] [animation-delay:2s]" />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col">
          {/* ── HEADER DESKTOP ── Fond blanc / Glassmorphism */}
          <header className="hidden lg:flex h-[64px] bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40 px-6 items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-4 w-full">
              {/* Espace réservé — la recherche est gérée par le contenu */}
            </div>
          </header>

          {/* ── PAGE CONTENT Dynamique ── */}
          <div className="pt-14 lg:pt-4 pb-24 lg:pb-12 w-full max-w-[2000px] mx-auto px-3 lg:px-8 xl:px-10 min-h-full flex-1">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Tab Bar Mobile */}
      <AdminMobileBottomNav
        adminName={userData?.name || userData?.email?.split('@')[0] || 'Admin'}
        adminRole={userData?.role ?? 'support'}
        avatarUrl={userData?.avatar_url ?? null}
      />
    </div>
  )
}
