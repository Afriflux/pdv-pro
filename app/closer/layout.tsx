import { GlobalHomeButton } from '@/components/shared/GlobalHomeButton'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CloserSidebar } from '@/components/closer/CloserSidebar'
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
    <div className="flex min-h-[100dvh] bg-[#FAFAF7] w-full overflow-hidden">
      {/* Sidebar Responsive Dynamique */}
      <CloserSidebar storeName="Espace Closer" userName={userName} avatarUrl={avatarUrl} />
      
      {/* Contenu Principal */}
      <main className="relative flex-1 bg-[#FAFAF7] min-w-0 min-h-[100dvh] overflow-x-hidden relative">
        <GlobalHomeButton />
        <div className="pt-14 lg:pt-0 pb-12 w-full max-w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Le Coach IA Ultime Omniprésent */}
      <GlobalCoach />
    </div>
  )
}
