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
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-[#0F7A60]/10 text-[#0F7A60]">
            <Settings className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Paramètres Admin</h1>
        </div>
        <p className="text-gray-400 text-sm">Gérez votre profil, les paramètres plateforme et la sécurité.</p>
      </header>

      {/* ── SECTION 1 — PROFIL ADMIN ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <User className="w-4 h-4" />
          Profil Administrateur
        </h2>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
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
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Paramètres plateforme
        </h2>

        {/* Note informative */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
          <p className="font-medium text-xs">
            ℹ️ Les retraits sont traités <strong>automatiquement</strong>. Cette page configure uniquement
            les paramètres d&apos;affichage et de contact de la plateforme.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <PlatformSection initialConfig={configMap} />
        </div>
      </section>

      {/* ── SECTION 2B — TÂCHES DE MAINTENANCE (CRON) ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Tâches de maintenance (Cron)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CronButton
            label="Traitement des retraits bloqués"
            endpoint="/api/cron/retrait-auto"
            description="Traite les retraits en erreur technique (non les retraits normaux qui sont automatiques)."
          />
          <CronButton
            label="Nettoyage système"
            endpoint="/api/cron/nettoyage"
            description="Supprime les tokens expirés et les fichiers temporaires."
          />
          <CronButton
            label="Alertes & rappels commandes"
            endpoint="/api/cron/rappels-commandes"
            description="Envoie les notifications de stock bas et rappels aux vendeurs."
          />
          <CronButton
            label="Rapport hebdo vendeurs"
            endpoint="/api/cron/weekly-report"
            description="Envoie un email de performance hebdomadaire à chaque vendeur actif (commandes, revenus, meilleur produit)."
          />
          <CronButton
            label="Relances panier abandonné"
            endpoint="/api/cron/abandoned-cart"
            description="Relance par email les acheteurs ayant laissé une commande en attente de paiement depuis 2-24h."
          />
        </div>
      </section>

      {/* ── SECTION 3 — SÉCURITÉ ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Sécurité
        </h2>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <SecuritySection />
        </div>
      </section>

    </div>
  )
}
