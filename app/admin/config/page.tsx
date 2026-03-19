import { getPlatformConfig } from '@/lib/admin/adminActions'
import AdminConfigClient from './AdminConfigClient'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Seul le SUPER_ADMIN peut modifier la configuration financière
  if (user.user_metadata?.role !== 'super_admin') {
    return (
      <div className="p-10 text-center space-y-4">
        <h1 className="text-2xl font-black text-gray-900">Accès Refusé</h1>
        <p className="text-gray-500">Seul le Super Administrateur principal peut modifier la configuration critique de PDV Pro.</p>
      </div>
    )
  }

  const config = await getPlatformConfig()

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configuration Plateforme</h1>
        <p className="text-gray-500 mt-2">Gérez les frais, taux de commission par défaut et paramètres financiers critiques.</p>
      </div>

      <AdminConfigClient initialConfig={config} />
    </div>
  )
}
