import { GlobalHomeButton } from '@/components/shared/GlobalHomeButton'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientSidebar } from '@/components/client/ClientSidebar'
import { ClientMobileBottomNav } from '@/components/client/ClientMobileBottomNav'

export const metadata = {
  title: 'Espace Client | Yayyam',
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
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      <ClientSidebar
        userName={userName}
        avatarUrl={avatarUrl}
      />

      <main className="relative flex-1 min-w-0 h-[100dvh] bg-gray-50 font-sans overflow-y-auto overflow-x-hidden">
        <GlobalHomeButton />

        {/* 🌟 UNIVERSAL MESH BACKGROUND 🌟 */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-300/10 blur-[130px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:10s]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-teal-300/10 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:12s] [animation-delay:2s]" />
        </div>
        
        <div className="relative z-10 pt-14 lg:pt-0 pb-24 lg:pb-12 w-full max-w-[2000px] mx-auto px-3 lg:px-8 xl:px-10 min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar Mobile */}
      <ClientMobileBottomNav
        userName={userName}
        avatarUrl={avatarUrl}
      />
    </div>
  )
}
