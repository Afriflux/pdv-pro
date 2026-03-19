import { getAdminReports } from '@/lib/admin/adminActions'
import AdminReportsClient from './AdminReportsClient'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const reports = await getAdminReports()

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
         <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Signalements & Litiges</h1>
            {reports.filter(r => r.status === 'open').length > 0 && (
              <span className="flex h-6 w-6 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-white text-xs items-center justify-center font-bold">
                  {reports.filter(r => r.status === 'open').length}
                </span>
              </span>
            )}
         </div>
        <p className="text-gray-500 mt-2">Médiation entre acheteurs et vendeurs. Gérez les remboursements et classez les requêtes.</p>
      </div>

      <AdminReportsClient initialReports={reports} />
    </div>
  )
}
