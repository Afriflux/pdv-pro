import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function PortalSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  const { data: userProfile } = await supabaseAdmin
    .from('User')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: affiliate } = await supabaseAdmin
    .from('Affiliate')
    .select('id, telegram_chat_id, contract_accepted_at')
    .eq('user_id', user.id)
    .single()


  if (!userProfile) {
    redirect('/login')
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 space-y-8 animate-fade-in pb-12 pt-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-black text-ink tracking-tight mb-2">Paramètres du Compte</h1>
        <p className="text-slate text-sm sm:text-base">
          Gérez vos informations personnelles et configurez votre profil d'affilié.
        </p>
      </div>

      <SettingsClient 
        userProfile={userProfile} 
        authUser={user} 
        affiliateId={affiliate?.id}
        telegramChatId={affiliate?.telegram_chat_id}
        contractAcceptedAt={affiliate?.contract_accepted_at}
      />
    </div>
  )
}
