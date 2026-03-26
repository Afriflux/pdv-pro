// ─── Page Intégrations — Server Component ──────────────────────────────────
// Les clés sont stockées dans PlatformConfig (key/value).
// L'admin lit les clés masquées et les modifie via un composant client inline.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Puzzle } from 'lucide-react'
import IntegrationItem from './IntegrationItem'

// ─── Définition des intégrations ──────────────────────────────────────────
interface IntegrationDef {
  key:         string
  label:       string
  description: string
  docsUrl:     string | null
  icon?:       string  // Optionnel — fallback '🔑' dans IntegrationItem
}

interface IntegrationGroup {
  group: string
  items: IntegrationDef[]
}

const INTEGRATIONS: IntegrationGroup[] = [
  {
    group: '🤖 Intelligence Artificielle',
    items: [
      { key: 'ANTHROPIC_API_KEY',         label: 'Claude AI (Anthropic)',        description: 'Générateur IA fiches produits',        docsUrl: 'https://console.anthropic.com' },
    ],
  },
  {
    group: '🌊 Paiements Mobile Money',
    items: [
      { key: 'WAVE_API_KEY',              label: 'Wave API Key',                 description: 'Paiements Wave Sénégal',               docsUrl: 'https://wave.com/fr/business' },
      { key: 'WAVE_API_SECRET',           label: 'Wave Webhook Secret',          description: 'Vérification IPN Wave',                docsUrl: null },
      { key: 'ORANGE_MONEY_API_KEY',      label: 'Orange Money API Key',         description: 'Paiements Orange Money',               docsUrl: 'https://developer.orange.com' },
      { key: 'ORANGE_MONEY_MERCHANT_KEY', label: 'Orange Money Merchant Key',    description: 'Clé marchande OM',                    docsUrl: null },
    ],
  },
  {
    group: '💳 Paiements Carte Bancaire',
    items: [
      { key: 'CINETPAY_API_KEY',          label: 'CinetPay API Key',             description: 'Paiements carte CinetPay',            docsUrl: 'https://cinetpay.com' },
      { key: 'CINETPAY_SITE_ID',          label: 'CinetPay Site ID',             description: 'Identifiant site CinetPay',           docsUrl: null },
    ],
  },
  {
    group: '📱 Notifications',
    items: [
      { key: 'BREVO_API_KEY',             label: 'Brevo (Sendinblue) API Key',   description: 'Email marketing et emails transactionnels', docsUrl: 'https://app.brevo.com/settings/keys/api', icon: '📧' },
      { key: 'TELEGRAM_BOT_TOKEN',        label: 'Telegram Bot Token',           description: 'Notifications via @PDVProBot',        docsUrl: 'https://t.me/BotFather' },
      { key: 'TWILIO_ACCOUNT_SID',        label: 'Twilio Account SID',           description: 'WhatsApp automatique',                docsUrl: 'https://console.twilio.com' },
      { key: 'TWILIO_AUTH_TOKEN',         label: 'Twilio Auth Token',            description: 'Authentification Twilio',             docsUrl: null },
    ],
  },
]

// Masquage de la valeur : affiche les 4 premiers + ••• + les 4 derniers caractères
function maskValue(val: string): string {
  if (!val) return 'Non configurée'
  if (val.length <= 8) return '••••••••'
  return `${val.slice(0, 4)}••••••••${val.slice(-4)}`
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default async function IntegrationsPage() {
  // Vérification auth + rôle super_admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  const { data: callerData } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (callerData?.role !== 'super_admin') redirect('/admin')

  // Récupérer toutes les clés stockées dans PlatformConfig
  const allKeys = INTEGRATIONS.flatMap(g => g.items.map(i => i.key))
  const { data: configRows } = await supabaseAdmin
    .from('PlatformConfig')
    .select('key, value')
    .in('key', allKeys)

  const configMap: Record<string, string> = {}
  for (const row of (configRows as { key: string; value: string }[]) ?? []) {
    configMap[row.key] = row.value
  }

  // Compteur global
  const allItems      = INTEGRATIONS.flatMap(g => g.items)
  const configuredCount = allItems.filter(i => !!configMap[i.key]).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">

      {/* ── EN-TÊTE ── */}
      <header className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 text-[#0F7A60] shadow-inner">
                <Puzzle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">Intégrations &amp; API</h1>
            </div>
            <p className="text-sm text-gray-500 ml-14 font-medium">
              Gérez les clés API des services tiers directement depuis cette interface.
            </p>
          </div>
          
          <div className="md:ml-0 ml-14">
            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border shadow-sm ${
              configuredCount === allItems.length
                ? 'bg-gradient-to-r from-[#0F7A60]/10 to-teal-500/10 text-[#0F7A60] border-[#0F7A60]/20'
                : 'bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-600 border-amber-200/60'
            }`}>
              {configuredCount}/{allItems.length} configurées
            </span>
          </div>
        </div>
      </header>

      {/* ── GROUPES D'INTÉGRATIONS ── */}
      {INTEGRATIONS.map((group, groupIndex) => (
        <section key={group.group} className="space-y-4 animate-in fade-in" style={{ animationDelay: `${groupIndex * 100}ms`}}>
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2">
            {group.group}
          </h2>

          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] divide-y divide-white/20">
            {/* Subtle Glow inside the card */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gray-500/5 rounded-full blur-3xl -z-10 pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
            
            {group.items.map(item => (
              <IntegrationItem
                key={item.key}
                configKey={item.key}
                label={item.label}
                description={item.description}
                docsUrl={item.docsUrl}
                icon={item.icon ?? '🔑'}
                maskedValue={maskValue(configMap[item.key] ?? '')}
                isConfigured={!!configMap[item.key]}
              />
            ))}
          </div>
        </section>
      ))}

      {/* ── NOTE SÉCURITÉ ── */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-3xl p-6 flex items-start gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-200/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
        <span className="text-2xl flex-shrink-0 p-2 bg-amber-100 rounded-2xl shadow-sm border border-amber-200/50">⚠️</span>
        <div className="relative z-10 pt-1">
          <p className="text-sm font-bold text-amber-900 leading-snug">
            Les clés sont stockées dans la base de données (PlatformConfig).
            Ne partagez jamais ces clés — elles donnent accès aux services de paiement.
          </p>
          <p className="text-[11px] font-semibold text-amber-700/80 mt-2">
            Pour la production, nous recommandons de définir les clés dans les variables d&apos;environnement Vercel/Railway plutôt qu&apos;en base.
          </p>
        </div>
      </div>

    </div>
  )
}
