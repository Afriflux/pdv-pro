/* eslint-disable react/forbid-dom-props, jsx-a11y/control-has-associated-label, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, jsx-a11y/anchor-is-valid */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Package, ShoppingBag, ArrowRight, Eye, TrendingUp, Sparkles, Loader2 } from 'lucide-react'
import { Check360Widget } from '@/components/dashboard/Check360Widget'
import WelcomeGuide from '@/components/dashboard/WelcomeGuide'
import { GettingStartedChecklist } from '@/components/dashboard/GettingStartedChecklist'
import { DailyDigestWidget } from '@/components/dashboard/DailyDigestWidget'
import { prisma } from '@/lib/prisma'
import { CopyLinkQuickAction, WhatsAppQuickAction } from './DashboardActions'

const ChartLazyWrapper = dynamic(() => import('./ChartLazyWrapper'), { ssr: false, loading: () => <ChartSkeleton /> })

// ── TYPES & HELPERS ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  confirmed: 'Confirmée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  completed: 'Terminée',
  cod_pending: 'COD en attente',
  cod_confirmed: 'COD confirmée',
  no_answer: 'Pas de réponse',
}

function KPISkeleton() {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 animate-pulse mt-8"><div className="h-32 bg-gray-100 rounded-2xl"></div><div className="h-32 bg-gray-100 rounded-2xl"></div><div className="h-32 bg-gray-100 rounded-2xl"></div><div className="h-32 bg-gray-100 rounded-2xl"></div></div>
}

function ChartSkeleton() {
  return <div className="w-full h-[250px] bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" /></div>
}

function OrdersSkeleton() {
  return <div className="w-full h-64 bg-gray-100 rounded-2xl animate-pulse mt-8"></div>
}

function ChecklistSkeleton() {
  return <div className="w-full h-24 bg-gray-100 rounded-2xl animate-pulse"></div>
}

// ── ASYNC COMPONENTS ─────────────────────────────────────────────────────────

async function DashboardKPIs({ storeId, storeRaw }: { storeId: string, storeRaw: any }) {
  const supabase = await createClient()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { data: ordersTodayData },
    { data: walletData },
    { data: pendingData },
    { count: productCount }
  ] = await Promise.all([
    supabase.from('Order').select('id, vendor_amount, status').eq('store_id', storeId).gte('created_at', today.toISOString()).in('status', ['paid','completed','delivered','confirmed','preparing','shipped']),
    supabase.from('Wallet').select('balance, pending, total_earned').eq('vendor_id', storeId).single(),
    supabase.from('Order').select('id').eq('store_id', storeId).in('status', ['pending','processing','preparing', 'cod_pending']),
    supabase.from('Product').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('active', true),
  ])

  const ordersToday = ordersTodayData || []
  const caToday     = ordersToday.reduce((sum, o) => sum + (o.vendor_amount || 0), 0)
  const countToday  = ordersToday.length
  const pendingCount = pendingData?.length || 0
  const wallet       = walletData || { balance: 0, pending: 0, total_earned: 0 }

  return (
    <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 relative z-10 my-4">
        {/* KPI 1 : CA */}
        <div className="bg-white shadow-sm border border-gray-100 hover:border-gray-200 transition-all duration-300 rounded-2xl p-3 lg:p-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">CA Aujourd'hui</p>
          <p className="text-xl lg:text-2xl font-black text-gray-900 truncate">
            {caToday.toLocaleString('fr-FR')} <span className="text-sm text-gray-400">F</span>
          </p>
        </div>
        
        {/* KPI 2 : Ventes */}
        <div className="bg-white shadow-sm border border-gray-100 hover:border-gray-200 transition-all duration-300 rounded-2xl p-3 lg:p-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Ventes Aujourd'hui</p>
          <p className="text-xl lg:text-2xl font-black text-gray-900">{countToday}</p>
        </div>

        {/* KPI 3 : Attente */}
        <div className="bg-white shadow-sm border border-gray-100 hover:border-gray-200 transition-all duration-300 rounded-2xl p-3 lg:p-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">En attente</p>
          <p className="text-xl lg:text-2xl font-black text-gray-900">{pendingCount} <span className="text-sm font-bold text-gray-400 ml-1">à traiter</span></p>
        </div>

        {/* KPI 4 : Wallet */}
        <div className="bg-white shadow-sm border border-gray-100 hover:border-gray-200 transition-all duration-300 rounded-2xl p-3 lg:p-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Wallet Dispo</p>
          <p className="text-xl lg:text-2xl font-black text-gray-900 flex items-center gap-1">
            {wallet.balance.toLocaleString('fr-FR')} <span className="text-sm font-bold text-gray-400 mt-2">F</span>
          </p>
        </div>
      </section>

      {/* CHECK360 */}
      <section className="mb-8">
        <Check360Widget
          storeName={storeRaw.name}
          caToday={caToday}
          countToday={countToday}
          pendingCount={pendingCount}
          walletBalance={wallet.balance}
          productCount={productCount ?? 0}
          caWeek={0} // Fake until we fetch it, or remove it from here
          level="Bronze" // Quick fake logic since we don't block Dashboard
        />
      </section>
    </>
  )
}

