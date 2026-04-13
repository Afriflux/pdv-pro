'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut } from '@/app/auth/actions'
import { 
  Store, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  Share2, 
  Users, 
  Zap, 
  Gem, 
  Settings,
  LayoutTemplate,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  LogOut,
  Truck,
  GraduationCap,
  Blocks,
  Link as LinkIcon,
  Palette,
  Webhook,
  CreditCard
} from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { Logo } from '@/components/ui/Logo'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  for?: ('digital' | 'physical' | 'hybrid')[]
  badge?: string
  appId?: string
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
      { name: 'Pages de Vente', href: '/dashboard/pages', icon: LayoutTemplate },
      { name: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart },
      { name: 'Clients & CRM', href: '/dashboard/customers', icon: Users, badge: 'LTV' },
      { name: 'Livraisons', href: '/dashboard/livraisons', icon: Truck, for: ['physical', 'hybrid'], appId: 'livraisons' },
    ]
  },
  {
    title: 'FORMATION',
    items: [
      { name: 'Yayyam Académie', href: '/dashboard/tips', icon: GraduationCap, badge: 'Freemium', appId: 'academy' },
    ]
  },
  {
    title: 'FINANCES',
    items: [
      { name: 'Portefeuille', href: '/dashboard/wallet', icon: Wallet },
      { name: 'Commissions', href: '/dashboard/abonnements', icon: Gem },
    ]
  },
  {
    title: 'APPLICATIONS',
    items: [
      { name: 'App Store', href: '/dashboard/apps', icon: Blocks, badge: 'NEW' },
      { name: 'API & Webhooks', href: '/dashboard/webhooks', icon: Webhook, appId: 'webhooks' },
      { name: 'Devis & Factures', href: '/dashboard/apps/quotes', icon: ShoppingCart, appId: 'quotes' },
      { name: 'Liens de Paiement', href: '/dashboard/apps/payment-links', icon: CreditCard, appId: 'payment-links' },
      { name: 'Link-in-Bio', href: '/dashboard/links', icon: LinkIcon, appId: 'links' },
      { name: 'Marketing', href: '/dashboard/marketing', icon: Share2, appId: 'marketing' },
      { name: 'Workflows', href: '/dashboard/workflows', icon: Zap, appId: 'workflows' },
      { name: 'Agenda', href: '/dashboard/agenda', icon: Users, appId: 'agenda' },
      { name: 'Tasks', href: '/dashboard/tasks', icon: ShoppingCart, appId: 'tasks' },
      { name: 'Membres', href: '/dashboard/communautes', icon: Users, appId: 'communautes' },
      { name: 'Affiliés', href: '/dashboard/affilies', icon: Gem, appId: 'affilies' },
      { name: 'Promotions', href: '/dashboard/promotions', icon: Zap, appId: 'promotions' },
      { name: 'Closers', href: '/dashboard/closers', icon: Users, appId: 'closers' },
      { name: 'Telegram', href: '/dashboard/telegram', icon: Zap, appId: 'telegram' },
      { name: 'AI Generator', href: '/dashboard/ai-generator', icon: Palette, appId: 'ai-generator' },
      { name: 'Ambassadeurs', href: '/dashboard/ambassadeur', icon: Gem, appId: 'ambassadeur' },
    ]
  },
  {
    title: 'COMPTE',
    items: [
      { name: 'Paramètres',       href: '/dashboard/settings',    icon: Settings },
      { name: 'Espace Acheteur',  href: '#switch-to-buyer', icon: ArrowLeftRight },
    ]
  }
]

