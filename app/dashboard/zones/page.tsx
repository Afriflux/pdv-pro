import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ZoneList } from './ZoneList'

export const metadata = {
  title: 'Zones Tarifaires | PDV Pro',
}

export default async function ZonesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    include: { deliveryZones: { orderBy: { created_at: 'asc' } } }
  })

  // Les produits digitaux stricts n'ont pas besoin de livraison
  if (!store || (store.vendor_type !== 'physical' && store.vendor_type !== 'hybrid')) {
    redirect('/dashboard')
  }

  const zones = store.deliveryZones

  return (
    <main className="min-h-screen bg-[#FAFAF7] font-sans pb-20">
      <header className="bg-white border-b border-gray-100 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
            Zones Tarifaires
          </h1>
          <p className="text-sm font-medium text-gray-400 mt-2">
            Définissez vos frais de livraison et permettez à l&apos;acheteur de choisir.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 lg:p-10">
        <ZoneList initialZones={zones} />
      </div>
    </main>
  )
}
