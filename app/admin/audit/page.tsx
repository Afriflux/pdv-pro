import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { History, AlertTriangle } from 'lucide-react'
import AdminAuditTable from '@/components/admin/AdminAuditTable'

// ─── PAGE: /admin/audit ──────────────────────────────────────────────
export default async function AuditCenterPage({
  searchParams
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const supabaseAdmin = createAdminClient()

  // Filtres
  const actionFilter = searchParams.action ?? 'ALL'
  const periodFilter = searchParams.period ?? 'ALL'
  const qStr = searchParams.q ?? ''
  
  const pageStr = searchParams.page ?? '1'
  const currentPage = Math.max(1, parseInt(pageStr, 10))
  const pageSize = 50
  const offset = (currentPage - 1) * pageSize

  // Requête de base
  let query = supabaseAdmin
    .from('AdminLog')
    .select('id, admin_id, action, target_type, target_id, details, created_at, admin:admin_id ( email, role )', { count: 'exact' })

  if (actionFilter !== 'ALL') {
    query = query.eq('action', actionFilter)
  }

  if (qStr) {
    query = query.or(`target_id.ilike.%${qStr}%,details->>reason.ilike.%${qStr}%`)
  }

  if (periodFilter !== 'ALL') {
    const now = new Date()
    const fromDate = new Date()
    if (periodFilter === 'TODAY') {
      fromDate.setHours(0, 0, 0, 0)
    } else if (periodFilter === '7DAYS') {
      fromDate.setDate(now.getDate() - 7)
    } else if (periodFilter === '30DAYS') {
      fromDate.setDate(now.getDate() - 30)
    }
    query = query.gte('created_at', fromDate.toISOString())
  }

  // Tri & Pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  const { data: rawLogs, count } = await query

  const logs = (rawLogs as any[])?.map(log => ({
    ...log,
    admin: Array.isArray(log.admin) ? log.admin[0] : log.admin
  })) || []

  let displayLogs = logs
  let displayCount = count ?? 0
  let isDemo = false

  if (count === 0) {
    isDemo = true
    const demoLogs = [
      {
        id: 'demo-1',
        admin_id: '1',
        action: 'APPROVE_KYC',
        target_type: 'vendor',
        target_id: 'VEND-001',
        details: { reason: "Dossier conforme, carte d'identité vérifiée avec succès." },
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        admin: { email: 'sultan@afriflux.com', role: 'super_admin' }
      },
      {
        id: 'demo-2',
        admin_id: '2',
        action: 'SUSPEND_VENDOR',
        target_type: 'vendor',
        target_id: 'VEND-089',
        details: { reason: "Suspension temporaire immédiate pour fraude répétée et litiges non-résolus." },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        admin: { email: 'support@pdvpro.sn', role: 'gestionnaire' }
      },
      {
        id: 'demo-3',
        admin_id: '1',
        action: 'EDIT_VENDOR_INFO',
        target_type: 'vendor',
        target_id: 'VEND-102',
        details: { reason: "Mise à jour du RIB vendeur suite à la demande téléphonique du client." },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        admin: { email: 'sultan@afriflux.com', role: 'super_admin' }
      },
      {
        id: 'demo-4',
        admin_id: '3',
        action: 'REJECT_KYC',
        target_type: 'vendor',
        target_id: 'VEND-002',
        details: { reason: "La pièce d'identité est illisible et floue (photo abîmée)." },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        admin: { email: 'kyc@pdvpro.sn', role: 'support' }
      },
      {
        id: 'demo-5',
        admin_id: '1',
        action: 'ACTIVATE_VENDOR',
        target_type: 'vendor',
        target_id: 'VEND-089',
        details: { reason: "Litige financier résolu après médiation, boutique réactivée en mode surveillé." },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        admin: { email: 'sultan@afriflux.com', role: 'super_admin' }
      }
    ]

    displayLogs = demoLogs.filter(log => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false
      
      if (qStr) {
        const searchLower = qStr.toLowerCase()
        const matchTarget = log.target_id.toLowerCase().includes(searchLower)
        const matchReason = log.details.reason.toLowerCase().includes(searchLower)
        if (!matchTarget && !matchReason) return false
      }

      if (periodFilter !== 'ALL') {
        const now = new Date()
        let fromDate = new Date()
        if (periodFilter === 'TODAY') fromDate.setHours(0, 0, 0, 0)
        else if (periodFilter === '7DAYS') fromDate.setDate(now.getDate() - 7)
        else if (periodFilter === '30DAYS') fromDate.setDate(now.getDate() - 30)
        
        if (new Date(log.created_at) < fromDate) return false
      }

      return true
    })
    
    displayCount = displayLogs.length
  }

  const totalPages = displayCount ? Math.ceil(displayCount / pageSize) : 1

  return (
    <div className="flex-1 w-full bg-[#FAFAF7] min-h-screen flex flex-col pt-0 animate-in fade-in duration-500">
      
      {/* ── HEADER COVER IMMERSIF (Full Bleed) ── */}
      <header className="relative w-full bg-gradient-to-r from-[#0D5C4A] via-[#0F7A60] to-teal-700 pt-8 pb-32 px-6 lg:px-10 overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gray-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10">
              <History className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Centre d'Audit</h1>
              <p className="text-gray-300 font-medium text-sm mt-1 max-w-lg">
                Traçabilité complète des actions administratives (suspensions, validations KYC, etc.) pour la gouvernance de la plateforme.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENU (Overlapping) ── */}
      <div className="w-full px-6 lg:px-10 -mt-16 relative z-20 pb-20">
        
        {isDemo && (
          <div className="mb-6 bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-900">MODE DÉMO ACTIVÉ - BASE D'AUDIT VIERGE</h3>
              <p className="text-sm text-amber-800/80 mt-1.5 font-medium leading-relaxed">
                Le système d'Audit intelligent détecte que la base de données ne contient aucun log administratif. 
                Afin de visualiser le Design System de manière exhaustive, 5 plaintes fictives hautes-performances ont été injectées.
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 bg-transparent lg:bg-white rounded-3xl lg:shadow-[0_8px_30px_rgba(0,0,0,0.04)] lg:border border-gray-100 relative overflow-hidden">
          <AdminAuditTable 
            logs={displayLogs} 
            count={displayCount}
            totalPages={totalPages}
            currentPage={currentPage}
            currentAction={actionFilter}
            period={periodFilter}
            q={qStr}
          />
        </div>

      </div>
    </div>
  )
}
