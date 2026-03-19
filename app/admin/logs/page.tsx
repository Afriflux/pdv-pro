import { getAdminLogs } from '@/lib/admin/adminActions'
import AdminLogsClient from './AdminLogsClient'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Seul le SUPER_ADMIN peut voir les logs complets
  if (user.user_metadata?.role !== 'super_admin') {
    return (
      <div className="p-10 text-center space-y-4">
        <h1 className="text-2xl font-black text-gray-900">Accès Refusé</h1>
        <p className="text-gray-500">L&apos;historique complet de sécurité est restreint au Super Administrateur.</p>
      </div>
    )
  }

  // On demande 500 logs maximum pour éviter d'exploser le navigateur
  const logs = await getAdminLogs(500)

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Journaux d&apos;Audit (Logs)</h1>
        <p className="text-gray-500 mt-2">Traçabilité complète des actions effectuées par l&apos;équipe d&apos;administration PDV Pro.</p>
      </div>

      <AdminLogsClient initialLogs={logs} />
    </div>
  )
}
