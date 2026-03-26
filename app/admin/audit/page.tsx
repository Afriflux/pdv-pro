import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { History } from 'lucide-react'
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

  // Tri & Pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  const { data: rawLogs, count } = await query

  const logs = (rawLogs as any[])?.map(log => ({
    ...log,
    admin: Array.isArray(log.admin) ? log.admin[0] : log.admin
  })) || []

  const totalPages = count ? Math.ceil(count / pageSize) : 1

  return (
    <div className="flex-1 w-full bg-[#FAFAF7] min-h-screen flex flex-col pt-0 animate-in fade-in duration-500">
      
      {/* ── HEADER COVER IMMERSIF (Full Bleed) ── */}
      <header className="relative w-full bg-gradient-to-r from-gray-900 to-gray-800 pt-8 pb-32 px-6 lg:px-10 overflow-hidden shrink-0">
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
        
        <div className="flex-1 min-w-0 bg-transparent lg:bg-white rounded-3xl lg:shadow-[0_8px_30px_rgba(0,0,0,0.04)] lg:border border-gray-100 relative overflow-hidden">
          <AdminAuditTable 
            logs={logs} 
            count={count ?? 0}
            totalPages={totalPages}
            currentPage={currentPage}
            currentAction={actionFilter}
          />
        </div>

      </div>
    </div>
  )
}
