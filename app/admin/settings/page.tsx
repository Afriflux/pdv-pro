import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Settings, User, Globe, Lock, Info } from 'lucide-react'
import ProfileSection from './ProfileSection'
import PlatformSection from './PlatformSection'
import SecuritySection from './SecuritySection'
import CronButton from './CronButton'

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
// 3 sections : Profil · Plateforme · Sécurité
// ----------------------------------------------------------------
export default async function AdminSettingsPage() {
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

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-3xl mx-auto">

      {/* ── EN-TÊTE ── */}
      <header className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 text-[#0F7A60] shadow-inner">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Paramètres Admin</h1>
          </div>
          <p className="text-sm text-gray-500 ml-14 font-medium">Gérez votre profil, les paramètres plateforme et la sécurité.</p>
        </div>
      </header>

      {/* ── SECTION 1 — PROFIL ADMIN ── */}
      <section className="space-y-4 animate-in fade-in">
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

      {/* ── SECTION 2 — PARAMÈTRES PLATEFORME ── */}
      <section className="space-y-4 animate-in fade-in">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" />
          Paramètres plateforme
        </h2>

        {/* Note informative */}
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

      {/* ── SECTION 2B — TÂCHES DE MAINTENANCE (CRON) ── */}
      <section className="space-y-4 animate-in fade-in">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
          <Settings className="w-3.5 h-3.5" />
          Tâches de maintenance (Cron)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CronButton
            label="Traitement retraits bloqués"
            endpoint="/api/cron/retrait-auto"
            description="Traite les retraits en erreur technique."
          />
          <CronButton
            label="Nettoyage système"
            endpoint="/api/cron/nettoyage"
            description="Supprime tokens et fichiers temporaires."
          />
          <CronButton
            label="Alertes & rappels"
            endpoint="/api/cron/rappels-commandes"
            description="Envoie les notifications aux vendeurs."
          />
          <CronButton
            label="Rapport hebdo"
            endpoint="/api/cron/weekly-report"
            description="Email de performance hebdomadaire."
          />
          <CronButton
            label="Relances abandonné"
            endpoint="/api/cron/abandoned-cart"
            description="Relance par email les acheteurs."
          />
        </div>
      </section>

      {/* ── SECTION 3 — SÉCURITÉ ── */}
      <section className="space-y-4 animate-in fade-in">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5" />
          Sécurité
        </h2>
        <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6">
          <SecuritySection />
        </div>
      </section>

    </div>
  )
}
