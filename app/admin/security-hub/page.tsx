import { createAdminClient } from '@/lib/supabase/admin'
import SecuritySection from '../settings/SecuritySection'
import AuditLogTable, { AuditLog } from '../settings/AuditLogTable'
import { ShieldCheck, Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SecurityHubPage() {
  const supabaseAdmin = createAdminClient()
  
  // Récupérer les 50 derniers logs
  const { data } = await supabaseAdmin
    .from('AdminLog')
    .select('id, action, created_at, target_type, target_id, details, User(name, email)')
    .order('created_at', { ascending: false })
    .limit(50)
    
  const auditLogs = (data as unknown as AuditLog[]) || []

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      
      {/* ── HEADER FULL-BLEED (COVER PREMIUM) ── */}
      <header className="w-full bg-gradient-to-r from-[#4c0519] to-[#881337] pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-rose-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-rose-300 shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <Lock className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Sécurité & Audit</h1>
              <p className="text-rose-100/90 font-medium text-sm mt-1 max-w-xl">
                Supervisez la sécurité de bout en bout et tracez les actions globales effectuées sur le système.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── ZONE DE CONTENU ── */}
      <div className="flex flex-col items-start gap-6 w-full max-w-7xl mx-auto relative z-20 px-6 lg:px-10 -mt-16 pb-20">
        <div className="w-full bg-white rounded-3xl shadow-xl shadow-black-[0.02] border border-gray-100 p-6 lg:p-8 space-y-8">
           <SecuritySection />
           <div className="border-t border-gray-100 pt-8 mt-8">
             <AuditLogTable logs={auditLogs} />
           </div>
        </div>
      </div>

    </div>
  )
}
