import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UniversalWorkflowBuilder } from '@/components/shared/workflows/UniversalWorkflowBuilder'
import { toggleSystemWorkflowStatus, saveSystemWorkflow, deleteSystemWorkflow } from './actions'

// ─── Super Admin Global Workflows Builder ─────────────────────────

export default async function AdminWorkflowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check admin role
  const admin = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  
  if (admin?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  // Fetch only SYSTEM templates (global workflows)
  const globalWorkflowsRaw = await prisma.workflow.findMany({ take: 50, 
    where: { store_id: null, user_id: null },
    orderBy: { created_at: 'desc' }
  }).catch(() => [])

  // Cast for client builder
  const typedWorkflows = globalWorkflowsRaw.map((w: any) => ({
    id: w.id,
    title: w.title,
    description: w.description || '',
    status: (w.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    triggerType: w.triggerType,
    config: w.config || {},
    actionCount: w.config?.actions?.length || 0,
    lastRun: w.last_run ? new Date(w.last_run).toLocaleDateString() : 'Jamais',
    is_premium: w.is_premium,
    price: w.price
  }))

  return (
    <div className="flex flex-col min-h-screen">
      <div className="w-full p-8 animate-in fade-in zoom-in-95 duration-700">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-ink tracking-tight mb-2">Générateur de Modèles</h1>
          <p className="text-gray-500 font-medium">Concevez des parcours automatisés "officiels" qui seront mis à disposition sur le Marketplace des utilisateurs.</p>
        </header>

        <main className="w-full relative z-10 pb-20">
          <UniversalWorkflowBuilder 
            initialWorkflows={typedWorkflows} 
            globalWorkflows={[]} // Admin doesn't buy models, they CREATE them.
            purchasedAssetIds={[]}
            ownerId={"system"} 
            ownerType="vendor" // 'vendor' reveals max triggers. Admin can build everything.
            actions={{
              toggleStatus: toggleSystemWorkflowStatus,
              saveWorkflow: saveSystemWorkflow as any,
              deleteWorkflow: deleteSystemWorkflow,
              // cloneWorkflow is absent because Admin creates from scratch
            }}
          />
        </main>
      </div>
    </div>
  )
}
