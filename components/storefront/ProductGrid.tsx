'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { computeProductPrice } from '@/lib/promotions/promotionUtils'
import { FlashCountdown } from '@/components/Promotions/FlashCountdown'
import { Lightbox } from './Lightbox'
import { PromotionData } from '@/lib/promotions/promotionType'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  images: string[]
  type: string
  category: string | null
  cash_on_delivery: boolean
}

interface ProductGridProps {
  products: Product[]
  promotions: PromotionData[]
  accent: string
}

const TYPE_LABELS: Record<string, string> = {
  digital:  '📥 Digital',
  physical: '📦 Physique',
  coaching: '🎯 Coaching',
}

export function ProductGrid({ products, promotions, accent }: ProductGridProps) {
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(product => {
          const computed = computeProductPrice(product.price, product.id, promotions)
          return (
            <div key={product.id} 
                 className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 group flex flex-col justify-between border border-gray-100/50">
              
              {/* Image Section */}
              <div className="relative w-full h-36 cursor-zoom-in overflow-hidden" 
                   onClick={() => product.images?.length > 0 && setLightboxImages(product.images)}>
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 768px) 50vw, 33vw"
                       className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl"
                       style={{ background: accent + '11' }}>
                    {product.type === 'digital' ? '📥' : product.type === 'coaching' ? '🎯' : '📦'}
                  </div>
                )}
                
                {/* Badge Type */}
                <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/90 text-gray-600 px-2 py-0.5 rounded-full shadow-sm">
                  {TYPE_LABELS[product.type] ?? product.type}
                </span>

                {product.cash_on_delivery && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                    COD
                  </span>
                )}
              </div>

              {/* Info Section */}
              <Link href={`/pay/${product.id}`} className="p-3 space-y-1 flex flex-col flex-grow">
                <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                  {product.name}
                </p>
                
                {computed.activePromo?.type === 'flash' && computed.activePromo.ends_at && (
                  <div className="pt-1 pb-1">
                    <FlashCountdown 
                      promoId={computed.activePromo.id} 
                      title={computed.activePromo.title} 
                      endsAt={computed.activePromo.ends_at} 
                    />
                  </div>
                )}

                <div className="flex-grow" />
                
                <div className="flex items-center justify-between pt-1">
                  <div>
                    {computed.hasDiscount && (
                      <p className="text-xs text-gray-400 line-through -mb-0.5">
                        {computed.originalPrice.toLocaleString('fr-FR')} F
                      </p>
                    )}
                    <p className="text-base font-extrabold" style={{ color: accent }}>
                      {computed.finalPrice.toLocaleString('fr-FR')}
                      <span className="text-xs font-medium text-gray-400 ml-1">FCFA</span>
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium self-end mb-1">
                    Acheter
                  </span>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {lightboxImages && (
        <Lightbox 
          images={lightboxImages} 
          onClose={() => setLightboxImages(null)} 
        />
      )}
    </>
  )
}
