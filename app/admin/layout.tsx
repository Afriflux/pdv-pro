import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Search } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface AdminUser {
  role: string
  email: string
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
    .select('role, email')
    .eq('id', user.id)
    .single<AdminUser>()

  if (userData?.role !== 'super_admin') {
    console.warn(`[Admin Layout] Accès bloqué pour ${user.id} (Rôle: ${userData?.role})`)
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAF7] font-sans overflow-hidden">
      
      {/* ─────────────────────────────────────────────────────────
          SIDEBAR DYNAMIQUE — Gestion des états desktop/mobile
      ───────────────────────────────────────────────────────── */}
      <AdminSidebar
        adminName={userData?.email?.split('@')[0] ?? 'Admin'}
        adminEmail={userData?.email ?? ''}
        adminRole={userData?.role ?? 'support'}
        avatarUrl={null}
      />

      {/* ─────────────────────────────────────────────────────────
          CONTENU PRINCIPAL
      ───────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 bg-[#FAFAF7] h-screen overflow-y-auto relative flex flex-col pt-14 lg:pt-0">

        {/* ── HEADER DESKTOP ── Fond blanc / Glassmorphism */}
        <header className="hidden lg:flex h-[64px] bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40 px-6 items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-4 w-full">
            {/* Barre de recherche */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-[#FAFAF7] border border-gray-200 rounded-full py-1.5 pl-10 pr-4 text-xs
                  focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all"
              />
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT Dynamique ── */}
        <AdminPageWrapper>
          {children}
        </AdminPageWrapper>
      </main>
    </div>
  )
}
