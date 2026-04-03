import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SettingsClient from './SettingsClient'

export default async function ClientSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin.from('User').select('*').eq('id', user.id).single()

  const addresses = await prisma.deliveryAddress.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' }
  })

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)]">
      {/* 🌟 MESH BACKGROUND DYNAMIQUE COSMÉTIQUE (Standard Dashboard) 🌟 */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAFAFA]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 blur-[130px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/15 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-300/10 blur-[100px] pointer-events-none mix-blend-multiply" />
      </div>

      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <SettingsClient profile={profile} user={user} addresses={addresses} />
      </div>
    </div>
  )
}
