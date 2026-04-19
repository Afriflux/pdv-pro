import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AiProductClient from './AiProductClient'
// Force TS server reload

export const dynamic = 'force-dynamic'

export default async function AiProductGeneratorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, ai_credits: true, name: true }
  })

  if (!store) redirect('/onboarding')

  // Wallet
  const wallet = await prisma.wallet.findUnique({
    where: { vendor_id: store.id },
    select: { balance: true, total_earned: true }
  }) || { balance: 0, total_earned: 0 }

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <AiProductClient 
          storeId={store.id}
          storeName={store.name}
          dbCredits={store.ai_credits}
          wallet={wallet}
        />
      </div>
    </main>
  )
}