async function DashboardChartServer({ storeId, storeSlug }: { storeId: string, storeSlug: string }) {
  const supabase = await createClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: weekData } = await supabase.from('Order').select('vendor_amount, status, created_at').eq('store_id', storeId).gte('created_at', sevenDaysAgo.toISOString()).in('status', ['paid','completed','delivered','confirmed','preparing','shipped'])

  const weekOrders = weekData || []
  const chartDataMap = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    chartDataMap.set(dateStr, 0)
  }

  weekOrders.forEach(o => {
    const d = new Date(o.created_at)
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    if (chartDataMap.has(dateStr)) {
      chartDataMap.set(dateStr, chartDataMap.get(dateStr)! + (o.vendor_amount || 0))
    }
  })

  const chartData = Array.from(chartDataMap.entries()).map(([date, total]) => ({ date, total }))

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 mb-8">
      {/* Graphique */}
      <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col group">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="font-black text-gray-900 text-lg">Revenus (7 derniers jours)</h2>
            <p className="text-xs text-gray-500 mt-1">Évolution de votre chiffre d'affaires</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <TrendingUp size={18} className="text-[#0F7A60]" />
          </div>
        </div>
        <div className="flex-1 min-h-[250px] -ml-4">
           <ChartLazyWrapper data={chartData} />
        </div>
      </div>

      {/* Actions Rapides */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <a href={`/${storeSlug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 text-gray-900 rounded-2xl text-sm font-black hover:border-gray-200 transition-all shadow-sm w-full">
          <Eye size={18} className="text-[#0F7A60]" />
          Aperçu de ma boutique
        </a>
        <div className="grid grid-cols-2 gap-4 flex-1">
          <Link href="/dashboard/products/new" className="bg-[#0F7A60] hover:bg-[#0B5C48] text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all shadow-sm">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-light leading-none">+</span>
            </div>
            <span className="text-xs font-black tracking-wide text-center">Nouveau produit</span>
          </Link>

          <Link href="/dashboard/orders" className="bg-white border border-gray-100 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-gray-200 transition-all shadow-sm text-gray-900">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-[#0F7A60]">
               <Package size={22} />
            </div>
            <span className="text-xs font-black tracking-wide text-center">Mes commandes</span>
          </Link>
          <CopyLinkQuickAction slug={storeSlug} />
          <WhatsAppQuickAction slug={storeSlug} />
        </div>
      </div>
    </section>
  )
}

async function RecentOrdersServer({ storeId }: { storeId: string }) {
  const supabase = await createClient()
  const { data: lastOrdersData } = await supabase.from('Order').select('id, vendor_amount, status, created_at, product_id, product_name:Product(name)').eq('store_id', storeId).order('created_at', { ascending: false }).limit(5)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col mb-8">
      <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-black text-gray-900 text-lg">Dernières commandes</h2>
        <Link href="/dashboard/orders" className="text-xs font-black text-[#0F7A60] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
          Voir tout <ArrowRight size={14}/>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col p-2">
        {lastOrdersData && lastOrdersData.length > 0 ? (
          <div className="space-y-1">
            {lastOrdersData.map(order => {
              const pNameRow = Array.isArray(order.product_name) ? order.product_name[0] : order.product_name
              const productName = (pNameRow as { name?: string } | null)?.name ?? 'Produit inconnu'
              
              return (
                <div key={order.id} className="px-4 py-3.5 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                     <div className="min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <p className="text-xs font-mono font-bold text-gray-400">#{order.id.split('-')[0].toUpperCase()}</p>
                         <span className="text-xs font-black uppercase text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                           {STATUS_LABELS[order.status] || order.status}
                         </span>
                       </div>
                       <p className="text-sm font-bold text-gray-900 truncate">{productName}</p>
                     </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-4">
                    <p className="text-[15px] font-black text-gray-900">{(order.vendor_amount || 0).toLocaleString('fr-FR')} F</p>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center"><p className="text-sm font-bold text-gray-400">Aucune commande</p></div>
        )}
      </div>
    </div>
  )
}

async function ChecklistServer({ storeId }: { storeId: string }) {
  const supabase = await createClient()
  const [
    { count: productCount },
    { count: zoneCount },
    { count: promoCount },
    { count: delivererCount },
    { count: walletSettingCount },
    { data: storeRaw }
  ] = await Promise.all([
    supabase.from('Product').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('active', true),
    supabase.from('DeliveryZone').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('Promotion').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('Deliverer').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('WalletSetting').select('id', { count: 'exact', head: true }).eq('vendor_id', storeId),
    supabase.from('Store').select('meta_pixel_id, tiktok_pixel_id, logo_url').eq('id', storeId).single()
  ])

  const safeProductCount = productCount ?? 0
  const safeZoneCount = zoneCount ?? 0
  const safePromoCount = promoCount ?? 0
  const safeDelivererCount = delivererCount ?? 0
  const safeWalletSettingCount = walletSettingCount ?? 0
  const hasSettingsChecked = !!storeRaw?.meta_pixel_id || !!storeRaw?.tiktok_pixel_id || !!storeRaw?.logo_url

  const isNewVendor = safeProductCount === 0 || safeZoneCount === 0 || safePromoCount === 0 || safeDelivererCount === 0 || safeWalletSettingCount === 0 || !hasSettingsChecked

  if (!isNewVendor) return null

  return (
    <div className="mb-8">
      <GettingStartedChecklist 
        hasProducts={safeProductCount > 0} 
        hasZones={safeZoneCount > 0}
        hasPromotions={safePromoCount > 0}
        hasDeliveries={safeDelivererCount > 0}
        hasWallet={safeWalletSettingCount > 0}
        hasSettings={hasSettingsChecked}
      />
    </div>
  )
}

// ── MAIN SERVER COMPONENT ──────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // --- 1. Récupération Store ---
  let { data: storeRaw } = await supabase
    .from('Store')
    .select('id, name, slug, logo_url, contract_accepted, meta_pixel_id, tiktok_pixel_id')
    .eq('user_id', user.id)
    .single()

  if (!storeRaw) {
    const supabaseAdmin = createAdminClient()
    const { data: existingUser } = await supabaseAdmin.from('User').select('id').eq('id', user.id).single()
    if (!existingUser) {
      await supabaseAdmin.from('User').insert({
        id: user.id, role: 'vendeur', name: user.user_metadata?.name || user.email?.split('@')[0] || 'Vendeur', email: user.email, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      })
    }
    const newStoreId = randomUUID()
    const name = user.user_metadata?.name || 'Ma Boutique'
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 25)
    const newSlug = `${baseSlug}-${randomUUID().slice(0, 4)}`

    const { data: insertedStore } = await supabaseAdmin.from('Store').insert({
      id: newStoreId, user_id: user.id, name: name, slug: newSlug, onboarding_completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).select().single()

    if (insertedStore) {
      const realStoreId = insertedStore.id;
      await supabaseAdmin.from('Wallet').insert({ id: randomUUID(), vendor_id: realStoreId, balance: 0, pending: 0, total_earned: 0 })
      storeRaw = { id: realStoreId, name: insertedStore.name, slug: insertedStore.slug, logo_url: insertedStore.logo_url, contract_accepted: insertedStore.contract_accepted, meta_pixel_id: null, tiktok_pixel_id: null }
    } else {
      storeRaw = { id: newStoreId, name: name, slug: newSlug, logo_url: null, contract_accepted: false, meta_pixel_id: null, tiktok_pixel_id: null }
    }
  }

  const userName = user.user_metadata?.name?.split(' ')[0] || 'Vendeur'
  const dateFormatted = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)

  return (
    <div className="w-full font-sans relative">
      <WelcomeGuide />
      
      {/* HEADER */}
      <header className="bg-white border border-gray-100 rounded-3xl px-4 lg:px-10 py-4 lg:py-5 relative z-10 mb-4 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">Bonjour, {userName} ! 👋</h1>
            <p className="text-[10px] lg:text-xs font-medium text-gray-500 mt-1">{capitalizedDate}</p>
          </div>
          {!storeRaw.contract_accepted && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-bold">Vos ventes sont désactivées</p>
                <Link href="/dashboard/settings#contrat" className="text-xs font-bold underline">Signer le contrat →</Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="w-full p-2 lg:p-0">
        <Suspense fallback={<ChecklistSkeleton />}><ChecklistServer storeId={storeRaw.id} /></Suspense>
        <Suspense fallback={<KPISkeleton />}><DashboardKPIs storeId={storeRaw.id} storeRaw={storeRaw} /></Suspense>
        <Suspense fallback={<ChartSkeleton />}><DashboardChartServer storeId={storeRaw.id} storeSlug={storeRaw.slug} /></Suspense>
        <Suspense fallback={<OrdersSkeleton />}><RecentOrdersServer storeId={storeRaw.id} /></Suspense>
      </div>
    </div>
  )
}
