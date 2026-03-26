import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
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

  const tasks = await prisma.task.findMany({
    where: { store_id: store.id },
    orderBy: { createdAt: 'desc' }
  })

  // Conversion simple pour le Client
  const plainTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority as 'low' | 'medium' | 'high',
    status: t.status as 'todo' | 'in_progress' | 'done',
    dueDate: t.dueDate || undefined,
    description: t.description || undefined,
    taskType: t.taskType as 'call' | 'email' | 'meeting' | 'issue' | 'general' | string,
    client_name: t.client_name || undefined,
    client_phone: t.client_phone || undefined,
    order_id: t.order_id || undefined,
    createdAt: t.createdAt.toISOString()
  }))

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
        <TasksClient initialTasks={plainTasks} />
      </main>
    </div>
  )
}