// ----------------------------------------------------------------
// Sous-composant NavLink
// ----------------------------------------------------------------
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
            ? 'bg-emerald-50 text-[#0F7A60] font-bold border border-emerald-100/50'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        {active && (!mounted || !collapsed) && (
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F7A60] rounded-l-xl shadow-[0_0_12px_rgba(15,122,96,0.3)]" />
        )}
        
        <Icon suppressHydrationWarning className={`${mounted && collapsed ? 'w-[20px] h-[20px]' : 'w-[18px] h-[18px]'} flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'group-hover/navitem:scale-110'}`} />
        {(!mounted || !collapsed) && <span className="text-[13px] truncate relative z-10">{item.name}</span>}
        {(!mounted || !collapsed) && item.badge && (
          <span className="ml-auto text-[9px] font-black bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 px-2 py-0.5 rounded-md shadow-sm relative z-10 uppercase tracking-wider">
            {item.badge}
          </span>
        )}
      </Link>
      
      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-[12px] font-bold rounded-xl opacity-0 invisible group-hover/navitem:opacity-100 group-hover/navitem:visible transition-all whitespace-nowrap z-50 shadow-md border border-gray-800">
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
      <div className="bg-[#1A1A1A] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <ArrowLeftRight size={32} />
        </div>
        <h3 className="text-xl font-black text-white text-center mb-2">Espace Acheteur</h3>
        <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">
          Voulez-vous basculer sur votre Espace Acheteur ? Vous pourrez revenir sur ce tableau de bord à tout moment depuis le menu Acheteur.
        </p>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm border border-white/10"
          >
            Annuler
          </button>
          <a
            href="/api/dashboard/switch-to-buyer"
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-bold rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20"
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
  vendorType,
  onClose,
  collapsed,
  setCollapsed,
  installedApps = []
}: {
  storeName: string
  userName: string
  avatarUrl?: string | null
  vendorType: 'digital' | 'physical' | 'hybrid'
  onClose?: () => void
  collapsed?: boolean
  setCollapsed?: (val: boolean) => void
  installedApps?: string[]
}) {
  const pathname = usePathname()

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'FINANCES': false,
    'FORMATION': false,
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

  return (
    <div className="flex flex-col h-full py-4 relative">
      {/* Header (Logo + Bell + Toggle) */}
      <div className={`px-4 mt-4 mb-8 flex ${collapsed ? 'flex-col items-center gap-4' : 'items-center justify-between'} flex-shrink-0`}>
        <Link href="/" className="flex items-center gap-1.5 focus:outline-none group/logo" onClick={onClose}>
          {collapsed ? (
            <div className="w-11 h-11 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center shadow-sm group-hover/logo:shadow-md transition-all">
              <Store className="w-6 h-6 text-emerald-400 stroke-[2.5]" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-1 py-1 rounded-xl group-hover/logo:bg-white/5 transition-colors">
              <Logo variant="text" textClassName="text-gray-900" />
            </div>
          )}
        </Link>
        
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <NotificationBell />
          {/* Toggle only in Desktop API via setCollapsed */}
          {setCollapsed && (
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
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
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-gray-600 transition-colors drop-shadow-sm">
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
                {section.items.filter(item => {
                  if (item.for && !item.for.includes(vendorType)) return false
                  if (item.appId && !installedApps.includes(item.appId)) return false
                  return true
                }).map(item => {
                  if (item.href === '/api/dashboard/switch-to-buyer') {
                    return (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                        onClick={() => {
                          if (onClose) {
                            onClose()
                          }
                          // We pass the special intercept logic down
                          // Actually, we can intercept the click right here instead of changing NavLink
                        }}
                        collapsed={collapsed}
                      />
                    )
                  }
                  return (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isActive(item.href)}
                      onClick={onClose}
                      collapsed={collapsed}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer / Profile */}
      <div className={`mt-auto ${collapsed ? 'px-2 pb-4 pt-2' : 'px-4 pb-6 pt-2'} flex-shrink-0 transition-all`}>
        <div className={`relative overflow-hidden ${collapsed ? 'bg-transparent flex flex-col items-center gap-3' : 'bg-gray-50 border border-gray-100 rounded-[1.5rem] p-3 shadow-sm hover:bg-gray-100/80 transition-colors duration-300'}`}>
          <div className={`flex items-center ${collapsed ? '' : 'gap-3 mb-3'}`}>
            <div className="relative w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-black text-gold/80">{userName[0]}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-gray-900 truncate leading-tight tracking-tight">{storeName}</p>
                <p className="text-[11px] text-gray-500 truncate uppercase tracking-wider font-semibold mt-0.5">{userName}</p>
              </div>
            )}
          </div>
          
          <form action={signOut} className={`w-full flex items-center`}>
            <button
              type="submit"
              className={`w-full flex items-center justify-center ${collapsed ? 'px-0 w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border-transparent' : 'px-4 py-2.5 rounded-xl gap-2 bg-red-500/10'} text-red-200 hover:bg-red-500 hover:text-white border border-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 text-[13px] font-bold group/logout relative`}
            >
              <LogOut className={`${collapsed ? 'w-5 h-5' : 'w-[16px] h-[16px]'}`} strokeWidth={collapsed ? 2 : 2.5} />
              {!collapsed && <span>Déconnexion</span>}
              
              {collapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
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

export function Sidebar({
  storeName,
  userName,
  avatarUrl,
  vendorType,
  installedApps = [],
}: {
  storeName: string
  userName: string
  avatarUrl?: string | null
  vendorType: 'digital' | 'physical' | 'hybrid'
  installedApps?: string[]
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // States exist outside rendering loop for persistence
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showSwitchModal, setShowSwitchModal] = useState(false)

  // Global click interceptor (fallback)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.getAttribute('href') === '#switch-to-buyer') {
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
      <SwitchToBuyerModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
      {/* ── DESKTOP : sidebar fixe gauche ── */}
      <aside 
        className={`hidden lg:flex flex-col flex-shrink-0 bg-white h-screen sticky top-0 z-30 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden border-r border-gray-200 ${
          collapsed && mounted ? 'w-[80px]' : 'w-[280px]'
        }`}
      >
        {/* Gradients Héroïques et Bruit pour simuler le Verre Premium */}
        
        

        <div className="relative z-10 flex flex-col h-full w-full">
          <SidebarContent 
            storeName={storeName} 
            userName={userName} 
            avatarUrl={avatarUrl}
            vendorType={vendorType}
            collapsed={collapsed && mounted}
            setCollapsed={setCollapsed}
            installedApps={installedApps}
          />
        </div>
      </aside>

      {/* ── MOBILE : top bar compacte (pas de hamburger, nav = BottomTabBar) ── */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-40 bg-white h-screen sticky top-0 z-30 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden border-r border-gray-200 flex items-center justify-between px-4 h-12">
          <Link href="/" className="flex items-center gap-1.5">
            <Logo variant="text" size="sm" textClassName="text-gray-900" />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>
      </div>
    </>
  )
}
