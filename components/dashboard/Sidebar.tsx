'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  ShoppingCart, 
  Sparkles, 
  Wallet, 
  Share2, 
  Target, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Zap, 
  ListTodo, 
  Gem, 
  Settings,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Wand2,
  Truck,
  MapPin,
  Calendar,
  PhoneCall,
  Send
} from 'lucide-react'
import { NotificationBell } from './NotificationBell'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  for?: ('digital' | 'physical' | 'hybrid')[]
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}


// ----------------------------------------------------------------
// Navigation
// ----------------------------------------------------------------
const NAV: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Mes Produits', href: '/dashboard/products', icon: Package },
      { name: 'Pages de vente', href: '/dashboard/pages', icon: ShoppingBag },
      { name: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart },
      { name: 'Validation COD', href: '/dashboard/closing', icon: PhoneCall, for: ['physical', 'hybrid'] },
      { name: 'Livraisons', href: '/dashboard/livraisons', icon: Truck, for: ['physical', 'hybrid'] },
      { name: 'Zones tarifaires', href: '/dashboard/zones', icon: MapPin, for: ['physical', 'hybrid'] },
      { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
      { name: 'Nouveautés', href: '/dashboard/tips', icon: Sparkles },
    ]
  },
  {
    title: 'FINANCES',
    items: [
      { name: 'Portefeuille', href: '/dashboard/wallet', icon: Wallet },
    ]
  },
  {
    title: 'CROISSANCE',
    items: [
      { name: 'Marketing', href: '/dashboard/marketing', icon: Share2 },
      { name: 'Offres & Promotions', href: '/dashboard/promotions', icon: Target },
      { name: 'Affiliés', href: '/dashboard/affilies', icon: Users },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Générateur IA', href: '/dashboard/ai-generator', icon: Wand2 },
    ]
  },
  {
    title: 'COMMUNAUTÉS',
    items: [
      { name: 'Telegram', href: '/dashboard/telegram', icon: Send, badge: '🔥 NEW' },
      { name: 'Communauté', href: '/dashboard/communautes', icon: MessageSquare },
      { name: 'Questions clients', href: '/dashboard/questions', icon: MessageSquare },
    ]
  },
  {
    title: 'AUTOMATISATIONS',
    items: [
      { name: 'Workflows', href: '/dashboard/workflows', icon: Zap },
      { name: 'Tâches', href: '/dashboard/tasks', icon: ListTodo },
    ]
  },
  {
    title: 'COMPTE',
    items: [
      { name: 'Abonnement',       href: '/dashboard/abonnements', icon: Gem },
      { name: 'Paramètres',       href: '/dashboard/settings',    icon: Settings },
    ]
  }
]

