import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import HelpdeskControls from './HelpdeskControls'

export const metadata = {
  title: "Helpdesk & SAV | Yayyam",
}

export default async function HelpdeskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/pdvconnexion')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id }
  })

  if (!store) redirect('/dashboard')

  const tickets = await prisma.helpdeskTicket.findMany({
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
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">Helpdesk</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Gérez votre Service Après-Vente comme une grande marque.
          </p>
        </div>
      </div>

      <HelpdeskControls tickets={tickets} />
    </div>
  )
}
