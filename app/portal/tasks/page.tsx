import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UniversalTasks } from '@/components/shared/tasks/UniversalTasks'
import { updateTaskStatus, updateTaskTitle, deleteTaskAction, createAffiliateTaskAction } from '@/app/dashboard/tasks/actions'

export default async function PortalTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tasks = await prisma.task.findMany({
    where: { user_id: user.id },
    orderBy: { createdAt: 'desc' }
  })

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
    <div className="flex flex-col min-h-screen bg-transparent p-6 md:p-10 max-w-[1400px] mx-auto z-10 relative">
      <header className="mb-10 w-full relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 bg-[#0F7A60]/10 border border-[#0F7A60]/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#0F7A60] mb-4">
             Mes Outils
           </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tighter mb-2">My Tasks</h1>
          <p className="text-gray-500 font-medium text-lg">Gérez vos tâches et optimisez vos campagnes d'affiliation.</p>
        </div>
      </header>

      <main className="w-full">
        <UniversalTasks 
          initialTasks={plainTasks} 
          ownerId={user.id} 
          ownerType="affiliate" 
          actions={{
            createTask: createAffiliateTaskAction,
            updateStatus: updateTaskStatus,
            updateTitle: updateTaskTitle,
            deleteTask: deleteTaskAction
          }}
        />
      </main>
    </div>
  )
}
