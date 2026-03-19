import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Wallet,
  Settings,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Search,
  Menu,
  Puzzle,
  Handshake,
  AlertTriangle,
  Mail,
  LayoutTemplate,
  PhoneCall
} from 'lucide-react'
import { signOut } from '@/app/auth/actions'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }> // Typage strict pour les icônes lucide
}

interface AdminUser {
  role: string
  email: string
}

// ----------------------------------------------------------------
// CONFIGURATION NAVIGATION ADMIN
// ----------------------------------------------------------------
const navItems: NavItem[] = [
  { href: '/admin',               label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/admin/vendeurs',      label: 'Vendeurs',        icon: Users },
  { href: '/admin/ambassadeurs',  label: 'Ambassadeurs',    icon: Handshake },
  { href: '/admin/orders',        label: 'Commandes',       icon: ShoppingBag },
  { href: '/admin/closing',       label: 'Validation COD',  icon: PhoneCall },
  { href: '/admin/retraits',      label: 'Retraits',        icon: Wallet },
  { href: '/admin/complaints',    label: 'Plaintes',        icon: AlertTriangle },
  { href: '/admin/roles',         label: 'Rôles & Admins',  icon: ShieldCheck },
  { href: '/admin/kyc',           label: 'KYC',             icon: ShieldCheck },
  { href: '/admin/integrations',  label: 'Intégrations',    icon: Puzzle },
  { href: '/admin/email',         label: 'Email Marketing',  icon: Mail },
  { href: '/admin/landing',       label: 'Landing Page',     icon: LayoutTemplate },
  { href: '/admin/settings',      label: 'Paramètres',       icon: Settings },
]

// ----------------------------------------------------------------
// Badge rôle coloré
// ----------------------------------------------------------------
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin: 'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20',
    gestionnaire: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20',
    support:      'bg-gray-100 text-gray-500 border-gray-200',
  }
  const labels: Record<string, string> = {
    super_admin:  'Super Admin',
    gestionnaire: 'Gestionnaire',
    support:      'Support',
  }
  const cls = styles[role] ?? styles.support
  return (
    <span className={`px-2 py-0.5 border rounded-full text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {labels[role] ?? role}
    </span>
  )
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
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1A1A] flex font-sans">

      {/* ─────────────────────────────────────────────────────────
          SIDEBAR — Gradient émeraude, style charte PDV Pro
      ───────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-[240px] flex-col bg-gradient-to-b from-[#0D5C4A] to-[#0F7A60] fixed inset-y-0 z-50 shadow-xl">

        {/* Logo + Badge Admin */}
        <div className="p-6 flex flex-col items-center border-b border-white/10">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3 shadow-lg">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-black text-xl text-white tracking-tight">PDV</span>
            <span className="font-black text-xl text-[#C9A84C] tracking-tight">Pro</span>
          </div>
          {/* Badge "Admin" en or */}
          <div className="mt-1 px-3 py-0.5 bg-[#C9A84C]/20 border border-[#C9A84C]/40 rounded-full text-[10px] uppercase font-black text-[#C9A84C] tracking-wider">
            Super Admin
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                text-white/70 hover:bg-white/10 hover:text-white"
            >
              <item.icon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bouton Déconnexion en bas */}
        <div className="p-4 border-t border-white/10">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                text-white/40 hover:text-red-300 hover:bg-red-400/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────
          CONTENU PRINCIPAL
      ───────────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-[240px] flex flex-col">

        {/* ── HEADER ── Fond blanc, bordure grise légère */}
        <header className="h-[64px] bg-white border-b border-gray-200 sticky top-0 z-40 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {/* Bouton menu mobile (simplifié pour Server Component) */}
            <button className="lg:hidden p-2 text-gray-400 hover:text-[#1A1A1A]" aria-label="Menu">
              <Menu className="w-6 h-6" />
            </button>
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

          {/* Infos admin + badge rôle */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {userData?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-gray-400">{userData?.email}</span>
            </div>
            <RoleBadge role={userData?.role ?? 'support'} />
            <div className="w-9 h-9 rounded-full bg-[#0F7A60]/10 flex items-center justify-center border border-[#0F7A60]/20">
              <UserIcon className="w-4 h-4 text-[#0F7A60]" />
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT — Fond crème #FAFAF7 ── */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
