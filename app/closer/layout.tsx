import { GlobalHomeButton } from '@/components/shared/GlobalHomeButton'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CloserSidebar } from '@/components/closer/CloserSidebar'
import { CloserMobileBottomNav } from '@/components/closer/CloserMobileBottomNav'
import GlobalCoach from '@/components/dashboard/GlobalCoach'

export default async function CloserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  const { data: userProfile } = await supabaseAdmin
    .from('User')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single()

  const userName = userProfile?.name ?? (user.user_metadata?.name as string) ?? 'Closer'
  const avatarUrl = userProfile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? (user.user_metadata?.picture as string) ?? null

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      {/* Sidebar Responsive Dynamique */}
      <CloserSidebar storeName="Espace Closer" userName={userName} avatarUrl={avatarUrl} />
      
      {/* Contenu Principal */}
      <main className="relative flex-1 bg-gray-50 min-w-0 h-[100dvh] overflow-y-auto overflow-x-hidden">
        <GlobalHomeButton />

        {/* 🌟 UNIVERSAL MESH BACKGROUND 🌟 */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-300/10 blur-[130px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:10s]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-teal-300/10 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:12s] [animation-delay:2s]" />
        </div>

        <div className="relative z-10 pt-14 lg:pt-4 pb-24 lg:pb-12 w-full max-w-[2000px] mx-auto px-3 lg:px-8 xl:px-10 min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar Mobile */}
      <CloserMobileBottomNav
        userName={userName}
        storeName="Espace Closer"
        avatarUrl={avatarUrl}
      />

      {/* Le Coach IA Ultime Omniprésent */}
      <GlobalCoach />
    </div>
  )
}
