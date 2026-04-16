import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SmsRechargePortal } from '@/components/dashboard/SmsRechargePortal'

export const metadata = {
  title: 'Rechargement SMS | Yayyam Pro',
  description: 'Gérez vos crédits SMS pour vos campagnes marketing.'
}

export default async function SmsDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get Store
  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    include: {
      sms_credits: true
    }
  })

  // We restrict this specifically to store owners for now
  if (!store) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        L'achat de crédits SMS est actuellement réservé aux Boutiques.
      </div>
    )
  }

  // Ensure SmsCredit record exists
  const credits = store.sms_credits?.credits || 0

  if (!store.sms_credits) {
    await prisma.smsCredit.create({
      data: {
        store_id: store.id,
        credits: 0,
        used: 0
      }
    })
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <SmsRechargePortal currentCredits={credits} storeId={store.id} />
    </div>
  )
}
