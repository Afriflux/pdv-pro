import { createAdminClient } from '@/lib/supabase/admin'
import CronButton from '../settings/CronButton'
import MaintenanceSwitch from '../settings/MaintenanceSwitch'
import { ServerCog } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const supabaseAdmin = createAdminClient()
  const { data: configs } = await supabaseAdmin.from('PlatformConfig').select('key, value')
  
  const configMap: Record<string, string> = {}
  for (const row of (configs || [])) {
    configMap[row.key] = row.value
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      
      {/* ── HEADER FULL-BLEED (COVER PREMIUM) ── */}
      <header className="w-full bg-gradient-to-r from-[#0D5C4A] to-[#0A4138] pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-teal-300 shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <ServerCog className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Actions & Crons (Maintenance)</h1>
              <p className="text-teal-100/90 font-medium text-sm mt-1 max-w-xl">
                Déclenchez manuellement les tâches en arrière-plan ou mettez Yayyam en mode maintenance globale.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── ZONE DE CONTENU ── */}
      <div className="flex flex-col items-start gap-6 w-full max-w-7xl mx-auto relative z-20 px-6 lg:px-10 -mt-16 pb-20">
        <div className="w-full bg-white rounded-3xl shadow-xl shadow-black-[0.02] border border-gray-100 p-6 lg:p-8 space-y-6">
          
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
          
          <div className="border-t border-gray-100 pt-6">
            <MaintenanceSwitch
              initialActive={configMap['maintenance_active']}
              initialMessage={configMap['maintenance_message']}
            />
          </div>

        </div>
      </div>

    </div>
  )
}
