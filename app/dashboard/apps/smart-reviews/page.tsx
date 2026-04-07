import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SmartReviewsControls from './SmartReviewsControls'

export const metadata = {
  title: "Smart Reviews | Yayyam",
}

export default async function SmartReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/pdvconnexion')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    include: {
      products: {
        select: { id: true, name: true }
      }
    }
  })

  if (!store) redirect('/dashboard')

  const reviews = await prisma.review.findMany({
    where: { store_id: store.id },
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
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">Smart Reviews</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Gérez vos avis certifiés pour faire exploser votre taux de conversion.
          </p>
        </div>
      </div>

      <SmartReviewsControls 
        isActive={store.smart_reviews_active} 
        reviews={reviews as any} 
        products={store.products}
      />
    </div>
  )
}
