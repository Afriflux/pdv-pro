import { getAdminWithdrawals } from '@/lib/admin/adminActions'
import AdminWithdrawalsClient from './AdminWithdrawalsClient'

export const dynamic = 'force-dynamic'

export default async function AdminWithdrawalsPage() {
  const withdrawals = await getAdminWithdrawals()

  // Calculs rapides pour l'entête
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length
  const totalCompleted = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0)

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">Retraits Marchands</h1>
             {pendingCount > 0 && (
               <span className="flex h-6 w-6 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-6 w-6 bg-orange-500 text-white text-xs items-center justify-center font-bold">
                   {pendingCount}
                 </span>
               </span>
             )}
          </div>
          <p className="text-gray-500 mt-2">Validez, refusez et suivez l&apos;historique des transferts vers les vendeurs.</p>
        </div>

        <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl flex items-center justify-between gap-8 shadow-lg">
           <div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Déboursé</p>
             <p className="text-2xl font-black">{totalCompleted.toLocaleString('fr-FR')} F</p>
           </div>
           <div className="text-green-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
           </div>
        </div>
      </div>

      <AdminWithdrawalsClient initialWithdrawals={withdrawals} />
    </div>
  )
}
