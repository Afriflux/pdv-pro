import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UniversalWorkflowBuilder } from '@/components/shared/workflows/UniversalWorkflowBuilder'
import { saveAffiliateWorkflow, deleteWorkflow, toggleWorkflowStatus, cloneWorkflowTemplate } from '@/app/dashboard/workflows/actions'

export default async function PortalWorkflowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const workflows = await prisma.workflow.findMany({ take: 50, 
    where: { user_id: user.id },
    orderBy: { updated_at: 'desc' }
  })

  const plainWorkflows = workflows.map(w => ({
    id: w.id,
    title: w.title,
    description: w.description || '',
    status: w.status as 'active' | 'inactive',
    triggerType: w.triggerType,
    config: w.config as any,
    actionCount: ((w.config as any)?.actions?.length) || 0,
    last_run: w.last_run ? w.last_run.toISOString() : undefined,
    created_at: w.created_at.toISOString(),
    updated_at: w.updated_at.toISOString(),
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

  // Les affiliés n'ont pas de store_id dans AssetPurchase pour le moment
  const assetPurchases: {asset_id: string}[] = []
  const purchasedAssetIds = assetPurchases.map(a => a.asset_id)

  return (
    <div className="flex flex-col min-h-screen bg-transparent p-6 md:p-10 w-full relative z-10">
      <header className="mb-10 w-full relative z-10 flex flex-col justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 bg-[#0F7A60]/10 border border-[#0F7A60]/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#0F7A60] mb-4">
             Mes Outils
           </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tighter mb-2">Automatisations</h1>
          <p className="text-gray-500 font-medium text-lg">Automatisez l'envoi de messages à vos affiliés et leads.</p>
        </div>
      </header>

      <main className="w-full">
        <UniversalWorkflowBuilder 
          initialWorkflows={plainWorkflows} 
          globalWorkflows={globalWorkflows as any}
          purchasedAssetIds={purchasedAssetIds}
          ownerId={user.id} 
          ownerType="affiliate"
          actions={{
            saveWorkflow: saveAffiliateWorkflow as any,
            deleteWorkflow,
            toggleStatus: toggleWorkflowStatus,
            cloneWorkflow: cloneWorkflowTemplate
          }}
        />
      </main>
    </div>
  )
}
