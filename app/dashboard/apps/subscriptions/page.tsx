import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SubscriptionsControls from './SubscriptionsControls'

export const metadata = {
  title: "SaaS & Abonnements | Yayyam",
}

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id }
  })

  if (!store) redirect('/dashboard')

  // Fetch all orders marked as subscriptions that are not cancelled
  const subs = await prisma.order.findMany({
    where: { 
      store_id: store.id,
      is_subscription: true,
      status: { not: 'cancelled' } as any
    },
    include: {
      product: {
        select: { name: true, recurring_interval: true }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  return (
    <div className="w-full flex flex-col pt-4 pb-20">
      {/* HEADER DE LA PAGE */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/dashboard/apps" 
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">SaaS & Abonnements</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Revenus Mensuels Récurrents, Box par abonnement et rentes.
          </p>
        </div>
      </div>

      <SubscriptionsControls subscriptions={subs as any} />
    </div>
  )
}
