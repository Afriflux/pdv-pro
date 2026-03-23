import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MapPin } from 'lucide-react'
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
    <div className="space-y-6 w-full pb-32">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-line pt-10">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald/10 text-[#0F7A60] flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </span>
            Zones Tarifaires
          </h1>
          <p className="text-dust text-sm mt-1 font-medium">
            Définissez vos frais de livraison et permettez à l'acheteur de choisir.
          </p>
        </div>
      </div>

      <div className="bg-transparent border-0 p-0">
        <ZoneList initialZones={zones} />
      </div>
    </div>
  )
}
