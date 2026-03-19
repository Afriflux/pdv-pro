import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChartLazyWrapper from './ChartLazyWrapper'
import { CopyLinkQuickAction, WhatsAppQuickAction } from './DashboardActions'
import { Package, ShoppingBag, ArrowRight } from 'lucide-react'
import { Check360Widget } from '@/components/dashboard/Check360Widget'

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
  const { data: storeRaw } = await supabase
    .from('Store')
    .select('id, name, slug, logo_url, contract_accepted')
    .eq('user_id', user.id)
    .single()

  if (!storeRaw) {
    redirect('/onboarding')
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
    { count: productCount }
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
      .eq('active', true)
  ])

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


  return (
    <main className="min-h-screen bg-[#FAFAF7] font-sans pb-20">
      
      {/* ── SECTION 1 : HEADER ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
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
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
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

      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">

        {/* ── SECTION 2 : 4 KPI CARDS ──────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white border border-gray-100 hover:border-gray-200 transition-colors rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">💰 CA Aujourd&apos;hui</p>
            <p className="text-2xl lg:text-3xl font-black text-[#1A1A1A] truncate">
              {caToday.toLocaleString('fr-FR')} <span className="text-sm text-gray-400 font-bold">F</span>
            </p>
          </div>
          
          <div className="bg-white border border-gray-100 hover:border-gray-200 transition-colors rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">📦 Ventes Aujourd&apos;hui</p>
            <p className="text-2xl lg:text-3xl font-black text-[#1A1A1A]">
              {countToday}
            </p>
          </div>

          <div className="bg-white border border-gray-100 hover:border-gray-200 transition-colors rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">⏳ En attente</p>
            <p className="text-2xl lg:text-3xl font-black text-amber-500">
              {pendingCount}
            </p>
          </div>

          <div className="bg-[#0F7A60]/5 border border-[#0F7A60]/10 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase text-[#0F7A60]/80 mb-2">🏦 Wallet disponible</p>
            <p className="text-2xl lg:text-3xl font-black text-[#0F7A60] truncate">
              {wallet.balance.toLocaleString('fr-FR')} <span className="text-sm font-bold opacity-60">F</span>
            </p>
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


        {/* ── SECTION 3 : GRAPHIQUE 7J + ACTIONS RAPIDES ───────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Graphique (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="font-black text-[#1A1A1A]">Revenus (7 derniers jours)</h2>
              <p className="text-xs text-gray-400">Évolution de votre chiffre d&apos;affaires</p>
            </div>
            <div className="flex-1 min-h-[250px] -ml-4">
               <ChartLazyWrapper data={chartData} />
            </div>
          </div>

          {/* Actions Rapides (5 cols) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <Link href="/dashboard/products/new" className="bg-[#0F7A60] hover:bg-[#0D6B53] text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors shadow-sm group">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl leading-none">+</span>
              </div>
              <span className="text-xs font-bold text-center">Nouveau produit</span>
            </Link>

            <Link href="/dashboard/orders" className="bg-white border border-gray-100 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#0F7A60] transition-colors shadow-sm group text-[#1A1A1A]">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0F7A60]/10 group-hover:text-[#0F7A60] transition-all">
                 <Package size={20} />
              </div>
              <span className="text-xs font-bold text-center">Mes commandes</span>
            </Link>

            <CopyLinkQuickAction slug={storeSlug} />
            <WhatsAppQuickAction slug={storeSlug} />
          </div>

        </section>

        {/* ── SECTION 4 & 5 : DERN. COMMANDES + NIVEAU VENDEUR ─────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 5 Dernières Commandes (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-black text-[#1A1A1A]">Dernières commandes</h2>
              <Link href="/dashboard/orders" className="text-xs font-bold text-[#0F7A60] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={12}/>
              </Link>
            </div>
            
            <div className="flex-1 flex flex-col">
              {lastOrdersData && lastOrdersData.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {lastOrdersData.map(order => {
                    // product_name vient du join Supabase via foreign key product_id
                    // Le retour est un array ou objet selon la cardinalité. Ici object.
                    const pNameRow = Array.isArray(order.product_name)
                      ? order.product_name[0]
                      : order.product_name
                    const productName = (pNameRow as { name?: string } | null)?.name ?? 'Produit inconnu'
                    
                    return (
                      <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                           <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                             ['completed', 'delivered'].includes(order.status) ? 'bg-[#0F7A60]' :
                             ['cancelled'].includes(order.status) ? 'bg-red-400' :
                             'bg-amber-400 animate-pulse'
                           }`} />
                           <div className="min-w-0">
                             <div className="flex items-center gap-2">
                               <p className="text-xs font-mono font-bold text-gray-500">#{order.id.split('-')[0].toUpperCase()}</p>
                               <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                 {STATUS_LABELS[order.status] || order.status}
                               </span>
                             </div>
                             <p className="text-sm font-bold text-[#1A1A1A] truncate mt-0.5">{productName}</p>
                           </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-4">
                          <p className="text-sm font-black text-[#1A1A1A]">{(order.vendor_amount || 0).toLocaleString('fr-FR')} F</p>
                          <p className="text-[10px] text-gray-400 font-medium">
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
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1A1A1A] to-gray-900 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden flex flex-col justify-between">
            {/* Décoration BG */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C] opacity-10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
            
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-4">Niveau vendeur</p>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-center text-3xl shadow-inner">
                  {emoji}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{level}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Basé sur vos revenus totaux</p>
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
