import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UniversalWorkflowBuilder } from '@/components/shared/workflows/UniversalWorkflowBuilder'
import { saveClientWorkflow, deleteWorkflow, toggleWorkflowStatus } from '@/app/dashboard/workflows/actions'

export default async function ClientWorkflowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile unused

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

  return (
    <div className="flex flex-col min-h-screen bg-transparent p-6 md:p-10 max-w-[1400px] mx-auto z-10 relative">
      <header className="mb-10 w-full relative z-10 flex flex-col justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tighter mb-2">Automatisations</h1>
          <p className="text-gray-500 font-medium text-lg">Créez des workflows pour automatiser vos alertes et tâches courantes.</p>
        </div>
      </header>

      <main className="w-full">
        <UniversalWorkflowBuilder 
          initialWorkflows={plainWorkflows} 
          ownerId={user.id} 
          ownerType={"client" as any}
          actions={{
            saveWorkflow: saveClientWorkflow as any,
            deleteWorkflow,
            toggleStatus: toggleWorkflowStatus
          }}
        />
      </main>
    </div>
  )
}
