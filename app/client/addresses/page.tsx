import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AddressesClient from './AddressesClient'

export const metadata = {
  title: 'Mes Adresses de Livraison | Yayyam',
}

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('User')
    .select('name, phone, role')
    .eq('id', user.id)
    .single<{ name: string, phone: string | null, role: string }>()

  if (!profile || (profile.role !== 'acheteur' && profile.role !== 'client')) {
    redirect('/dashboard')
  }

  const addresses = await prisma.deliveryAddress.findMany({ take: 50, 
    where: { user_id: user.id },
    orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }]
  })

  return (
    <AddressesClient
      addresses={addresses.map(a => ({
        id: a.id,
        label: a.label,
        name: a.name,
        phone: a.phone,
        address: a.address,
        city: a.city,
        latitude: a.latitude,
        longitude: a.longitude,
        delivery_notes: a.delivery_notes,
        is_default: a.is_default,
        created_at: a.created_at.toISOString(),
      }))}
      profileName={profile.name}
      profilePhone={profile.phone || ''}
    />
  )
}
