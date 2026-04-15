import { getAdminTeam } from '@/lib/admin/adminActions'
import AdminTeamClient from './AdminTeamClient'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Auto-upgrade du founder manquants
  if (user.email === 'djeylanidjitte@gmail.com' && user.user_metadata?.role !== 'super_admin') {
    await supabase.from('User').update({ role: 'super_admin' }).eq('email', 'djeylanidjitte@gmail.com')
    await supabase.auth.admin.updateUserById(user.id, { user_metadata: { role: 'super_admin' } }).catch(() => {})
  }

  if (user.user_metadata?.role !== 'super_admin' && user.email !== 'djeylanidjitte@gmail.com') {
    return (
      <div className="p-16 text-center space-y-4 max-w-2xl mx-auto mt-20 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-3xl -z-10 pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/50">
          <span className="text-4xl">🛡️</span>
          <div className="absolute -inset-4 bg-red-400/20 rounded-full blur-xl -z-10" />
        </div>
        <h1 className="text-2xl font-black text-[#1A1A1A] relative z-10">Accès Restreint</h1>
        <p className="text-gray-500 relative z-10 font-medium">Seul le fondateur (Super Admin) peut gérer l&apos;équipe de la plateforme.</p>
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 text-[#0F7A60] shadow-inner">
              <span className="text-xl">👩‍💼</span>
            </div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Staff & Équipe</h1>
          </div>
          <p className="text-sm text-gray-500 ml-14 font-medium">Déléguez la gestion du helpdesk et des retraits à vos gestionnaires.</p>
        </div>
      </header>

      <AdminTeamClient initialTeam={team} eligibleUsers={eligibleUsers} />
    </div>
  )
}
