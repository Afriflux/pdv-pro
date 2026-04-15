import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import QuotesClient from './QuotesClient'

interface QuoteItem {
  name: string
  quantity: number
  unit_price: number
}

interface QuoteData {
  id: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  items: QuoteItem[]
  total_amount: number
  status: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

export default async function QuotesPage() {
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
        Veuillez configurer votre boutique avant d'accéder aux devis.
      </div>
    )
  }

  const quotes = await prisma.quote.findMany({
    where: { store_id: store.id },
    orderBy: { created_at: 'desc' }
  })

  const serialized: QuoteData[] = quotes.map(q => ({
    id: q.id,
    client_name: q.client_name,
    client_email: q.client_email,
    client_phone: q.client_phone,
    items: q.items as unknown as QuoteItem[],
    total_amount: q.total_amount,
    status: q.status,
    expires_at: q.expires_at?.toISOString() || null,
    created_at: q.created_at.toISOString(),
    updated_at: q.updated_at.toISOString()
  }))

  return (
    <div className="animate-in fade-in duration-500">
      <QuotesClient storeId={store.id} storeSlug={store.slug} quotes={serialized} />
    </div>
  )
}
