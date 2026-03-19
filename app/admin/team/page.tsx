import { getAdminTeam } from '@/lib/admin/adminActions'
import AdminTeamClient from './AdminTeamClient'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (user.user_metadata?.role !== 'super_admin') {
    return (
      <div className="p-10 text-center space-y-4">
        <h1 className="text-2xl font-black text-gray-900">Accès Refusé</h1>
        <p className="text-gray-500">Seul le fondateur (Super Admin) peut gérer l&apos;équipe de la plateforme.</p>
      </div>
    )
  }

  const team = await getAdminTeam()
  
  // Pour le formulaire d'ajout, on va chercher tous les users "normaux" (acheteurs/vendeurs)
  const allUsers = await supabase
    .from('User')
    .select('id, name, email, phone')
    .not('role', 'in', '("super_admin","gestionnaire")')
    .limit(100)
    
  // On passe la liste pour permettre une auto-complétion simple
  const eligibleUsers = allUsers.data || []

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff & Équipe</h1>
        <p className="text-gray-500 mt-2">Déléguez la gestion du helpdesk et des retraits à vos gestionnaires.</p>
      </div>

      <AdminTeamClient initialTeam={team} eligibleUsers={eligibleUsers} />
    </div>
  )
}
