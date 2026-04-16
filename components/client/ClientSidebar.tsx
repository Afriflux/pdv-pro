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
  Package,
  Settings,
  BookOpen,
  Sparkles,
  Wallet,
  LucideIcon,
  GraduationCap,
  CalendarDays,
  Workflow,
  MapPin,
 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

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

const NAV: NavSection[] = [
  {
    title: 'MON ESPACE',
    items: [
      { name: 'Aperçu', href: '/client', icon: LayoutDashboard },
      { name: 'Assistant IA', href: '/client/assistant', icon: Sparkles, badge: 'IA' },
      { name: 'Mes Achats & Suivis', href: '/client/orders', icon: Package },
      { name: 'Ma Bibliothèque', href: '/client/library', icon: BookOpen, badge: 'NEW' },
      { name: 'Mes Réservations', href: '/client/agenda', icon: CalendarDays },
      { name: 'Mes Tâches', href: '/client/tasks', icon: Sparkles },
      { name: 'Mes Automatisations', href: '/client/workflows', icon: Workflow },
      { name: 'Catalogue Vendeurs', href: '/vendeurs', icon: Store },
    ]
  },
  {
    title: 'FORMATION',
    items: [
      { name: 'Académie', href: '/client/academy', icon: GraduationCap },
      { name: 'Ressources', href: '/client/resources', icon: Package },
    ]
  },
  {
    title: 'COMPTE',
    items: [
      { name: 'Mon Portefeuille', href: '/client/wallet', icon: Wallet },
      { name: 'Ambassadeurs', href: '/client/ambassadeur', icon: Sparkles, badge: 'NEW' },
      { name: 'Points & Récompenses', href: '/client/loyalty', icon: Sparkles },
      { name: 'Mes Adresses', href: '/client/addresses', icon: MapPin },
      { name: 'Paramètres', href: '/client/settings', icon: Settings },
    ]
  }
]

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

function SidebarContent({
  userName,
  avatarUrl,
  onClose,
  collapsed,
  setCollapsed
}: {
  userName: string
  avatarUrl?: string | null
  onClose?: () => void
  collapsed?: boolean
  setCollapsed?: (val: boolean) => void
}) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/client') return pathname === '/client'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full py-4 relative">
      <div className={`px-4 mt-4 mb-8 flex ${collapsed ? 'flex-col items-center gap-4' : 'items-center justify-between'} flex-shrink-0`}>
        <Link href="/" className="flex items-center gap-1.5 focus:outline-none group/logo" onClick={onClose}>
          {collapsed ? (
            <div className="w-11 h-11 bg-gradient-to-br from-white/20 to-white/5 border border-white/20 rounded-xl flex items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
              <Store className="w-6 h-6 text-emerald-400 stroke-[2.5]" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-1 py-1 rounded-xl hover:bg-white/5 transition-colors">
              <Logo variant="full" size="md" textClassName="text-gray-900" />
            </div>
          )}
        </Link>
        
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          
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

      <nav className={`flex-1 overflow-y-auto custom-scrollbar ${collapsed ? 'px-2' : 'px-3'} space-y-4`}>
        {(NAV || []).map(section => (
          <div key={section.title} className="flex flex-col">
            {!collapsed && (
              <div className="px-2 mt-4 mb-2">
                <span className="text-xs font-black text-emerald-100/40 uppercase tracking-[0.2em] drop-shadow-sm">
                  {section.title}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {(section?.items || []).map(item => (
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
        ))}

        {/* CTA Devenir Vendeur Premium Dark */}
        <div className={`mt-8 px-3 ${collapsed ? 'hidden' : 'block'}`}>
           <div className="p-5 bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-white/10 rounded-[1.5rem] relative overflow-hidden shadow-2xl shadow-black/20 group hover:-translate-y-1 transition-transform duration-500">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/20 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none group-hover:bg-[#C9A84C]/40 transition-colors duration-500"></div>
              
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity"><Store className="w-10 h-10 text-[#C9A84C]"/></div>
              <h4 className="font-black text-gray-900 text-sm mb-1 leading-tight relative z-10 tracking-tight">Passez de l'autre côté</h4>
              <p className="text-xs text-gray-400 mb-4 relative z-10 font-bold leading-relaxed">Devenez Vendeur ou Affilié et générez des revenus.</p>
              <Link href="/client/upgrade" prefetch={false} className="inline-block text-center w-full bg-white/10 hover:bg-white/20 text-[#C9A84C] border border-[#C9A84C]/30 hover:border-[#C9A84C] font-black py-2.5 rounded-xl text-xs transition-all duration-300 shadow-sm relative z-10">
                Débloquer des revenus
              </Link>
           </div>
        </div>
      </nav>

      <div className={`mt-auto ${collapsed ? 'px-2 pb-4 pt-2' : 'px-4 pb-6 pt-2'} flex-shrink-0 transition-all`}>
        <div className={`relative overflow-hidden ${collapsed ? 'bg-transparent flex flex-col items-center gap-3' : 'bg-gray-50 border border-gray-200 rounded-[1.5rem] p-3 shadow-lg hover:bg-white/10 transition-colors duration-300'}`}>
          <div className={`flex items-center ${collapsed ? '' : 'gap-3 mb-3'}`}>
            <div className="relative w-10 h-10 rounded-full border border-emerald-100 overflow-hidden bg-emerald-50 flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-black text-emerald-300">{userName[0]?.toUpperCase()}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-gray-900 truncate leading-tight tracking-tight">{userName}</p>
                <p className="text-xs text-gray-400 truncate uppercase tracking-wider font-semibold mt-0.5">Membre de la plateforme</p>
              </div>
            )}
          </div>
          
          <form action={signOut} className="w-full flex items-center">
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

export function ClientSidebar({
  userName,
  avatarUrl,
}: {
  userName: string
  avatarUrl?: string | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('client_sidebar_collapsed')
      if (saved) setCollapsed(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem('client_sidebar_collapsed', JSON.stringify(collapsed))
  }, [collapsed, mounted])

  const isEffectivelyCollapsed = collapsed && mounted && !hovered

  return (
    <>
      {/* ── DESKTOP : sidebar fixe gauche texturée Emerald ── */}
      <aside 
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`hidden lg:flex flex-col flex-shrink-0 bg-white h-screen sticky top-0 z-30 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
          isEffectivelyCollapsed ? 'w-[84px]' : 'w-[280px]'
        }`}
      >
        <div className="relative z-10 flex flex-col h-full w-full">
          <SidebarContent userName={userName} avatarUrl={avatarUrl} collapsed={isEffectivelyCollapsed} setCollapsed={setCollapsed} />
        </div>
      </aside>

      {/* ── MOBILE : top bar compacte ── */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-3 h-14">
          <Link href="/" className="flex items-center gap-2 focus:outline-none ml-1">
            <Logo variant="full" size="sm" textClassName="text-gray-900" />
          </Link>
          <div className="flex items-center gap-2 mr-1">
            <Link href="/client/settings" className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-100 bg-emerald-50 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-emerald-700">{userName?.[0]?.toUpperCase() ?? 'C'}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
