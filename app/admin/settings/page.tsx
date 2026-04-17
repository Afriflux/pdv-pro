import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { UserCircle, Settings } from 'lucide-react'
import ProfileSection from './ProfileSection'
import PlatformSection from './PlatformSection'

export const dynamic = 'force-dynamic'

interface AdminUserProfile {
  id:         string
  name:       string | null
  email:      string
  avatar_url: string | null
  role:       string
}

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()

  // Données profil admin connecté
  const { data: adminUser } = await supabaseAdmin
    .from('User')
    .select('id, name, email, avatar_url, role')
    .eq('id', user.id)
    .single<AdminUserProfile>()

  // Paramètres plateforme (table clé/valeur)
  const { data: configs } = await supabaseAdmin
    .from('PlatformConfig')
    .select('key, value')

  const configMap: Record<string, string> = {}
  for (const row of (configs || [])) {
    configMap[row.key] = row.value
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div>
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gray-100 border border-gray-200 text-gray-700 mb-4 shadow-sm">
          <UserCircle className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">Espace Compte</span>
        </div>
        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Mon Profil</h1>
        <p className="text-gray-500 font-medium mt-2 max-w-2xl">
          Gérez vos informations personnelles et les paramètres généraux de l'administration.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* -- BLOC PROFIL (Désormais pleine largeur) -- */}
        <div className="w-full">
          <ProfileSection
            userId={adminUser?.id ?? user.id}
            initialName={adminUser?.name ?? ''}
            email={adminUser?.email ?? user.email ?? ''}
            avatarUrl={adminUser?.avatar_url ?? null}
            role={adminUser?.role ?? 'support'}
          />
        </div>

        {/* -- BLOC CONTACT & LÉGAL -- */}
        <div className="w-full">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-8 overflow-hidden relative">
             <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
               <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                 <Settings className="w-6 h-6 text-gray-500" />
               </div>
               <div>
                  <h3 className="font-black text-gray-900 text-xl tracking-tight">Informations Plateforme</h3>
                  <p className="text-[14px] font-medium text-gray-500 mt-1">Contact d'urgence & Légal.</p>
               </div>
             </div>
             
             <div className="relative z-10">
                <PlatformSection 
                  initialConfig={configMap} 
                  allowedTabs={['general', 'legal', 'communications']} 
                />
             </div>
          </div>
        </div>

      </div>
      
    </div>
  )
}

