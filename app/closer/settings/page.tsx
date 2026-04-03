import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import CloserSettingsClient from './CloserSettingsClient'

export default async function CloserSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin.from('User').select('*').eq('id', user.id).single()

  return (
    <div className="w-full relative min-h-screen px-4 md:px-8 py-8 md:py-10">
      <header className="mb-0">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Paramètres du Compte</h1>
        <p className="text-gray-500 font-medium">Gérez votre profil public et vos préférences de paiement.</p>
      </header>

      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <CloserSettingsClient profile={profile} user={user} />
      </div>
    </div>
  )
}
