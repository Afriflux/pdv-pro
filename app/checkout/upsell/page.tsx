import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import UpsellClient from './UpsellClient'
import { prisma } from '@/lib/prisma'

export default async function UpsellPage({ searchParams }: { searchParams: { o?: string; p?: string; d?: string } }) {
  const baseOrderId = searchParams.o
  const upsellProductId = searchParams.p
  const discountStr = searchParams.d

  if (!baseOrderId || !upsellProductId) {
    redirect('/')
  }

  // Fetch the base order
  const order = await prisma.order.findUnique({
    where: { id: baseOrderId },
    include: { store: true }
  })
  
  if (!order || order.payment_method !== 'cod') {
    redirect('/')
  }

  // Fetch the upsell product
  const product = await prisma.product.findUnique({
    where: { id: upsellProductId },
    include: { store: true }
  })

  if (!product || !product.active) {
    redirect(`/checkout/success?order=${baseOrderId}&cod=true`)
  }

  const discount = Math.min(100, Math.max(0, parseFloat(discountStr || '0')))
  const originalPrice = product.price
  const discountedPrice = originalPrice * (1 - (discount / 100))
  const amountSaved = originalPrice - discountedPrice

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-20">
      {/* ── HEADER & PROGRESS ── */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col items-center gap-3">
          {product.store.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.store.logo_url} alt={product.store.name} className="h-10 w-auto object-contain" />
          )}
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2 px-1">
              <span className="text-emerald-600">✓ Commande Validée</span>
              <span className="text-emerald-600">✓ Choix de Paiement</span>
              <span className="text-gray-900 border-b-2 border-gray-900 pb-[2px]">3. Offre Spéciale</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[90%] rounded-full relative">
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 mt-8 flex flex-col items-center">
        {/* ── BANNIÈRE ATTENTE ── */}
        <div className="bg-red-50 text-red-600 border border-red-200 text-center px-4 py-3 rounded-xl mb-6 flex flex-col items-center w-full max-w-xl">
           <span className="font-black flex items-center gap-2">⚠️ ATTENDEZ ! VOTRE COMMANDE N'EST PAS TERMINÉE !</span>
           <span className="text-sm">Ne fermez pas cette page sous peine d'interruption du processus d'expédition.</span>
        </div>

        {/* ── TITRE HOOK ── */}
        <div className="text-center mb-8">
           <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
             Ajoutez <span className="text-emerald-600 underline decoration-emerald-200">{product.name}</span> à votre commande !
           </h1>
           <p className="mt-4 text-gray-600 font-medium text-lg max-w-xl mx-auto">
             En tant que nouveau client, nous vous offrons cette opportunité unique de l'obtenir avec <span className="font-extrabold text-red-500 bg-red-50 px-2 rounded">-{discount}% de réduction absolue</span>.
           </p>
        </div>

        {/* ── CLIENT COMPONENT (Interactivity UI, Timer) ── */}
        <UpsellClient 
          baseOrderId={baseOrderId} 
          product={JSON.parse(JSON.stringify(product))}
          discountedPrice={discountedPrice}
          originalPrice={originalPrice}
          amountSaved={amountSaved}
        />

      </div>
    </div>
  )
}
