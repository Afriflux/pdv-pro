import { GlobalHomeButton } from '@/components/shared/GlobalHomeButton'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientSidebar } from '@/components/client/ClientSidebar'

export const metadata = {
  title: 'Espace Client | PDV Pro',
}

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  // Récupérer le Profil
  const { data: userProfile } = await supabaseAdmin
    .from('User')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userProfile) {
    redirect('/login')
  }

  // Vérifier le rôle
  if (userProfile.role !== 'acheteur' && userProfile.role !== 'client') {
    if (userProfile.role === 'affilie') redirect('/portal')
    redirect('/dashboard')
  }

  const userName = userProfile.name || user.user_metadata?.name || 'Acheteur'
  const avatarUrl = userProfile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null

  return (
    <div className="flex min-h-screen bg-[#FAFAF7]">
      <ClientSidebar
        userName={userName}
        avatarUrl={avatarUrl}
      />

      <main className="relative flex-1 min-w-0 min-h-screen bg-[#FAFAF7] font-sans relative overflow-x-hidden">
        <GlobalHomeButton />
        {/* Ambient Glows */}
        <div className="absolute top-0 left-10 w-[600px] h-[600px] bg-[#0F7A60]/[0.03] blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute top-[20%] right-0 w-[500px] h-[500px] bg-[#C9A84C]/[0.03] blur-[120px] rounded-full pointer-events-none z-0" />
        
        <div className="pt-14 lg:pt-0 pb-12 h-full relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
