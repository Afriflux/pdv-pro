import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, User, Globe, Lock, Info, Landmark } from 'lucide-react'
import ProfileSection from './ProfileSection'
import PlatformSection from './PlatformSection'
import SecuritySection from './SecuritySection'
import CronButton from './CronButton'
import MaintenanceSwitch from './MaintenanceSwitch'
import FinancesSection from './FinancesSection'
import AuditLogTable, { AuditLog } from './AuditLogTable'
import { getPlatformConfig } from '@/lib/admin/adminActions'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface AdminUserProfile {
  id:         string
  name:       string | null
  email:      string
  avatar_url: string | null
  role:       string
}

interface PlatformConfig {
  key:   string
  value: string
}

// ----------------------------------------------------------------
// PAGE PARAMÈTRES ADMIN — Charte PDV Pro
// ----------------------------------------------------------------
export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const resolvedParams = await searchParams
  const activeTab = resolvedParams.tab || 'profile'
  // Vérification authentification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()

  // Données profil admin connecté
  const { data: adminUser } = await supabaseAdmin
    .from('User')
    .select('id, name, email, avatar_url, role')
    .eq('id', user.id)
    .single<AdminUserProfile>()

  // Paramètres plateforme (table clé/valeur)
  const { data: configs } = await supabaseAdmin
    .from('PlatformConfig')
    .select('key, value')

  // Transformer la liste clé/valeur en objet pour faciliter l'accès
  const configMap: Record<string, string> = {}
  for (const row of (configs as PlatformConfig[]) ?? []) {
    configMap[row.key] = row.value
  }

  // Finances Globales
  const financialConfig = await getPlatformConfig()

  // Logs d'audit
  let auditLogs: AuditLog[] = []
  if (activeTab === 'security') {
    const { data } = await supabaseAdmin
      .from('AdminLog')
      .select('id, action, created_at, target_type, target_id, details, User(name, email)')
      .order('created_at', { ascending: false })
      .limit(50)
    auditLogs = (data as unknown as AuditLog[]) || []
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-12">

      {/* ── EN-TÊTE FULL BLEED IMMERSIF ── */}
      <div className="relative bg-gradient-to-r from-[#012928] to-[#0A4138] pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden">
        {/* Motif Glassmorphism de fond */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -z-0 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[80px] -z-0 pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black tracking-widest uppercase">
                Gouvernance & Sécurité
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Control Center <span className="text-emerald-400 opacity-60">·</span>
            </h1>
            <p className="mt-4 text-emerald-100/70 text-sm max-w-xl font-medium leading-relaxed">
              Supervisez les tâches planifiées, la sécurité et la configuration globale.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ── MENUS DE NAVIGATION ── */}
          <aside className="lg:w-[280px] flex-shrink-0">
            {/* Menu Desktop (Sticky) */}
            <div className="sticky top-24 hidden lg:flex flex-col space-y-1.5 p-3 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
               <Link href="?tab=profile" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group ${activeTab === 'profile' ? 'text-[#0F7A60] bg-white border border-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50 border border-transparent'}`}>
                  <User className="w-4 h-4 relative z-10" /> <span className="relative z-10">Profil Admin</span>
               </Link>
               <Link href="?tab=finances" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group ${activeTab === 'finances' ? 'text-[#0F7A60] bg-white border border-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50 border border-transparent'}`}>
                  <Landmark className="w-4 h-4 relative z-10" /> <span className="relative z-10">Finances & Commissions</span>
               </Link>
               <Link href="?tab=platform" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group ${activeTab === 'platform' ? 'text-[#0F7A60] bg-white border border-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50 border border-transparent'}`}>
                  <Globe className="w-4 h-4 relative z-10" /> <span className="relative z-10">Configuration Globale</span>
               </Link>
               <Link href="?tab=cron" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group ${activeTab === 'cron' ? 'text-[#0F7A60] bg-white border border-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50 border border-transparent'}`}>
                  <Settings className="w-4 h-4 relative z-10" /> <span className="relative z-10">Maintenance Automatique</span>
               </Link>
               <Link href="?tab=security" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group ${activeTab === 'security' ? 'text-[#0F7A60] bg-white border border-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50 border border-transparent'}`}>
                  <Lock className="w-4 h-4 relative z-10" /> <span className="relative z-10">Sécurité</span>
               </Link>
            </div>

            {/* Menu Mobile (Horizontal Scroll) */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
               <Link href="?tab=profile" className={`flex-none flex items-center gap-2 px-5 py-2.5 backdrop-blur-md rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-colors ${activeTab === 'profile' ? 'bg-white border-white text-[#0F7A60]' : 'bg-white/40 border-white/40 text-gray-600'}`}>
                  <User className="w-3.5 h-3.5" /> Profil
               </Link>
               <Link href="?tab=finances" className={`flex-none flex items-center gap-2 px-5 py-2.5 backdrop-blur-md rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-colors ${activeTab === 'finances' ? 'bg-white border-white text-[#0F7A60]' : 'bg-white/40 border-white/40 text-gray-600'}`}>
                  <Landmark className="w-3.5 h-3.5" /> Finances
               </Link>
               <Link href="?tab=platform" className={`flex-none flex items-center gap-2 px-5 py-2.5 backdrop-blur-md rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-colors ${activeTab === 'platform' ? 'bg-white border-white text-[#0F7A60]' : 'bg-white/40 border-white/40 text-gray-600'}`}>
                  <Globe className="w-3.5 h-3.5" /> Paramètres
               </Link>
               <Link href="?tab=cron" className={`flex-none flex items-center gap-2 px-5 py-2.5 backdrop-blur-md rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-colors ${activeTab === 'cron' ? 'bg-white border-white text-[#0F7A60]' : 'bg-white/40 border-white/40 text-gray-600'}`}>
                  <Settings className="w-3.5 h-3.5" /> Maintenance
               </Link>
               <Link href="?tab=security" className={`flex-none flex items-center gap-2 px-5 py-2.5 backdrop-blur-md rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-colors ${activeTab === 'security' ? 'bg-white border-white text-[#0F7A60]' : 'bg-white/40 border-white/40 text-gray-600'}`}>
                  <Lock className="w-3.5 h-3.5" /> Sécurité
               </Link>
            </div>
          </aside>

          {/* ── RIGHT CONTENT (SECTIONS) ── */}
          <div className="flex-1 space-y-12 pb-24 min-w-0">

        {/* ── SECTION 1 — PROFIL ADMIN ── */}
        {activeTab === 'profile' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            Profil Administrateur
          </h2>
          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
            <ProfileSection
              userId={adminUser?.id ?? user.id}
              initialName={adminUser?.name ?? ''}
              email={adminUser?.email ?? user.email ?? ''}
              avatarUrl={adminUser?.avatar_url ?? null}
              role={adminUser?.role ?? 'support'}
            />
          </div>
        </section>
        )}

        {/* ── SECTION 1B — FINANCES & COMMISSIONS ── */}
        {activeTab === 'finances' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
            <Landmark className="w-3.5 h-3.5" />
            Finances & Commissions
          </h2>
          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6">
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 translate-y-1/3"></div>
            <FinancesSection initialConfig={financialConfig} />
          </div>
        </section>
        )}

        {/* ── SECTION 2 — PARAMÈTRES PLATEFORME ── */}
        {activeTab === 'platform' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            Paramètres plateforme
          </h2>

          <div className="flex items-start gap-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/60 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl -translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <span className="text-xl flex-shrink-0 p-2 bg-blue-100/80 rounded-2xl shadow-sm border border-blue-200 text-blue-500">
              <Info className="w-5 h-5" />
            </span>
            <div className="relative z-10 pt-1">
              <p className="text-sm font-semibold text-blue-900 leading-snug">
                Les retraits sont traités <strong className="font-extrabold">automatiquement</strong>. Cette page configure uniquement les paramètres d&apos;affichage et de contact de la plateforme.
              </p>
            </div>
          </div>

          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6">
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none -translate-x-1/3 -translate-y-1/3"></div>
            <PlatformSection initialConfig={configMap} />
          </div>
        </section>
        )}

        {/* ── SECTION 2B — TÂCHES DE MAINTENANCE (CRON) ── */}
        {activeTab === 'cron' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" />
            Tâches de maintenance (Cron)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CronButton
              label="Traitement retraits bloqués"
              endpoint="/api/cron/retrait-auto"
              description="Traite les retraits en erreur technique."
              lastRunStr={configMap['cron_retrait-auto']}
            />
            <CronButton
              label="Nettoyage système"
              endpoint="/api/cron/nettoyage"
              description="Supprime tokens et fichiers temporaires."
              lastRunStr={configMap['cron_nettoyage']}
            />
            <CronButton
              label="Alertes & rappels"
              endpoint="/api/cron/rappels-commandes"
              description="Envoie les notifications aux vendeurs."
              lastRunStr={configMap['cron_rappels-commandes']}
            />
            <CronButton
              label="Rapport hebdo"
              endpoint="/api/cron/weekly-report"
              description="Email de performance hebdomadaire."
              lastRunStr={configMap['cron_weekly-report']}
            />
            <CronButton
              label="Relances abandonné"
              endpoint="/api/cron/abandoned-cart"
              description="Relance par email les acheteurs."
              lastRunStr={configMap['cron_abandoned-cart']}
            />
          </div>
          <MaintenanceSwitch
            initialActive={configMap['maintenance_active']}
            initialMessage={configMap['maintenance_message']}
          />
        </section>
        )}

        {/* ── SECTION 3 — SÉCURITÉ ── */}
        {activeTab === 'security' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Sécurité & Traçabilité
          </h2>
          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6">
            <SecuritySection />
            <div className="mt-8 border-t border-gray-100/50 pt-8">
              <AuditLogTable logs={auditLogs} />
            </div>
          </div>
        </section>
        )}

          </div>
        </div>
      </div>
    </div>
  )
}
