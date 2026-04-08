/* eslint-disable react/forbid-dom-props, jsx-a11y/control-has-associated-label, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, jsx-a11y/anchor-is-valid */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import ChartLazyWrapper from './ChartLazyWrapper'
import { CopyLinkQuickAction, WhatsAppQuickAction } from './DashboardActions'
import { Package, ShoppingBag, ArrowRight, Eye, TrendingUp, Sparkles } from 'lucide-react'
import { Check360Widget } from '@/components/dashboard/Check360Widget'
import WelcomeGuide from '@/components/dashboard/WelcomeGuide'
import { GettingStartedChecklist } from '@/components/dashboard/GettingStartedChecklist'
import { DailyDigestWidget } from '@/components/dashboard/DailyDigestWidget'
import { prisma } from '@/lib/prisma'

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

// ── SERVER COMPONENT ─────────────────────────────────────────────────────────

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
    // ---- Auto-création pour les anciens comptes sans Store ----
    const supabaseAdmin = createAdminClient()
    
    // 0. S'assurer que l'utilisateur existe dans public.User
    const { data: existingUser } = await supabaseAdmin.from('User').select('id').eq('id', user.id).single()
    if (!existingUser) {
      await supabaseAdmin.from('User').insert({
        id: user.id,
        role: 'vendeur',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Vendeur',
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    const newStoreId = randomUUID()
    const name = user.user_metadata?.name || 'Ma Boutique'
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 25)
    const newSlug = `${baseSlug}-${randomUUID().slice(0, 4)}`

    const { data: insertedStore, error: storeError } = await supabaseAdmin.from('Store').insert({
      id: newStoreId,
      user_id: user.id,
      name: name,
      slug: newSlug,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single()

    if (storeError || !insertedStore) {
      console.error('Store auto-create error:', storeError)
    } else {
      const realStoreId = insertedStore.id;
      const { error: walletError } = await supabaseAdmin.from('Wallet').insert({
        id: randomUUID(),
        vendor_id: realStoreId,
        balance: 0,
        pending: 0,
        total_earned: 0,
        updated_at: new Date().toISOString(),
      })

      if (walletError && walletError.code !== '23505') {
        console.error('Wallet insert auto-create error:', walletError)
      }
      
      storeRaw = {
        id: realStoreId,
        name: insertedStore.name,
        slug: insertedStore.slug,
        logo_url: insertedStore.logo_url,
        contract_accepted: insertedStore.contract_accepted,
        meta_pixel_id: null,
        tiktok_pixel_id: null
      }
    }

    if (!storeRaw || storeRaw.id === newStoreId) {
      storeRaw = {
        id: newStoreId,
        name: name,
        slug: newSlug,
        logo_url: null,
        contract_accepted: false,
        meta_pixel_id: null,
        tiktok_pixel_id: null
      }
    }
  }

  const storeId   = storeRaw.id
  const storeSlug = storeRaw.slug

  // --- Dates pour les requêtes ---
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  // --- 2. Requêtes parallèles ---
  const [
    { data: ordersTodayData },
    { data: walletData },
    { data: pendingData },
    { data: weekData },
    { data: lastOrdersData },
    { data: userData },
    { count: productCount },
    { count: zoneCount },
    { count: promoCount },
    { count: delivererCount },
    { count: walletSettingCount }
  ] = await Promise.all([
    // CA + ventes aujourd'hui
    supabase.from('Order')
      .select('id, vendor_amount, status, created_at')
      .eq('store_id', storeId)
      .gte('created_at', today.toISOString())
      .in('status', ['paid','completed','delivered','confirmed','preparing','shipped']),

    // Wallet
    supabase.from('Wallet')
      .select('balance, pending, total_earned')
      .eq('vendor_id', storeId).single(),

    // Commandes en attente
    supabase.from('Order')
      .select('id, status')
      .eq('store_id', storeId)
      .in('status', ['pending','processing','preparing', 'cod_pending']),

    // 7 derniers jours (pour le graph)
    supabase.from('Order')
      .select('vendor_amount, status, created_at')
      .eq('store_id', storeId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .in('status', ['paid','completed','delivered','confirmed','preparing','shipped']),

    // 5 dernières commandes (toutes périodes)
    supabase.from('Order')
      .select('id, vendor_amount, status, created_at, product_id, product_name:Product(name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(5),

    // Nom du vendeur
    supabase.from('User')
      .select('name')
      .eq('id', user.id).single(),
      
    // Count produits pour le conseil IA
    supabase.from('Product')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('active', true),
      
    // Count zones
    supabase.from('DeliveryZone')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId),
      
    // Count promotions
    supabase.from('Promotion')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId),
      
    // Count livreurs
    supabase.from('Deliverer')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId),
      
    // Count WalletSetting (pour savoir si retrait configuré)
    supabase.from('WalletSetting')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', storeId)
  ])

  // --- App Store : Check installed apps ---
  const isCoachIaInstalled = await prisma.installedApp.findFirst({
    where: { store_id: storeId, app_id: 'coach-ia', status: 'active' }
  })

  // --- Calculs KPIs ---
  const ordersToday = ordersTodayData || []
  const caToday     = ordersToday.reduce((sum, o) => sum + (o.vendor_amount || 0), 0)
  const countToday  = ordersToday.length
  
  const pendingCount = pendingData?.length || 0
  const wallet       = walletData || { balance: 0, pending: 0, total_earned: 0 }
  const totalEarned  = wallet.total_earned || 0

  // --- Calculs Graphique 7 jours ---
  const weekOrders = weekData || []
  // Initialiser les 7 derniers jours à 0
  const chartDataMap = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    // format DD/MM
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    chartDataMap.set(dateStr, 0)
  }

  // Remplir avec les données réelles
  weekOrders.forEach(o => {
    const d = new Date(o.created_at)
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    if (chartDataMap.has(dateStr)) {
      chartDataMap.set(dateStr, chartDataMap.get(dateStr)! + (o.vendor_amount || 0))
    }
  })

  const chartData = Array.from(chartDataMap.entries()).map(([date, total]) => ({ date, total }))

  const caWeek = weekOrders.reduce((sum, o) => sum + (o.vendor_amount || 0), 0)

  // --- Section 1: Salutation ---
  const userName = userData?.name?.split(' ')[0] || 'Vendeur'
  const now = new Date()
  const hour = now.getUTCHours() // GMT+0 pour Afrique de l'Ouest (Dakar, Abidjan, Bamako)
  const greeting = hour < 12 ? 'Bon matin' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  
  // Formatage date "Lundi 17 mars 2026"
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const dateFormatted = new Date().toLocaleDateString('fr-FR', dateOptions)
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)

  // --- Section 5: Niveau Vendeur ---
  let level = 'Bronze'
  let emoji = '🥉'
  let nextLevelThreshold = 500000
  let nextLevelName = 'Silver'

  if (totalEarned >= 10000000) {
    level = 'Platinum'
    emoji = '💎'
    nextLevelThreshold = totalEarned // Max level
    nextLevelName = 'Max'
  } else if (totalEarned >= 2000000) {
    level = 'Gold'
    emoji = '🥇'
    nextLevelThreshold = 10000000
    nextLevelName = 'Platinum'
  } else if (totalEarned >= 500000) {
    level = 'Silver'
    emoji = '🥈'
    nextLevelThreshold = 2000000
    nextLevelName = 'Gold'
  }
  
  const progressPercent = level === 'Platinum' ? 100 : Math.min(100, (totalEarned / nextLevelThreshold) * 100)
  const missingForNext = nextLevelThreshold - totalEarned

  const safeProductCount = productCount ?? 0
  const safeZoneCount = zoneCount ?? 0
  const safePromoCount = promoCount ?? 0
  const safeDelivererCount = delivererCount ?? 0
  const safeWalletSettingCount = walletSettingCount ?? 0
  
  const hasSettingsChecked = !!storeRaw.meta_pixel_id || !!storeRaw.tiktok_pixel_id || !!storeRaw.logo_url

  // --- Check si le vendeur est nouveau (a configuré tous les éléments essentiels) ---
  const isNewVendor = safeProductCount === 0 || safeZoneCount === 0 || safePromoCount === 0 || safeDelivererCount === 0 || safeWalletSettingCount === 0 || !hasSettingsChecked

  return (
    <main className="min-h-screen bg-[#FAFAF7] font-sans pb-20 relative">
      {/* Ambient BG Glows */}
      <div className="absolute top-0 left-10 w-[600px] h-[600px] bg-[#0F7A60]/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-0 w-[500px] h-[500px] bg-[#C9A84C]/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <WelcomeGuide />
      
      {/* ── SECTION 1 : HEADER ───────────────────────────────────────────── */}
      <header className="bg-white/70 backdrop-blur-2xl border-b border-gray-100 px-6 lg:px-10 py-8 relative z-10">
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
              Bonjour, {userName} ! 👋
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-2">
              {capitalizedDate} · {greeting}
            </p>
          </div>
          
          {/* Alerte Contrat */}
          {!storeRaw.contract_accepted && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm mt-4 md:mt-0">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-bold">Vos ventes sont désactivées</p>
                <Link href="/dashboard/settings#contrat" className="text-xs font-bold underline hover:text-amber-900 transition-colors">
                  Signer le contrat →
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="w-full p-6 lg:p-10 space-y-8">

        {/* ── GAMIFICATION BANNER (BOUCLE DE CROISSANCE) ───────────────────────── */}
        <div className="w-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-orange-500/20 text-white overflow-hidden relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
           <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-amber-300/30 blur-2xl rounded-full translate-y-1/3 pointer-events-none"></div>
           <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-3xl shrink-0">
                🎯
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-1">Défi du jour : Gagnez 500 FCFA !</h3>
                <p className="font-medium text-white/90">Réalisez <strong className="text-white">5 ventes aujourd'hui</strong> pour débloquer votre prime, qui sera créditée directement sur votre Wallet Yayyam.</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-black/10 rounded-full overflow-hidden max-w-[200px] border border-white/10 shadow-inner">
                    <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, (countToday / 5) * 100)}%` }}></div>
                  </div>
                  <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-md">{countToday} / 5</span>
                </div>
              </div>
           </div>
           <Link href="/dashboard/apps" className="relative z-10 mt-6 md:mt-0 bg-white text-orange-600 px-6 py-3.5 rounded-2xl font-bold hover:bg-orange-50 hover:scale-[1.02] transition-all shadow-lg shrink-0 flex flex-col items-center leading-tight">
             <span>Voir la boutique</span>
             <span className="text-[10px] font-medium text-orange-400">Pour échanger vos primes</span>
           </Link>
        </div>

        {isNewVendor && (
          <GettingStartedChecklist 
            hasProducts={safeProductCount > 0} 
            hasZones={safeZoneCount > 0}
            hasPromotions={safePromoCount > 0}
            hasDeliveries={safeDelivererCount > 0}
            hasWallet={safeWalletSettingCount > 0}
            hasSettings={hasSettingsChecked}
          />
        )}

        {/* ── SECTION 2 : 4 KPI CARDS (Métriques Cash style Apple Stocks) ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative z-10">
          <div className="bg-white/80 backdrop-blur-xl border border-white hover:border-[#0F7A60]/30 hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500 rounded-[32px] p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F7A60]/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 relative z-10 flex items-center justify-between">
              <span>CA Aujourd&apos;hui</span>
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] truncate relative z-10 tracking-tighter group-hover:text-[#0F7A60] transition-colors duration-500">
              {caToday.toLocaleString('fr-FR')} <span className="text-sm text-gray-400 font-bold ml-1">F</span>
            </p>
            {/* Fake Sparkline (Area Chart) */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-20 group-hover:opacity-40 group-hover:text-[#0F7A60] transition-all duration-500 pointer-events-none">
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full text-gray-400 group-hover:text-[#0F7A60]">
                <path d="M0,50 L0,30 C20,40 40,10 60,20 C80,30 90,5 100,10 L100,50 Z" fill="currentColor" />
                <path d="M0,30 C20,40 40,10 60,20 C80,30 90,5 100,10" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl border border-white hover:border-[#1A1A1A]/20 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 rounded-[32px] p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 relative z-10">
              Ventes Aujourd&apos;hui
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] relative z-10 tracking-tighter">
              {countToday}
            </p>
            {/* Fake Sparkline (Area Chart) */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-20 group-hover:opacity-30 transition-all duration-500 pointer-events-none">
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full text-gray-400 group-hover:text-gray-600">
                <path d="M0,50 L0,40 C20,45 40,25 60,35 C80,45 90,20 100,25 L100,50 Z" fill="currentColor" />
                <path d="M0,40 C20,45 40,25 60,35 C80,45 90,20 100,25" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 rounded-[32px] p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 relative z-10">
              Taux Conversion (Est.)
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] relative z-10 tracking-tighter group-hover:text-blue-600 transition-colors duration-500">
              {countToday > 0 ? ((countToday / (countToday * 3)) * 100).toFixed(1) : '0'} <span className="text-sm font-bold opacity-40 ml-1 group-hover:opacity-100">%</span>
            </p>
            {/* Fake Sparkline (Area Chart) */}
             <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-[0.05] group-hover:opacity-[0.15] transition-all duration-500 pointer-events-none">
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full text-[#1A1A1A] group-hover:text-blue-600">
                <path d="M0,50 L0,20 C30,30 50,5 70,15 C85,25 95,10 100,5 L100,50 Z" fill="currentColor" />
                <path d="M0,20 C30,30 50,5 70,15 C85,25 95,10 100,5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-white/10 rounded-[32px] p-6 shadow-2xl shadow-black/20 relative overflow-hidden group text-white hover:shadow-[#C9A84C]/20 hover:-translate-y-1 transition-all duration-500">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/20 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <p className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C] opacity-90 mb-2 relative z-10">
              Wallet (Dispo)
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-white truncate relative z-10 tracking-tighter flex items-center gap-1 group-hover:text-amber-50 transition-colors duration-500">
              {wallet.balance.toLocaleString('fr-FR')} <span className="text-sm font-bold opacity-60 mt-2">F</span>
            </p>
            {/* Fake Sparkline (Area Chart) */}
            <div className="absolute bottom-0 left-0 w-full h-3/4 opacity-10 group-hover:opacity-30 transition-all duration-500 pointer-events-none">
               <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full text-[#C9A84C]">
                <path d="M0,50 L0,45 C20,40 40,50 60,30 C80,10 90,20 100,5 L100,50 Z" fill="currentColor" />
                <path d="M0,45 C20,40 40,50 60,30 C80,10 90,20 100,5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </section>

        {/* ── CHECK360° — ANALYSE IA ───────────────────────────────────────── */}
        <section>
          <Check360Widget
            storeName={storeRaw.name}
            caToday={caToday}
            countToday={countToday}
            pendingCount={pendingCount}
            walletBalance={wallet.balance}
            productCount={safeProductCount}
            caWeek={caWeek}
            level={level}
          />
        </section>

        {/* ── COACH IA QUOTIDIEN (Daily Digest) ─────────────────────────── */}
        {isCoachIaInstalled && <DailyDigestWidget storeId={storeId} />}

        {/* ── SECTION 3 : GRAPHIQUE 7J + ACTIONS RAPIDES ───────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          {/* Graphique (7 cols) */}
          <div className="lg:col-span-7 bg-white/60 backdrop-blur-2xl border border-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 flex flex-col group hover:shadow-2xl hover:shadow-gray-200/80 transition-all duration-500">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="font-black text-[#1A1A1A] text-lg">Revenus (7 derniers jours)</h2>
                <p className="text-xs text-gray-500 mt-1">Évolution panoramique de votre chiffre d&apos;affaires</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#0F7A60]/10 transition-colors duration-500 text-gray-400 group-hover:text-[#0F7A60]">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="flex-1 min-h-[250px] -ml-4">
               <ChartLazyWrapper data={chartData} />
            </div>
          </div>

          {/* Actions Rapides (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Bouton Aperçu mis en évidence */}
            {storeSlug && (
              <a
                href={`/${storeSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white/60 backdrop-blur-xl border border-white text-gray-700 rounded-2xl text-sm font-black hover:border-[#0F7A60]/30 hover:bg-[#0F7A60]/5 hover:text-[#0F7A60] hover:shadow-lg hover:shadow-[#0F7A60]/10 transition-all duration-300 group shadow-sm w-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Eye size={18} className="group-hover:text-[#0F7A60] transition-colors" />
                Aperçu de ma boutique
              </a>
            )}

            <div className="grid grid-cols-2 gap-4 flex-1">
              <Link href="/dashboard/products/new" className="bg-gradient-to-br from-[#0F7A60] to-[#0B5C48] hover:to-[#094A3A] text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-[#0F7A60]/20 hover:shadow-xl hover:shadow-[#0F7A60]/40 hover:-translate-y-1 group relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-500 shadow-inner">
                  <span className="text-2xl font-light leading-none">+</span>
                </div>
                <span className="text-xs font-black tracking-wide text-center">Nouveau produit</span>
              </Link>

              <Link href="/dashboard/orders" className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#0F7A60]/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[#0F7A60]/10 hover:-translate-y-1 group text-[#1A1A1A]">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0F7A60]/10 group-hover:text-[#0F7A60] transition-all duration-500">
                   <Package size={22} className="text-gray-400 group-hover:text-[#0F7A60] transition-colors" />
                </div>
                <span className="text-xs font-black tracking-wide text-center group-hover:text-[#0F7A60] transition-colors">Mes commandes</span>
              </Link>

              <CopyLinkQuickAction slug={storeSlug} />
              <WhatsAppQuickAction slug={storeSlug} />
            </div>
          </div>

        </section>

        {/* ── SECTION 4 & 5 : DERN. COMMANDES + NIVEAU VENDEUR ─────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          {/* 5 Dernières Commandes (7 cols) */}
          <div className="lg:col-span-7 bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col">
            <div className="px-6 py-6 border-b border-gray-100/50 flex items-center justify-between bg-white/50">
              <h2 className="font-black text-[#1A1A1A] text-lg">Dernières commandes</h2>
              <Link href="/dashboard/orders" className="text-xs font-black text-[#0F7A60] hover:text-[#0B5C48] bg-[#0F7A60]/5 hover:bg-[#0F7A60]/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                Voir tout <ArrowRight size={14}/>
              </Link>
            </div>
            
            <div className="flex-1 flex flex-col p-2">
              {lastOrdersData && lastOrdersData.length > 0 ? (
                <div className="space-y-1">
                  {lastOrdersData.map(order => {
                    const pNameRow = Array.isArray(order.product_name)
                      ? order.product_name[0]
                      : order.product_name
                    const productName = (pNameRow as { name?: string } | null)?.name ?? 'Produit inconnu'
                    
                    return (
                      <div key={order.id} className="px-4 py-3.5 rounded-2xl flex items-center justify-between hover:bg-gray-50/80 transition-all duration-300 group cursor-default">
                        <div className="flex items-center gap-4 min-w-0">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                             ['completed', 'delivered'].includes(order.status) ? 'bg-[#0F7A60]/10 text-[#0F7A60]' :
                             ['cancelled'].includes(order.status) ? 'bg-red-500/10 text-red-500' :
                             'bg-amber-500/10 text-amber-500'
                           }`}>
                             <ShoppingBag size={18} />
                           </div>
                           <div className="min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                               <p className="text-[11px] font-mono font-bold text-gray-400">#{order.id.split('-')[0].toUpperCase()}</p>
                               <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                 ['completed', 'delivered'].includes(order.status) ? 'bg-[#0F7A60]/10 text-[#0F7A60]' :
                                 ['cancelled'].includes(order.status) ? 'bg-red-500/10 text-red-500' :
                                 'bg-amber-500/10 text-amber-600'
                               }`}>
                                 {STATUS_LABELS[order.status] || order.status}
                               </span>
                             </div>
                             <p className="text-sm font-bold text-[#1A1A1A] truncate group-hover:text-[#0F7A60] transition-colors">{productName}</p>
                           </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-4">
                          <p className="text-[15px] font-black text-[#1A1A1A]">{(order.vendor_amount || 0).toLocaleString('fr-FR')} F</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <ShoppingBag size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">Aucune commande pour le moment</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">Partagez votre lien de boutique pour générer vos premières ventes !</p>
                </div>
              )}
            </div>
          </div>

          {/* Niveau Vendeur (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-[32px] p-8 shadow-2xl shadow-black/20 text-white relative overflow-hidden flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-500 border border-white/10">
            {/* Décoration BG */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A84C]/20 blur-[60px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-[#C9A84C]/30 transition-colors duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <p className="text-[10px] font-black uppercase text-[#C9A84C] tracking-widest">Niveau vendeur</p>
                <Sparkles size={16} className="text-[#C9A84C] opacity-50" />
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                  {emoji}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight">{level}</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">Avantages exclusifs actifs</p>
                </div>
              </div>

              {level !== 'Platinum' ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-300">Progression vers {nextLevelName}</span>
                    <span className="text-[#C9A84C]">{Math.round(progressPercent)}%</span>
                  </div>
                  
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#C9A84C] to-yellow-300 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-gray-400 font-medium">
                    Encore <span className="text-white font-bold">{missingForNext.toLocaleString('fr-FR')} F</span> à générer pour débloquer le palier {nextLevelName}.
                  </p>
                </div>
              ) : (
                <div className="bg-[#C9A84C]/20 border border-[#C9A84C]/30 rounded-xl p-4">
                  <p className="text-sm font-black text-[#C9A84C]">Félicitations ! 🏆</p>
                  <p className="text-xs text-gray-300 mt-1">Vous avez atteint le palier maximum. Contactez votre account manager pour vos avantages VIP.</p>
                </div>
              )}
            </div>

            <Link 
              href="/dashboard/abonnements" 
              className="mt-6 block w-full text-center bg-white/10 hover:bg-white/15 border border-white/10 transition-colors py-3 rounded-xl text-xs font-bold text-white shadow-sm"
            >
              Voir les avantages de mon niveau
            </Link>
          </div>

        </section>

      </div>
    </main>
  )
}
