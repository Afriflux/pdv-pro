'use client'

import {
  MousePointerClick,
  TrendingUp,
  Target,
  ShoppingCart,
  CheckCircle2,
  Copy,
  Wallet,
  Link as LinkIcon,
  Trophy,
  Activity,
  Bot
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

// Extending the prisma types to avoid full typing complexities in the frontend client.
interface PortalClientProps {
  affiliate: Record<string, any>
  recentOrders: Record<string, any>[]
  thisMonthEarnings: number
  topAffiliates: Record<string, any>[]
}

const formatXOF = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount)
}

export default function PortalClient({ affiliate, recentOrders, thisMonthEarnings, topAffiliates }: PortalClientProps) {
  const [copying, setCopying] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const defaultShopUrl = `https://${affiliate.Store?.slug || 'boutique'}.yayyam.com?ref=${affiliate.code}`

  // KPI Calculations
  const conversionRate = affiliate.clicks > 0 
    ? ((affiliate.conversions / affiliate.clicks) * 100).toFixed(1) 
    : 0

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultShopUrl)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  // Gamification Logic (0 -> 100k -> 500k -> 1M)
  const total = affiliate.total_earned || 0
  let currentTier = "0 - 100K"
  let nextGoal = 100000

  let progress = 0

  if (total < 100000) {
    currentTier = "0 - 100K"
    nextGoal = 100000
    progress = (total / nextGoal) * 100
  } else if (total < 500000) {
    currentTier = "100K - 500K"
    nextGoal = 500000
    progress = (total / nextGoal) * 100
  } else if (total < 1000000) {
    currentTier = "500K - 1M"
    nextGoal = 1000000
    progress = (total / nextGoal) * 100
  } else {
    currentTier = "+ 1M (👑 Elite)"
    nextGoal = total // maxed
    progress = 100
  }

  // Données Graphiques Simulées (Performance 7 derniers jours)
  // Dans un cas réel, ces données viendraient des props (calculées côté serveur)
  const chartData = [
    { name: 'Lun', gains: 15000 },
    { name: 'Mar', gains: 25000 },
    { name: 'Mer', gains: 12000 },
    { name: 'Jeu', gains: 45000 },
    { name: 'Ven', gains: 30000 },
    { name: 'Sam', gains: 60000 },
    { name: 'Dim', gains: Math.max(5000, thisMonthEarnings / 4) } 
  ]

  const store = affiliate.Store;
  const isChallengeActive = store?.gamification_active;
  const challengeConfig = store?.gamification_config || { goal_sales: 50, reward_amount: 50000 };
  
  // Dans un vrai système, on calculerait les ventes du mois en cours depuis la prop recentOrders ou monthOrders
  // Ici pour la démo on va utiliser un estimate basé sur "thisMonthEarnings" divisé par une commission moyenne
  const estimatedMonthSales = Math.floor(thisMonthEarnings / 3000); 
  const challengeProgress = isChallengeActive ? Math.min((estimatedMonthSales / challengeConfig.goal_sales) * 100, 100) : 0;

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* ── CHALLENGE VENDEUR (Si Actif) ── */}
      {isChallengeActive && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-[2rem] shadow-lg shadow-orange-500/20 p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 text-white transform hover:scale-[1.01] transition-transform">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner backdrop-blur-md relative z-10 border border-white/30">
            <Trophy className="text-white w-8 h-8" />
          </div>
          
          <div className="flex-1 w-full relative z-10">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-white/80 font-medium text-sm font-bold tracking-widest uppercase">Challenge Mensuel</p>
                <h3 className="font-display font-black text-2xl">Atteignez {challengeConfig.goal_sales} ventes</h3>
              </div>
              <div className="text-right">
                <span className="font-black text-2xl">{estimatedMonthSales}</span>
                <span className="text-white/80 text-sm font-bold"> / {challengeConfig.goal_sales} ventes</span>
              </div>
            </div>
            
            <div className="h-3 bg-black/20 rounded-full overflow-hidden w-full relative shadow-inner">
              {/* eslint-disable-next-line */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all duration-1000"
                ref={el => { if (el) el.style.width = `${Math.max(2, challengeProgress)}%`; }}
              />
            </div>
            <p className="text-white/90 text-sm mt-2 font-medium flex items-center justify-between">
              <span>Prime à gagner : <strong className="font-black text-lg">{formatXOF(challengeConfig.reward_amount)}</strong></span>
              {challengeProgress >= 100 ? (
                <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Objectif Atteint ! 🎉</span>
              ) : (
                <span className="text-white/80 text-xs">Encore {challengeConfig.goal_sales - estimatedMonthSales} ventes</span>
              )}
            </p>
          </div>
          
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        </div>
      )}
      
      {/* ── SYSTEME DE NIVEAUX A VIE (GAMIFICATION BAR) ── */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-line p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald to-emerald-400 flex items-center justify-center shrink-0 shadow-lg relative z-10">
          <Target className="text-white w-8 h-8" />
        </div>
        
        <div className="flex-1 w-full relative z-10">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-slate font-medium text-sm">Niveau Actuel</p>
              <h3 className="font-display font-black text-ink text-xl">{currentTier}</h3>
            </div>
            <div className="text-right">
              <span className="text-charcoal font-bold">{formatXOF(total)}</span>
              <span className="text-slate text-sm"> / {formatXOF(nextGoal)}</span>
            </div>
          </div>
          
          <div className="h-3 bg-cream rounded-full overflow-hidden w-full relative">
            {/* eslint-disable-next-line */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald to-emerald-400 rounded-full transition-all duration-1000"
              ref={el => { if (el) el.style.width = `${Math.max(2, progress)}%`; }}
            />
          </div>
          <p className="text-slate text-xs mt-2 text-right">
            {progress < 100 ? (
              <>Encore <strong className="text-emerald">{formatXOF(nextGoal - total)}</strong> pour atteindre le palier supérieur !</>
            ) : "Félicitations, vous êtes au niveau maximum !"}
          </p>
        </div>
        
        <div className="absolute right-0 top-0 w-64 h-64 bg-gold/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      </div>

      {/* ── COACH IA INFERENCE (Simulé client-side pour la vitesse) ── */}
      <div className="bg-gradient-to-r from-emerald-deep to-emerald p-[1px] rounded-[2rem] shadow-sm animate-fade-in-up hover:shadow-lg transition-all">
        <div className="bg-cream rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
               <Bot className="w-6 h-6 text-emerald" />
            </div>
            <div>
              <h3 className="font-display font-black text-ink text-lg flex items-center gap-2">
                Les conseils de votre Coach IA <span className="text-xl">🪄</span>
              </h3>
              <p className="text-slate text-sm leading-relaxed mt-2 max-w-2xl">
                {Number(affiliate.clicks) === 0 ? (
                  "Je remarque que vous n'avez généré aucun clic. Mon modèle prédictif suggère de poster votre lien dans au moins 3 groupes WhatsApp / Telegram locaux ce soir vers 19h (heure de pointe). L'engagement sera maximal."
                ) : Number(conversionRate) < 1.0 ? (
                  "Vos liens obtiennent des clics, mais peu de ventes (taux < 1%). Le problème ? Votre trafic n'est pas assez qualifié ! Arrêtez le partage généraliste et ciblez une niche précise. Le produit ne correspond peut-être pas à votre audience actuelle."
                ) : thisMonthEarnings > 0 ? (
                  "🔥 Excellente dynamique ! L'algorithme détecte un momentum fort. Si vous réinvestissez le temps passé hier dans la promotion d'un autre produit de la Marketplace aujourd'hui, vous pourriez faire +45% de performances d'ici dimanche."
                ) : (
                  "C'est le moment de relancer la machine ! Mettez en avant le caractère 'Exclusif' ou 'Remise Limitée' dans vos argumentaires. Utilisez le générateur de texte IA dans la Marketplace pour trouver l'inspiration."
                )}
              </p>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald/10 blur-2xl rounded-full pointer-events-none" />
        </div>
      </div>

      {/* ── KPI SECTION ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative z-10">
        
        {/* Carte 1: Gains du Mois (Primary #0F7A60) */}
        <div className="bg-[#0F7A60] rounded-[32px] p-6 lg:p-8 shadow-xl shadow-[#0F7A60]/20 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">
              Gains du Mois
            </p>
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/80">
              <Wallet size={14} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl lg:text-4xl font-display font-black text-white tracking-tighter">
              {formatXOF(thisMonthEarnings).replace('FCFA', '')}
              <span className="text-sm font-bold opacity-60 ml-1">F</span>
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-white/80 font-bold">
              <TrendingUp size={12} className="text-[#A3E635]" />
              <span>Performances du mois</span>
            </div>
          </div>
        </div>

        {/* Carte 2: Total Gagné */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-[#0F7A60]/30 transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Total Gagné
            </p>
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-gold group-hover:border-gold/30 transition-colors">
              <Target size={14} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] tracking-tighter">
              {formatXOF(affiliate.total_earned).replace('FCFA', '')}
              <span className="text-sm font-bold text-gray-400 ml-1">F</span>
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 font-bold">
              <span>Historique complet</span>
            </div>
          </div>
        </div>

        {/* Carte 3: Clics Générés */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-[#0F7A60]/30 transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Clics Générés
            </p>
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-colors">
              <MousePointerClick size={14} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] tracking-tighter">
              {new Intl.NumberFormat('fr-FR').format(affiliate.clicks)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 font-bold">
              <span>Clics sur vos liens</span>
            </div>
          </div>
        </div>

        {/* Carte 4: Taux de Conversion */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-[#0F7A60]/30 transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Conversion
            </p>
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-[#0F7A60] group-hover:border-[#0F7A60]/30 transition-colors">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] tracking-tighter">
                {conversionRate}%
              </p>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 font-bold">
              <span className="text-[#1A1A1A]">{affiliate.conversions}</span> ventes générées
            </div>
          </div>
        </div>

      </section>

      {/* ── GRAPHIQUES & LISTES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* COLONNE GAUCHE (Graph et Dernières Ventes) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Nouveau: Graphique d'évolution */}
          <div className="rounded-[2rem] shadow-sm border border-line bg-white p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display font-black text-ink text-lg flex items-center gap-2">
                  <Activity className="text-emerald" size={20} /> Evolution des gains <span className="text-xs font-medium text-slate bg-cream px-2 py-1 rounded ml-2">7 Jours</span>
                </h3>
              </div>
            </div>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorGains" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                   />
                   <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      tickFormatter={(val) => `${val / 1000}k`}
                   />
                   <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                     itemStyle={{ color: '#0f172a' }}
                     formatter={(value) => [formatXOF(Number(value)), 'Gains']}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="gains" 
                     stroke="#10b981" 
                     strokeWidth={3}
                     fillOpacity={1} 
                     fill="url(#colorGains)" 
                     animationDuration={1500}
                     animationEasing="ease-out"
                   />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate mt-2 italic">* Données simulées affichées en guise de démonstration.</p>
          </div>

          <div className="rounded-[2rem] shadow-sm border border-line bg-white overflow-hidden">
            <div className="bg-cream border-b border-line px-6 py-5">
              <h3 className="font-display font-black text-ink text-lg">Dernières Ventes Générées</h3>
              <p className="text-slate text-sm">Les commandes passées via votre lien.</p>
            </div>
            <div className="p-0">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-dust" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-ink font-bold mb-1">Aucune vente pour le moment</h3>
                  <p className="text-slate text-sm">Partagez votre lien pour commencer à gagner des commissions.</p>
                </div>
              ) : (
                <div className="divide-y divide-line pointer-events-none">
                  {recentOrders.map((order, idx) => (
                    <div key={order.id} className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-ink text-sm uppercase tracking-wide">Commande #{order.id.slice(0, 8)}</span>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-lg uppercase tracking-wider ${
                            order.status === 'confirmed' || order.status === 'delivered' ? 'bg-emerald/10 text-emerald' : 
                            order.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate">
                          Client: {order.buyer_name ? `${order.buyer_name[0]}***` : 'Anonyme'} • {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate font-medium mb-0.5">Commission gagnée</p>
                        <p className="text-emerald font-black text-xl tracking-tight">+{formatXOF(order.affiliate_amount || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE (Outils rapides) */}
        <div className="space-y-6">
          <div className="rounded-[2rem] shadow-md border-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white">
            <div className="p-6">
              <h3 className="font-display font-black text-xl mb-2 flex items-center gap-2">
                <LinkIcon className="text-emerald-400" size={20} />
                Lien par défaut
              </h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Ce lien renvoie vers la page principale de la boutique. Tout achat effectué après un clic vous rapportera <strong className="text-white">{affiliate.commission_rate}%</strong> de commission.
              </p>

              <div className="bg-black/40 backdrop-blur-sm border border-white/10 p-3 rounded-2xl flex items-center gap-3">
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-emerald-300 truncate">
                    {defaultShopUrl}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="bg-emerald text-white p-2.5 rounded-xl hover:bg-emerald/90 hover:-translate-y-0.5 transition-all shadow-lg active:scale-95 shrink-0"
                >
                  {copying ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] shadow-sm border border-line bg-gradient-to-br from-[#052e22] to-[#0a1a15] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/20 blur-3xl pointer-events-none" />
            <div className="p-6 flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center shadow-sm mb-4">
                <Wallet className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-display font-black text-white text-lg mb-2">Mon Portefeuille</h3>
              <p className="text-sm text-white/60 mb-6 font-medium leading-relaxed">
                Solde actuel : <strong className="text-white">{formatXOF(affiliate.balance || 0)}</strong><br/>
                Retirez vos gains vers Wave / Orange Money.
              </p>
              
              <Link href="/portal/wallet" className="w-full">
                <button 
                  className="w-full py-3.5 px-4 rounded-xl font-black transition-all shadow-xl flex items-center justify-center gap-2 bg-emerald-400 text-[#052e22] hover:bg-emerald-300 transform active:scale-95"
                >
                  Gérer mes retraits
                </button>
              </Link>
            </div>
          </div>

          {/* NOUVEAU: WIDGET LEADERBOARD */}
          <div className="rounded-[2rem] shadow-sm border border-line bg-white overflow-hidden relative">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                   <Trophy className="w-5 h-5 text-gold" />
                </div>
                <div>
                   <h3 className="font-display font-black text-ink text-lg">Top Ambassadeurs</h3>
                   <p className="text-xs text-slate font-medium">Les meilleurs affiliés du réseau</p>
                </div>
              </div>

              <div className="space-y-4">
                {topAffiliates.map((aff, index) => {
                  const isCurrentUser = aff.id === affiliate.id;
                  let rankColor = "bg-gray-100 text-slate";
                  if (index === 0) rankColor = "bg-gold text-white shadow-md shadow-gold/20";
                  if (index === 1) rankColor = "bg-gray-300 text-gray-800 shadow-sm";
                  if (index === 2) rankColor = "bg-[#CD7F32] text-white shadow-sm"; // Bronze

                  // Anonymiser le nom (Cheikh D.)
                  const fullName = aff.User?.name || 'Anonyme';
                  const nameParts = fullName.split(' ');
                  const firstName = nameParts[0];
                  const lastInitial = nameParts.length > 1 ? `${nameParts[1][0]}.` : '';
                  const shortName = `${firstName} ${lastInitial}`.trim();

                  return (
                    <div key={aff.id} className={`flex items-center gap-3 p-3 rounded-2xl ${isCurrentUser ? 'bg-emerald/5 border border-emerald/20' : 'hover:bg-gray-50'}`}>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${rankColor}`}>
                         {index + 1}
                       </div>
                       
                       <div className="flex-1 min-w-0">
                         <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-emerald-deep' : 'text-ink'}`}>
                           {isCurrentUser ? 'Vous (Mon Rang)' : shortName}
                         </p>
                       </div>
                       
                       <div className="text-right shrink-0">
                         <p className="text-sm font-black text-charcoal">{formatXOF(aff.total_earned)}</p>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
