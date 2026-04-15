'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut } from '@/app/auth/actions'
import { Store,  
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  ShoppingBag,
  Settings,
  Wallet,
  GraduationCap,
  BarChart3,
  ListOrdered,
  Image,
  ArrowLeftRight,
  LucideIcon,
  CalendarDays,
  Sparkles,
  Workflow,
 } from 'lucide-react'
import { NotificationBell } from '@/components/dashboard/NotificationBell'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

// ----------------------------------------------------------------
// Navigation (Affiliate Sections)
// ----------------------------------------------------------------
const NAV: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { name: 'Tableau de bord', href: '/portal', icon: LayoutDashboard },
      { name: 'Programmes / Marché', href: '/portal/marketplace', icon: ShoppingBag },
      { name: 'Générateur de liens', href: '/portal/links', icon: LinkIcon },
    ]
  },
  {
    title: 'PERFORMANCES',
    items: [
      { name: 'Analytics', href: '/portal/analytics', icon: BarChart3, badge: 'NEW' },
      { name: 'Mes Ventes', href: '/portal/sales', icon: ListOrdered, badge: 'NEW' },
    ]
  },
  {
    title: 'PRODUCTIVITÉ',
    items: [
      { name: 'Mes Réservations', href: '/portal/agenda', icon: CalendarDays },
      { name: 'Mes Tâches', href: '/portal/tasks', icon: Sparkles },
      { name: 'Mes Automatisations', href: '/portal/workflows', icon: Workflow },
    ]
  },
  {
    title: 'OUTILS PROMO',
    items: [
      { name: 'Ressources', href: '/portal/resources', icon: Image, badge: 'NEW' },
    ]
  },
  {
    title: 'FORMATION',
    items: [
      { name: 'Académie', href: '/portal/academy', icon: GraduationCap },
    ]
  },
  {
    title: 'FINANCES',
    items: [
      { name: 'Mon Portefeuille', href: '/portal/wallet', icon: Wallet },
    ]
  },
  {
    title: 'COMPTE',
    items: [
      { name: 'Paramètres', href: '/portal/settings', icon: Settings },
      { name: 'Espace Acheteur', href: '/api/dashboard/switch-to-buyer', icon: ArrowLeftRight },
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
        suppressHydrationWarning
        href={item.href}
        onClick={onClick}
        className={`flex items-center relative overflow-hidden ${collapsed ? 'justify-center px-0 w-11 h-11 mx-auto rounded-xl' : 'px-3 gap-3 py-2.5 rounded-xl'} transition-all duration-300 ${
          active
            ? 'bg-emerald-50 text-[#0F7A60] font-bold shadow-sm border border-emerald-100/50'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        {active && !collapsed && (
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F7A60] rounded-l-xl shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
        )}
        
        <Icon suppressHydrationWarning className={`${collapsed ? 'w-[20px] h-[20px]' : 'w-[18px] h-[18px]'} flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'group-hover/navitem:scale-110'}`} />
        {!collapsed && <span className="text-[13px] truncate relative z-10 font-medium">{item.name}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto text-xs font-black bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 px-2 py-0.5 rounded-md shadow-sm relative z-10 uppercase tracking-wider">
            {item.badge}
          </span>
        )}
      </Link>
      
      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-800 backdrop-blur-xl text-white text-[12px] font-bold rounded-xl opacity-0 invisible group-hover/navitem:opacity-100 group-hover/navitem:visible transition-all whitespace-nowrap z-50 shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/20">
          {item.name}
        </div>
      )}
    </div>
  )
}

function SwitchToBuyerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-2xl max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <ArrowLeftRight size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 text-center mb-2">Espace Acheteur</h3>
        <p className="text-emerald-100/60 text-sm text-center mb-8 leading-relaxed">
          Voulez-vous basculer sur votre Espace Acheteur ? Vous pourrez revenir sur ce tableau de bord à tout moment pour gérer vos affiliations.
        </p>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm border border-gray-200"
          >
            Annuler
          </button>
          <a
            href="/api/dashboard/switch-to-buyer"
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-900 text-center font-bold rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20"
          >
            Confirmer
          </a>
        </div>
      </div>
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
  onClose,
  collapsed,
  setCollapsed
}: {
  storeName: string
  userName: string
  avatarUrl?: string | null
  onClose?: () => void
  collapsed?: boolean
  setCollapsed?: (val: boolean) => void
}) {
  const pathname = usePathname()

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'FINANCES': false,
    'FORMATION': false,
    'COMPTE': false
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('portal_sidebar_sections')
      if (saved) setCollapsedSections(JSON.parse(saved))
    } catch {}
  }, [])

  const toggleSection = (title: string) => {
    const newState = { ...collapsedSections, [title]: !collapsedSections[title] }
    setCollapsedSections(newState)
    localStorage.setItem('portal_sidebar_sections', JSON.stringify(newState))
  }

  const isActive = (href: string) => {
    if (href === '/portal') return pathname === '/portal'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full py-4 relative">
      {/* Header (Logo + Bell + Toggle) */}
      <div className={`px-4 mt-4 mb-8 flex ${collapsed ? 'flex-col items-center gap-4' : 'items-center justify-between'} flex-shrink-0`}>
        <Link href="/" className="flex items-center gap-1.5 focus:outline-none group/logo" onClick={onClose}>
          {collapsed ? (
            <div className="w-11 h-11 bg-gradient-to-br from-white/20 to-white/5 border border-white/20 rounded-xl flex items-center justify-center shadow-lg group-hover/logo:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
              <Store className="w-6 h-6 text-emerald-400 stroke-[2.5]" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-1 py-1 rounded-xl group-hover/logo:bg-white/5 transition-colors">
              <span className="text-2xl font-display font-black text-gray-900 tracking-tight">Yayyam</span>
              <span className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-400 tracking-tight drop-shadow-md">Affilié</span>
            </div>
          )}
        </Link>
        
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          
          
            <NotificationBell />
          {/* Toggle only in Desktop API via setCollapsed */}
          {setCollapsed && (
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
                  className="flex items-center justify-between px-2 mt-4 mb-2 group"
                >
                  <span className="text-xs font-black text-emerald-100/40 uppercase tracking-[0.2em] group-hover:text-emerald-100/70 transition-colors drop-shadow-sm">
                    {section.title}
                  </span>
                  {isSectionCollapsed ? 
                    <ChevronDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" /> : 
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                  }
                </button>
              ) : (
                <div className="h-4" /> // spacing between sections in collapsed mode
              )}
              
              <div className={`space-y-1 transition-all overflow-hidden ${isSectionCollapsed && !collapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 mt-1'}`}>
                {section.items.map(item => (
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
      <div className={`mt-auto ${collapsed ? 'px-2 pb-4 pt-2' : 'px-4 pb-6 pt-2'} flex-shrink-0 transition-all`}>
        <div className={`relative overflow-hidden ${collapsed ? 'bg-transparent flex flex-col items-center gap-3' : 'bg-gray-50 border border-gray-200 rounded-[1.5rem] p-3 shadow-lg hover:bg-white/10 transition-colors duration-300'}`}>
          <div className={`flex items-center ${collapsed ? '' : 'gap-3 mb-3'}`}>
            <div className="relative w-10 h-10 rounded-full border border-emerald-100 overflow-hidden bg-emerald-50 flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-black text-emerald-300">{userName[0]}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-gray-900 truncate leading-tight tracking-tight">{userName}</p>
                <p className="text-xs text-gray-400 truncate uppercase tracking-wider font-semibold mt-0.5" title="Membre de la plateforme">Ambassadeur: {storeName}</p>
              </div>
            )}
          </div>
          
          <form action={signOut} className={`w-full flex items-center`}>
            <button
              type="submit"
              className={`w-full flex items-center justify-center ${collapsed ? 'px-0 w-10 h-10 rounded-xl bg-gray-50 hover:bg-red-50 border-transparent' : 'px-4 py-2.5 rounded-xl gap-2 bg-red-500/10'} text-red-500 hover:bg-red-500 hover:text-white border border-red-200 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 text-[13px] font-bold group/logout relative`}
            >
              <LogOut className={`${collapsed ? 'w-5 h-5' : 'w-[16px] h-[16px]'}`} strokeWidth={collapsed ? 2 : 2.5} />
              {!collapsed && <span>Déconnexion</span>}
              
              {collapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-gray-900 text-xs font-semibold rounded-lg opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
                  Déconnexion
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Export principal
// ----------------------------------------------------------------
export function PortalSidebar({
  storeName,
  userName,
  avatarUrl,
}: {
  storeName: string
  userName: string
  avatarUrl?: string | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // States exist outside rendering loop for persistence
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Intercept click on the Switch to buyer link globally
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.getAttribute('href') === '/api/dashboard/switch-to-buyer') {
        e.preventDefault()
        setShowSwitchModal(true)
      }
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  // Load and apply the collapsed state securely on client
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('portal_sidebar_collapsed')
      if (saved) setCollapsed(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('portal_sidebar_collapsed', JSON.stringify(collapsed))
    }
  }, [collapsed, mounted])

  const isEffectivelyCollapsed = collapsed && mounted && !hovered

  return (
    <>
      <SwitchToBuyerModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
      {/* ── DESKTOP : sidebar fixe gauche ── */}
      <aside 
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`hidden lg:flex flex-col flex-shrink-0 bg-white h-screen sticky top-0 z-30 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
          isEffectivelyCollapsed ? 'w-[84px]' : 'w-[280px]'
        }`}
      >
        <div className="relative z-10 flex flex-col h-full w-full">
          <SidebarContent 
            storeName={storeName} 
            userName={userName} 
            avatarUrl={avatarUrl}
            collapsed={isEffectivelyCollapsed}
            setCollapsed={setCollapsed}
          />
        </div>
      </aside>

      {/* ── MOBILE : top bar compacte ── */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-3 h-14">
          <Link href="/" className="flex items-center gap-2 focus:outline-none ml-1">
            <div className="w-8 h-8 rounded-xl bg-[#0F7A60] flex items-center justify-center shadow-sm">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-white">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a2 2 0 01-2 2H5a2 2 0 01-2-2V9.5z" />
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
               </svg>
            </div>
            <span className="text-lg font-display font-black text-gray-900">Yayyam</span>
          </Link>
          <div className="flex items-center gap-2 mr-1">
            <Link href="/portal/settings" className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-100 bg-emerald-50 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-emerald-700">{userName?.[0]?.toUpperCase() ?? 'A'}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
