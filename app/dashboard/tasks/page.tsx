import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TasksClient from './TasksClient'

// ─── Page Tâches — accessible à tous les vendeurs ────────────────────────────
// Plus de guard PRO ni de dépendance à prisma/subscriptions

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérification store via Supabase (sans prisma)
  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7]">
      <header className="bg-white border-b border-line shadow-sm px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-ink text-xl font-bold">Gestion des Tâches & SAV</h1>
            <p className="text-dust text-[10px] font-black uppercase tracking-widest mt-0.5">Pilotez votre support et vos livraisons</p>
          </div>
        </div>
      </header>

      <main className="w-full p-6">
        <TasksClient />
      </main>
    </div>
  )
}
