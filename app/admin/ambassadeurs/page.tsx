import { createAdminClient } from '@/lib/supabase/admin'
import { Handshake } from 'lucide-react'
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
  total_referred:  number
  total_qualified: number
  total_earned:    number
  balance:         number
  Store:           { name: string; slug: string; kyc_status: string | null; User: { email: string; name: string | null } | null } | null
}

interface PlatformConfigRow {
  key:   string
  value: string
}

// ----------------------------------------------------------------
// PAGE AMBASSADEURS ADMIN — Server Component
// ----------------------------------------------------------------
export default async function AdminAmbassadeursPage() {
  const supabase = createAdminClient()

  // Récupérer tous les ambassadeurs (vendeurs avec badge ambassadeur)
  const { data: ambassadeurs } = await supabase
    .from('Ambassador')
    .select(`
      id, code, is_active, commission_rate, created_at,
      vendor_id, contract_accepted, contract_accepted_at,
      total_referred, total_qualified, total_earned, balance,
      Store(name, slug, kyc_status, User(email, name))
    `)
    .order('created_at', { ascending: false })

  // Récupérer les règles du programme ambassadeur depuis PlatformConfig
  const { data: configs } = await supabase
    .from('PlatformConfig')
    .select('key, value')
    .in('key', [
      'ambassador_commission_rate',
      'ambassador_commission_fixed',
      'ambassador_validity_months',
      'ambassador_min_revenue',
      'ambassador_observation_days',
      'ambassador_max_referrals',
      'ambassador_program_active',
    ])

  // Transformer la liste en objet key→value
  const configMap: Record<string, string> = {}
  for (const row of (configs as PlatformConfigRow[]) ?? []) {
    configMap[row.key] = row.value
  }

  return (
    <div className="flex-1 w-full bg-[#FAFAF7] min-h-screen flex flex-col pt-0 animate-in fade-in duration-500">
      
      {/* ── HEADER COVER IMMERSIF (Full Bleed) ── */}
      <header className="relative w-full bg-gradient-to-r from-[#0D5C4A] to-[#0F7A60] pt-8 pb-36 px-6 lg:px-10 overflow-hidden shrink-0">
        {/* Noise overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-900/30 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10 shrink-0">
              <Handshake className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="px-3 py-1 bg-white/20 text-white backdrop-blur-md border border-white/30 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                  🤝 Programme Affiliation
                </span>
                {configMap['ambassador_program_active'] === 'true' ? (
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#A7F3D0]">
                    <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse"></span>
                    Actif
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    En pause
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Ambassadeurs</h1>
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENU (Overlapping Client Component) ── */}
      <div className="w-full px-6 lg:px-10 -mt-20 relative z-20 pb-20">
        <AmbassadeursClient
          ambassadeurs={(ambassadeurs as unknown as AmbassadorWithStore[]) ?? []}
          initialConfig={configMap}
        />
      </div>
    </div>
  )
}