// ----------------------------------------------------------------
// Sous-composant NavLink
// ----------------------------------------------------------------
function NavLink({ item, active, onClick, collapsed }: { item: NavItem, active: boolean, onClick?: () => void, collapsed?: boolean }) {
  const Icon = item.icon
  return (
    <div className="relative group/navitem">
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center ${collapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'px-3 gap-3 py-2.5'} rounded-xl transition-all duration-200 ${
          active
            ? 'bg-white/10 text-white font-bold shadow-sm backdrop-blur-sm'
            : 'text-white/60 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className={`${collapsed ? 'w-[22px] h-[22px]' : 'w-5 h-5'} flex-shrink-0 transition-transform duration-200`} />
        {!collapsed && <span className="text-sm truncate">{item.name}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
      
      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover/navitem:opacity-100 group-hover/navitem:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
          {item.name}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// Sidebar — contenu interne (réutilisé desktop + mobile)
// ----------------------------------------------------------------
function SidebarContent({
  storeName,
  userName,
  avatarUrl,
  vendorType,
  onClose,
  collapsed,
  setCollapsed
}: {
  storeName: string
  userName: string
  avatarUrl?: string | null
  vendorType: 'digital' | 'physical' | 'hybrid'
  onClose?: () => void
  collapsed?: boolean
  setCollapsed?: (val: boolean) => void
}) {
  const pathname = usePathname()
  const router   = useRouter()

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'FINANCES': false,
    'CROISSANCE': false,
    'AUTOMATISATIONS': false,
    'COMPTE': false
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setMounted] = useState(false)

  // Load section collapse state from localStorage optionally
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('sidebar_sections')
      if (saved) setCollapsedSections(JSON.parse(saved))
    } catch {}
  }, [])

  const toggleSection = (title: string) => {
    const newState = { ...collapsedSections, [title]: !collapsedSections[title] }
    setCollapsedSections(newState)
    localStorage.setItem('sidebar_sections', JSON.stringify(newState))
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full py-4 relative">
      {/* Header (Logo + Bell + Toggle) */}
      <div className={`px-4 mt-2 mb-6 flex ${collapsed ? 'flex-col items-center gap-4' : 'items-center justify-between'} flex-shrink-0`}>
        <Link href="/dashboard" className="flex items-center gap-1 focus:outline-none" onClick={onClose}>
          {collapsed ? (
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-display font-black text-white tracking-tight">P</span>
            </div>
          ) : (
            <>
              <span className="text-2xl font-display font-black text-white tracking-tight">PDV</span>
              <span className="text-2xl font-display font-black text-gold tracking-tight">Pro</span>
            </>
          )}
        </Link>
        
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <NotificationBell />
          {/* Toggle only in Desktop API via setCollapsed */}
          {setCollapsed && (
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto custom-scrollbar ${collapsed ? 'px-2' : 'px-3'} space-y-4`}>
        {NAV.map(section => {
          const isSectionCollapsed = collapsedSections[section.title]

          return (
            <div key={section.title} className="flex flex-col">
              {!collapsed ? (
                <button 
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between px-2 mt-2 mb-1 group"
                >
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.15em] group-hover:text-white/60 transition-colors">
                    {section.title}
                  </span>
                  {isSectionCollapsed ? 
                    <ChevronDown className="w-3.5 h-3.5 text-white/30" /> : 
                    <ChevronUp className="w-3.5 h-3.5 text-white/30" />
                  }
                </button>
              ) : (
                <div className="h-4" /> // spacing between sections in collapsed mode
              )}
              
              <div className={`space-y-1 transition-all overflow-hidden ${isSectionCollapsed && !collapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 mt-1'}`}>
                {section.items.filter(item => !item.for || item.for.includes(vendorType)).map(item => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    onClick={onClose}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer / Profile */}
      <div className={`mt-auto border-t border-white/10 ${collapsed ? 'px-2 pb-2 pt-4' : 'px-4 pb-4 pt-4'} flex-shrink-0 transition-all`}>
        <div className={`flex items-center ${collapsed ? 'justify-center mx-auto' : 'gap-3 overflow-hidden px-1'} mb-3`}>
          <div className="relative w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-black text-gold/80">{userName[0]}</span>
            )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate leading-tight">{storeName}</p>
              <p className="text-[11px] text-white/50 truncate uppercase tracking-wider">{userName}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'px-3 gap-3'} py-2 rounded-xl text-white/50 hover:text-red-300 hover:bg-red-400/10 transition-colors text-sm group/logout relative`}
        >
          <LogOut className={`${collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'}`} />
          {!collapsed && <span className="font-medium text-[13px]">Déconnexion</span>}
          
          {collapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
              Déconnexion
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Export principal
// ----------------------------------------------------------------
export function Sidebar({
  storeName,
  userName,
  avatarUrl,
  vendorType,
}: {
  storeName: string
  userName: string
  avatarUrl?: string | null
  vendorType: 'digital' | 'physical' | 'hybrid'
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // States exist outside rendering loop for persistence
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load and apply the collapsed state securely on client
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('sidebar_collapsed')
      if (saved) setCollapsed(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed))
    }
  }, [collapsed, mounted])

  return (
    <>
      {/* ── DESKTOP : sidebar fixe gauche ── */}
      <aside 
        className={`hidden lg:flex flex-col flex-shrink-0 bg-gradient-to-b from-emerald-deep to-emerald h-screen sticky top-0 z-30 transition-all duration-200 ease-in-out ${
          collapsed && mounted ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent 
          storeName={storeName} 
          userName={userName} 
          avatarUrl={avatarUrl}
          vendorType={vendorType}
          collapsed={collapsed && mounted}
          setCollapsed={setCollapsed}
        />
      </aside>

      {/* ── MOBILE : bouton hamburger + drawer ── */}
      <div className="lg:hidden">
        {/* Topbar mobile */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-emerald-deep border-b border-white/5 flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-white/60 hover:text-white transition p-1"
              aria-label="Ouvrir le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-lg font-display font-black text-white">PDV</span>
              <span className="text-lg font-display font-black text-gold">Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>

        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-gradient-to-b from-emerald-deep to-emerald transform transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Bouton fermeture */}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition"
            aria-label="Fermer le menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <SidebarContent
            storeName={storeName}
            userName={userName}
            avatarUrl={avatarUrl}
            vendorType={vendorType}
            onClose={() => setMobileOpen(false)}
            collapsed={false} // Drawer mobile toujours fully expanded
          />
        </div>
      </div>
    </>
  )
}
