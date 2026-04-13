import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import {
  Megaphone, BarChart3, Image as ImageIcon, Mail, Target,
  TrendingUp, Eye, MousePointerClick,
  Sparkles, Send
} from 'lucide-react'

export default async function AdminMarketingPage() {
  const supabase = createAdminClient()

  const [
    { count: totalStores },
    { count: totalUsers },
    { count: totalOrders }
  ] = await Promise.all([
    supabase.from('Store').select('id', { count: 'exact', head: true }),
    supabase.from('User').select('id', { count: 'exact', head: true }),
    supabase.from('Order').select('id', { count: 'exact', head: true })
  ])

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-20">
      
      {/* Header Yayyam */}
      <header className="w-full bg-gradient-to-r from-[#012928] via-[#0A4138] to-[#04332A] pt-10 pb-16 px-6 lg:px-10 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Centre Marketing</h1>
            <p className="text-emerald-100/90 font-medium text-sm mt-1">
              Gérez vos campagnes, bannières et promotions plateforme.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="relative z-10 mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Audience Totale', value: totalUsers ?? 0, icon: Eye, color: 'text-white' },
            { label: 'Boutiques Actives', value: totalStores ?? 0, icon: TrendingUp, color: 'text-emerald-300' },
            { label: 'Commandes', value: totalOrders ?? 0, icon: MousePointerClick, color: 'text-amber-300' },
            { label: 'Taux Conversion', value: totalOrders && totalUsers ? `${((totalOrders / totalUsers) * 100).toFixed(1)}%` : '—', icon: Target, color: 'text-cyan-300' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
              <span className="text-emerald-100/70 text-xs font-black uppercase tracking-widest mb-1">{kpi.label}</span>
              <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="w-full px-6 lg:px-10 -mt-8 relative z-20">
        {/* Modules Marketing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Bannières */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <ImageIcon size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Bannières & Visuels</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Gérez les bannières de la page d&apos;accueil, créez des espaces publicitaires louables pour les vendeurs premium.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-100">Hero Banner</span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-100">Sidebar Ads</span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-100">Pop-ups</span>
            </div>
            <Link href="/admin/landing" className="text-sm font-black text-emerald-600 hover:text-emerald-800 transition">
              Configurer les bannières →
            </Link>
          </div>

          {/* Campagnes Email */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
              <Mail size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Campagnes Email</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Envoyez des newsletters, des annonces de lancement et des promotions ciblées. Templates Yayyam intégrés.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-bold border border-teal-100">Newsletters</span>
              <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-bold border border-teal-100">Individuel</span>
              <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-bold border border-teal-100">Groupé</span>
            </div>
            <Link href="/admin/email" className="text-sm font-black text-teal-600 hover:text-teal-800 transition">
              Centre de mailing →
            </Link>
          </div>

          {/* Campagnes Ads */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
              <Target size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Ads & Promotions</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Lancez des campagnes Meta Ads et Google Ads directement depuis votre dashboard. Tracking de conversion intégré.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs bg-pink-50 text-pink-700 px-3 py-1 rounded-full font-bold border border-pink-100">Meta Pixel</span>
              <span className="text-xs bg-pink-50 text-pink-700 px-3 py-1 rounded-full font-bold border border-pink-100">Google Ads</span>
              <span className="text-xs bg-pink-50 text-pink-700 px-3 py-1 rounded-full font-bold border border-pink-100">TikTok</span>
            </div>
            <span className="text-sm font-black text-gray-400">Bientôt disponible</span>
          </div>

          {/* Analytics Globales */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <BarChart3 size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Analytics Globales</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Vue d&apos;ensemble des performances de la plateforme : GMV, taux de conversion, top vendeurs, top produits.
            </p>
            <Link href="/admin/analytics" className="text-sm font-black text-emerald-600 hover:text-emerald-800 transition">
              Voir les analytics →
            </Link>
          </div>

          {/* Notifications Push */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <Send size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Notifications Push</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Envoyez des notifications in-app et push à tous les utilisateurs ou à des segments ciblés.
            </p>
            <Link href="/admin/notifications" className="text-sm font-black text-amber-600 hover:text-amber-800 transition">
              Centre de notifications →
            </Link>
          </div>

          {/* Programme de fidélité */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Sparkles size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Fidélité & Récompenses</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Système de points de fidélité et récompenses pour encourager les achats récurrents sur la plateforme.
            </p>
            <Link href="/admin/loyalty" className="text-sm font-black text-amber-600 hover:text-amber-800 transition">
              Voir le programme →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
