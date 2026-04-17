// ─── app/admin/email/page.tsx ────────────────────────────────────────────────
// Page admin — Statistiques email Brevo globales (Server Component)
// Stats : abonnés par liste + total campagnes
// Interactive Table importée en tant que Client Component

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listEmailCampaigns, getListStats } from '@/lib/brevo/brevo-service'
import { Mail, Users, Store, Send } from 'lucide-react'
import EmailCampaignsDashboard from './EmailCampaignsDashboard'
import SyncContactsButton from './SyncContactsButton'

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface ListStat {
  totalSubscribers: number
  totalBlacklisted: number
}

interface Campaign {
  id:          number
  name:        string
  subject:     string
  status:      string
  createdAt:   string
  scheduledAt?: string
  statistics?: {
    globalStats?: {
      delivered?:    number
      uniqueOpens?:  number
      uniqueClicks?: number
      unsubscribed?: number
      hardBounces?:  number
      softBounces?:  number
    }
  }
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse w-full">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"></div>)}
       </div>
       <div className="h-96 bg-white rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"></div>
    </div>
  )
}

// ─── Page Principale ─────────────────────────────────────────────────────────

export default async function AdminEmailPage() {
  // 1. Auth + vérification rôle super_admin
  const supabase      = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  const { data: callerData } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (callerData?.role !== 'super_admin') redirect('/admin')

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F0F2F5] w-full animate-in fade-in duration-500 pb-0 overflow-x-hidden">
      
      {/* ── HEADER FULL-BLEED (COVER PREMIUM) ── */}
      <div className="relative bg-gradient-to-r from-[#012928] to-[#0A4138] pt-8 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -z-0 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[80px] -z-0 pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-widest uppercase">
                Outils & Marketing
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Email<br />Marketing <span className="text-emerald-400 opacity-60">·</span>
            </h1>
            <p className="mt-4 text-emerald-100/70 text-sm max-w-xl font-medium leading-relaxed">
              Pilotez vos campagnes d'acquisition et analysez vos performances Brevo.
            </p>
          </div>

          <div className="relative w-full md:w-auto flex flex-col sm:flex-row justify-start md:justify-end gap-3">
            <SyncContactsButton />
            <a href="https://app.brevo.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl shadow-xl text-white font-bold hover:bg-white/20 transition-all text-sm group">
              Ouvrir Brevo <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── SPLIT VIEW (Content) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 w-full animate-in slide-in-from-bottom-2 duration-300 pb-12">
        <Suspense fallback={<DashboardSkeleton />}>
          <EmailDashboardContent />
        </Suspense>
      </div>

    </div>
  )
}

// ─── Composant Serveur de Données ──────────────────────────────────────────

async function EmailDashboardContent() {
  // 2. Charger les données Brevo en parallèle
  const [fetchedCampaigns, fetchedList2, fetchedList3] = await Promise.all([
    listEmailCampaigns().catch((): Campaign[] => []),
    getListStats(2).catch((): ListStat => ({ totalSubscribers: 0, totalBlacklisted: 0 })),
    getListStats(3).catch((): ListStat => ({ totalSubscribers: 0, totalBlacklisted: 0 })),
  ]) as [Campaign[], ListStat, ListStat]

  const campaigns = fetchedCampaigns || []
  const list1 = { totalSubscribers: 0, totalBlacklisted: 0 } // Liste 1 n'existe pas sur Brevo
  const list2 = fetchedList2 || { totalSubscribers: 0, totalBlacklisted: 0 }
  const list3 = fetchedList3 || { totalSubscribers: 0, totalBlacklisted: 0 }

  return (
    <div className="space-y-6 w-full">
      
      {/* ── CARDS STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Card : Acheteurs abonnés */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
            <Users className="w-24 h-24 text-[#0F7A60]" />
          </div>
          <p className="text-xs font-black uppercase text-[#0F7A60] tracking-widest mb-1 relative z-10">Liste 1 - Acheteurs</p>
          <div className="flex items-baseline gap-2 relative z-10">
             <h3 suppressHydrationWarning className="text-4xl font-black text-gray-900 tracking-tight">
                {(list1?.totalSubscribers ?? 0).toLocaleString('fr-FR')}
             </h3>
          </div>
        </div>

        {/* Card : Vendeurs abonnés */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
            <Store className="w-24 h-24 text-amber-500" />
          </div>
          <p className="text-xs font-black uppercase text-amber-500/80 tracking-widest mb-1 relative z-10">Liste 2 - Vendeurs</p>
          <div className="flex items-baseline gap-2 relative z-10">
             <h3 suppressHydrationWarning className="text-4xl font-black text-amber-500 tracking-tight">
                {(list2?.totalSubscribers ?? 0).toLocaleString('fr-FR')}
             </h3>
          </div>
        </div>

        {/* Card : Newsletters boutiques */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
            <Mail className="w-24 h-24 text-indigo-500" />
          </div>
          <p className="text-xs font-black uppercase text-indigo-500/80 tracking-widest mb-1 relative z-10">Liste 3 - Newsletters</p>
          <div className="flex items-baseline gap-2 relative z-10">
             <h3 suppressHydrationWarning className="text-4xl font-black text-indigo-500 tracking-tight">
                {(list3?.totalSubscribers ?? 0).toLocaleString('fr-FR')}
             </h3>
          </div>
        </div>

        {/* Card : Campagnes */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
            <Send className="w-24 h-24 text-emerald-600" />
          </div>
          <p className="text-xs font-black uppercase text-emerald-600 tracking-widest mb-1 relative z-10">Volume Campagnes</p>
          <div className="flex items-baseline gap-2 relative z-10">
             <h3 className="text-4xl font-black text-emerald-600 tracking-tight">{campaigns.length}</h3>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE CLIENT COMPONENTS ── */}
      <EmailCampaignsDashboard campaigns={campaigns} />

    </div>
  )
}
