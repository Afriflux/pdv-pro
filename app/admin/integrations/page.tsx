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
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-[#0F7A60]/10 text-[#0F7A60]">
            <Puzzle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Intégrations &amp; API</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Gérez les clés API des services tiers directement depuis cette interface.
          </p>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            configuredCount === allItems.length
              ? 'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20'
              : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}>
            {configuredCount}/{allItems.length} configurées
          </span>
        </div>
      </header>

      {/* ── GROUPES D'INTÉGRATIONS ── */}
      {INTEGRATIONS.map(group => (
        <section key={group.group} className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
            {group.group}
          </h2>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
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
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">⚠️</span>
        <div>
          <p className="text-xs font-bold text-amber-800">
            Les clés sont stockées dans la base de données (PlatformConfig).
            Ne partagez jamais ces clés — elles donnent accès aux services de paiement.
          </p>
          <p className="text-xs text-amber-700 mt-1 font-medium">
            Pour la production, nous recommandons de définir les clés dans les variables d&apos;environnement Vercel/Railway plutôt qu&apos;en base.
          </p>
        </div>
      </div>

    </div>
  )
}
