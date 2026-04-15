import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import HelpdeskClient from './HelpdeskClient'

export default async function HelpdeskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, name: true }
  })

  if (!store) {
    return (
      <div className="p-8 text-center text-slate-500">
        Veuillez configurer votre boutique avant d'accéder au Helpdesk.
      </div>
    )
  }

  const complaints = await prisma.complaint.findMany({
    where: { store_id: store.id },
    include: {
      Product: { select: { name: true, images: true } }
    },
    orderBy: { created_at: 'desc' }
  })

  // Serialization for Client components
  const serialized = complaints.map(c => ({
    id: c.id,
    type: c.type,
    description: c.description,
    status: c.status,
    evidence_url: c.evidence_url,
    admin_notes: c.admin_notes,
    created_at: c.created_at?.toISOString() || '',
    updated_at: c.updated_at?.toISOString() || '',
    product: c.Product ? { name: c.Product.name, image: c.Product.images[0] || null } : null
  }))

  return (
    <div className="animate-in fade-in duration-500">
      <HelpdeskClient storeId={store.id} complaints={serialized} />
    </div>
  )
}
