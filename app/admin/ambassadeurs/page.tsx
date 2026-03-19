import { createAdminClient } from '@/lib/supabase/admin'
import AmbassadeursClient from './AmbassadeursClient'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface AmbassadorWithStore {
  id:              string
  code:            string
  is_active:       boolean
  commission_rate: number
  created_at:      string
  vendor_id:       string
  contract_accepted:    boolean
  contract_accepted_at: string | null
  Store:           { name: string; slug: string; kyc_status: string | null; User: { email: string; name: string | null } | null } | null
}

interface PlatformConfigRow {
  key:   string
  value: string
}

// ----------------------------------------------------------------
// PAGE AMBASSADEURS ADMIN — Server Component
// Charte PDV Pro · 2 onglets (liste + règles)
// ----------------------------------------------------------------
export default async function AdminAmbassadeursPage() {
  const supabase = createAdminClient()

  // Récupérer tous les ambassadeurs (vendeurs avec badge ambassadeur)
  const { data: ambassadeurs } = await supabase
    .from('Ambassador')
    .select(`
      id, code, is_active, commission_rate, created_at,
      vendor_id, contract_accepted, contract_accepted_at,
      Store(name, slug, kyc_status, User(email, name))
    `)
    .order('created_at', { ascending: false })

  // Récupérer les règles du programme ambassadeur depuis PlatformConfig
  const { data: configs } = await supabase
    .from('PlatformConfig')
    .select('key, value')
    .in('key', [
      'ambassador_commission_rate',
      'ambassador_validity_months',
      'ambassador_max_referrals',
      'ambassador_program_active',
    ])

  // Transformer la liste en objet key→value
  const configMap: Record<string, string> = {}
  for (const row of (configs as PlatformConfigRow[]) ?? []) {
    configMap[row.key] = row.value
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── EN-TÊTE ── */}
      <header>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Gestion des Ambassadeurs</h1>
            <p className="text-gray-400 text-sm mt-1">
              Gérez le programme de parrainage vendeurs PDV Pro.
            </p>
          </div>
          <div className="px-3 py-1 bg-[#0F7A60]/10 border border-[#0F7A60]/20 rounded-full text-xs font-bold text-[#0F7A60] uppercase tracking-widest">
            🤝 Programme Ambassadeur
          </div>
        </div>
      </header>

      {/* Composant client pour les 2 onglets */}
      <AmbassadeursClient
        ambassadeurs={(ambassadeurs as unknown as AmbassadorWithStore[]) ?? []}
        initialConfig={configMap}
      />
    </div>
  )
}
