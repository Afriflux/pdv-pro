'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut } from '@/app/auth/actions'
import { Store,  
  LayoutDashboard,
  Zap,
  UsersRound,
  ShoppingBag,
  Settings,
  LogOut,
  ShieldCheck,
  Building2,
  Puzzle,
  AlertTriangle,
  PhoneCall,
  BookOpen,
  Globe,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History,
  LayoutTemplate,
  Smartphone,
  UserCircle,
  Megaphone,
  MessageSquare,
  Mail,
  Gift,
  BellRing
 } from 'lucide-react'
import { NotificationBell } from '../dashboard/NotificationBell' // On réutilise celle du dashboard

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
    title: 'PRINCIPAL',
    items: [
      { name: 'Vue d\'ensemble', href: '/admin', icon: LayoutDashboard },
      { name: 'Tous Utilisateurs', href: '/admin/users', icon: UsersRound, badge: 'NEW' },
      { name: 'Commandes', href: '/admin/orders', icon: ShoppingBag },
      { name: 'Closers (COD)', href: '/admin/closing', icon: PhoneCall },
    ]
  },
  {
    title: 'GOUVERNANCE & CONTRÔLE',
    items: [
      { name: 'Yayyam ERP', href: '/admin/erp', icon: Building2, badge: 'NATIV' },
      { name: 'Plaintes', href: '/admin/complaints', icon: AlertTriangle },
      { name: 'Vérifications KYC', href: '/admin/kyc', icon: ShieldCheck },
      { name: 'Rôles & Admins', href: '/admin/roles', icon: ShieldCheck },
      { name: 'Audit & Historique', href: '/admin/audit', icon: History },
    ]
  },
  {
    title: 'PLATEFORME & BUSINESS',
    items: [
      { name: 'Quotas Freemium', href: '/admin/quotas', icon: Zap },
      { name: 'Référencement & SEO', href: '/admin/branding', icon: Globe },
      { name: 'Marketing', href: '/admin/marketing', icon: Megaphone, badge: 'NEW' },
      { name: 'Emails & Campagnes', href: '/admin/email', icon: Mail },
      { name: 'Notifications', href: '/admin/notifications', icon: BellRing, badge: 'NEW' },
      { name: 'Chat WhatsApp', href: '/admin/whatsapp', icon: MessageSquare, badge: 'NEW' },
      { name: 'Fidélité & Récompenses', href: '/admin/loyalty', icon: Gift, badge: 'NEW' },
      { name: 'Support & Tickets', href: '/admin/tickets', icon: MessageSquare, badge: 'NEW' },
    ]
  },
  {
    title: 'MAINTENANCE & SÉCURITÉ',
    items: [
      { name: 'Actions & Crons', href: '/admin/maintenance', icon: Settings },
      { name: 'Sécurité globale', href: '/admin/security-hub', icon: ShieldCheck },
    ]
  },
  {
    title: 'OUTILS & STORE',
    items: [
      { name: 'App Store Manager', href: '/admin/apps', icon: Smartphone, badge: 'NEW' },
      { name: 'Créateur de Thèmes', href: '/admin/themes', icon: LayoutTemplate, badge: 'NEW' },
      { name: 'Créateur de Workflows', href: '/admin/workflows', icon: Zap, badge: 'NEW' },
      { name: 'Marketplace (Admin)', href: '/admin/marketplace', icon: Globe },
      { name: 'Intégrations', href: '/admin/integrations', icon: Puzzle },
      { name: 'Yayyam Académie', href: '/admin/masterclass', icon: BookOpen },
    ]
  },
  {
    title: 'COMPTE',
    items: [
      { name: 'Mon Profil', href: '/admin/settings', icon: UserCircle },
    ]
  }
]

function NavLink({ item, active, onClick, collapsed }: { item: NavItem, active: boolean, onClick?: () => void, collapsed?: boolean }) {
  const Icon = item.icon
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative group/navitem">
      <Link
        suppressHydrationWarning
        href={item.href}
        onClick={onClick}
        className={`flex items-center relative overflow-hidden ${mounted && collapsed ? 'justify-center px-0 w-11 h-11 mx-auto rounded-xl' : 'px-3 gap-3 py-2.5 rounded-xl'} transition-all duration-300 ${
          active
            ? 'bg-emerald-50 text-[#0F7A60] font-bold shadow-sm border border-emerald-100/50'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        {active && (!mounted || !collapsed) && (
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F7A60] rounded-l-xl shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
        )}
        
        <Icon suppressHydrationWarning className={`${mounted && collapsed ? 'w-[20px] h-[20px]' : 'w-[18px] h-[18px]'} flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'group-hover/navitem:scale-110'}`} />
        {(!mounted || !collapsed) && <span className="text-[13px] truncate relative z-10 font-medium">{item.name}</span>}
        {(!mounted || !collapsed) && item.badge && (
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

function AdminSidebarContent({
  adminName,
  adminEmail: _adminEmail,
  avatarUrl,
  adminRole,
  onClose,
  collapsed,
  setCollapsed
}: {
  adminName: string
  adminEmail: string
  avatarUrl?: string | null
  adminRole: string
  onClose?: () => void
  collapsed?: boolean
  setCollapsed?: (val: boolean) => void
}) {
  const pathname = usePathname()
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'GOUVERNANCE': false,
    'OUTILS': false,
    'COMPTE': false
  })
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_sections')
      if (saved) setCollapsedSections(JSON.parse(saved))
    } catch {}
  }, [])

  const toggleSection = (title: string) => {
    const newState = { ...collapsedSections, [title]: !collapsedSections[title] }
    setCollapsedSections(newState)
    localStorage.setItem('admin_sidebar_sections', JSON.stringify(newState))
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin' // exact match pour dashboard
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
            </div>
          )}
        </Link>
        
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <NotificationBell />
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
                  <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-gray-600 transition-colors drop-shadow-sm">
                    {section.title}
                  </span>
                  {isSectionCollapsed ? 
                    <ChevronDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" /> : 
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                  }
                </button>
              ) : (
                <div className="h-4" />
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
                <img src={avatarUrl} alt="Avatar Admin" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-black text-gold/80">{adminName[0]}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-gray-900 truncate leading-tight tracking-tight">{adminName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs px-1.5 py-0.5 font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                    {adminRole.replace('_', ' ')}
                  </span>
                </div>
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

export function AdminSidebar({
  adminName,
  adminEmail: _adminEmail,
  avatarUrl,
  adminRole,
}: {
  adminName: string
  adminEmail: string
  avatarUrl?: string | null
  adminRole: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed')
      if (saved) setCollapsed(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('admin_sidebar_collapsed', JSON.stringify(collapsed))
    }
  }, [collapsed, mounted])

  return (
    <>
      {/* ── DESKTOP ── */}
      <aside 
        className={`hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-gray-200 shadow-xl relative overflow-hidden h-screen sticky top-0 z-30 ${
          collapsed && mounted ? 'w-[80px]' : 'w-[280px]'
        }`}
      >
        {/* Desktop Noise */}
        
        
        

        <div className="relative z-10 flex flex-col h-full w-full">
          <AdminSidebarContent 
            adminName={adminName}
            adminEmail={_adminEmail}
            avatarUrl={avatarUrl}
            adminRole={adminRole}
            collapsed={collapsed && mounted}
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
            <Link href="/admin/settings" className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-100 bg-emerald-50 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-emerald-700">{adminName?.[0]?.toUpperCase() ?? 'A'}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
