import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import WorkflowsClient from './WorkflowsClient'

// ─── Page Workflows — accessible à tous les vendeurs ─────────────────────────
// Plus de guard PRO ni de dépendance à prisma/subscriptions

export default async function WorkflowsPage() {
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

  // Récupération des formulaires
  const workflows = await prisma.workflow.findMany({
    where: { store_id: store.id },
    orderBy: { created_at: 'desc' },
  }).catch(() => []) // Catch au cas où la migration Prisma n'est pas encore générée proprement.

  // On cast intelligemment pour le client
  const typedWorkflows = workflows.map((w: any) => ({
    id: w.id,
    title: w.title,
    description: w.description || '',
    status: w.status as 'active' | 'inactive',
    triggerType: w.triggerType,
    config: w.config || {},
    actionCount: w.config?.actions?.length || 0,
    lastRun: w.last_run ? new Date(w.last_run).toLocaleDateString() : 'Jamais'
  }))

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
        <div className="px-6 py-5 max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Automatisations</h1>
            <p className="text-emerald-600/80 text-[11px] font-black uppercase tracking-widest mt-1">Connectez vos outils et économisez du temps</p>
          </div>
        </div>
      </header>

      <main className="w-full flex-1">
        <WorkflowsClient initialWorkflows={typedWorkflows} storeId={store.id} />
      </main>
    </div>
  )
}
