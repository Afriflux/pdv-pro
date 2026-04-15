import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PaymentLinksClient from './PaymentLinksClient'

// --- Types ---
interface PLink {
  id: string
  title: string
  description: string | null
  amount: number
  currency: string
  is_active: boolean
  created_at: string
}

export default async function PaymentLinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, name: true, slug: true }
  })

  if (!store) {
    return (
      <div className="p-8 text-center text-slate-500">
        Veuillez configurer votre boutique avant d'accéder à ce paramètre.
      </div>
    )
  }

  const links = await prisma.paymentLink.findMany({
    where: { store_id: store.id },
    orderBy: { created_at: 'desc' }
  })

  const serialized: PLink[] = links.map(l => ({
    id: l.id,
    title: l.title,
    description: l.description,
    amount: l.amount,
    currency: l.currency,
    is_active: l.is_active,
    created_at: l.created_at.toISOString()
  }))

  return (
    <div className="animate-in fade-in duration-500">
      <PaymentLinksClient storeId={store.id} links={serialized} storeSlug={store.slug} />
    </div>
  )
}
