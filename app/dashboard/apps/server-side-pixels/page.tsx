import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ServerSidePixelsControls from './ServerSidePixelsControls'

export const metadata = {
  title: "Pixels & Meta CAPI | Yayyam",
}

export default async function ServerSidePixelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/pdvconnexion')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: {
      meta_pixel_id: true,
      meta_capi_token: true,
      tiktok_pixel_id: true,
      google_tag_id: true,
    }
  })

  if (!store) redirect('/dashboard')

  return (
    <div className="w-full flex flex-col pt-4">
      {/* HEADER DE LA PAGE */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/dashboard/apps" 
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">Pixels & Server-Side API</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Traquez finement vos visiteurs et envoyez vos conversions avec 100% de fiabilité à Facebook, TikTok et Google.
          </p>
        </div>
      </div>

      <ServerSidePixelsControls initialConfig={store} />
    </div>
  )
}
