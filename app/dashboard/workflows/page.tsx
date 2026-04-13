import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UniversalWorkflowBuilder } from '@/components/shared/workflows/UniversalWorkflowBuilder'
import { toggleWorkflowStatus, saveWorkflow, deleteWorkflow, cloneWorkflowTemplate } from './actions'

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
  const workflows = await prisma.workflow.findMany({ take: 50, 
    where: { store_id: store.id },
    orderBy: { created_at: 'desc' },
  }).catch(() => []) // Catch au cas où la migration Prisma n'est pas encore générée proprement.

  // On cast intelligemment pour le client
  const typedWorkflows = workflows.map((w: any) => ({
    id: w.id,
    title: w.title,
    description: w.description || '',
    status: (w.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    triggerType: w.triggerType,
    config: w.config || {},
    actionCount: w.config?.actions?.length || 0,
    lastRun: w.last_run ? new Date(w.last_run).toLocaleDateString() : 'Jamais'
  }))

  const globalWorkflowsRaw = await prisma.workflow.findMany({ take: 50, 
    where: { store_id: null, user_id: null },
    orderBy: { created_at: 'desc' }
  }).catch(() => [])

  const globalWorkflows = globalWorkflowsRaw.map((w: any) => ({
    id: w.id,
    title: w.title,
    description: w.description || '',
    status: 'inactive',
    triggerType: w.triggerType,
    config: w.config || {},
    actionCount: w.config?.actions?.length || 0,
    is_premium: w.is_premium,
    price: w.price
  }))

  const assetPurchases = await prisma.assetPurchase.findMany({ take: 50, 
    where: { store_id: store.id, asset_type: 'WORKFLOW' },
    select: { asset_id: true }
  }).catch(() => [])
  const purchasedAssetIds = assetPurchases.map(a => a.asset_id)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 px-6 lg:px-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-emerald-600 shadow-[0_8px_30px_rgb(5,150,105,0.12)] border border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Automatisations</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Connectez vos outils et économisez du temps en automatisant l'envoi de vos reçus.</p>
            </div>
          </div>
        </header>

      <main className="w-full relative z-10 px-6 lg:px-10 pb-20">
        <UniversalWorkflowBuilder 
          initialWorkflows={typedWorkflows} 
          globalWorkflows={globalWorkflows as any}
          purchasedAssetIds={purchasedAssetIds}
          ownerId={store.id} 
          ownerType="vendor"
          actions={{
            toggleStatus: toggleWorkflowStatus,
            saveWorkflow: saveWorkflow as any,
            deleteWorkflow: deleteWorkflow,
            cloneWorkflow: cloneWorkflowTemplate
          }}
        />
      </main>
      </div>
    </div>
  )
}
