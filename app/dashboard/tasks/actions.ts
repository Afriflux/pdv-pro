'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getStoreId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  })
  
  return store?.id || null
}

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export async function createTaskAction(data: { 
  title: string, priority: string, dueDate?: string,
  description?: string, taskType?: string, client_name?: string, client_phone?: string, order_id?: string
}, ownerType: 'vendor' | 'affiliate' | 'client' = 'vendor') {
  try {
    const user_id = await getUserId()
    if (!user_id) return { success: false, error: 'Non autorisé' }

    let store_id = null
    if (ownerType === 'vendor') {
       store_id = await getStoreId()
       if (!store_id) return { success: false, error: 'Boutique introuvable' }
    }

    if (!data.title.trim()) return { success: false, error: 'Titre requis' }

    const task = await prisma.task.create({
      data: {
        store_id,
        user_id: ownerType !== 'vendor' ? user_id : null,
        title: data.title,
        priority: data.priority,
        status: 'todo',
        dueDate: data.dueDate || null,
        description: data.description || null,
        taskType: data.taskType || 'general',
        client_name: data.client_name || null,
        client_phone: data.client_phone || null,
        order_id: data.order_id || null
      }
    })

    revalidatePath('/dashboard/tasks')
    revalidatePath('/client/tasks')
    revalidatePath('/portal/tasks')
    return { success: true, task }
  } catch (error: any) {
    console.error('[Create Task Error]', error)
    return { success: false, error: 'Erreur lors de la création de la tâche' }
  }
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
  try {
    const user_id = await getUserId()
    const store_id = await getStoreId()
    if (!user_id) return { error: 'Non autorisé' }

    await prisma.task.updateMany({
      where: { 
        id: taskId,
        OR: [
          { store_id: store_id || 'unmatchable' },
          { user_id: user_id }
        ]
      },
      data: { status: newStatus }
    })

    revalidatePath('/dashboard/tasks')
    revalidatePath('/client/tasks')
    revalidatePath('/portal/tasks')
    return { success: true }
  } catch (error: any) {
    console.error('[Update Task Status Error]', error)
    return { error: 'Erreur mise à jour de la tâche' }
  }
}

export async function updateTaskTitle(taskId: string, newTitle: string) {
  try {
    const user_id = await getUserId()
    const store_id = await getStoreId()
    if (!user_id) return { error: 'Non autorisé' }

    await prisma.task.updateMany({
      where: { 
        id: taskId,
        OR: [
          { store_id: store_id || 'unmatchable' },
          { user_id: user_id }
        ]
      },
      data: { title: newTitle }
    })

    revalidatePath('/dashboard/tasks')
    revalidatePath('/client/tasks')
    revalidatePath('/portal/tasks')
    return { success: true }
  } catch (error: any) {
    console.error('[Update Task Title Error]', error)
    return { error: 'Erreur mise à jour de la tâche' }
  }
}

export async function deleteTaskAction(taskId: string) {
  try {
    const user_id = await getUserId()
    const store_id = await getStoreId()
    if (!user_id) return { error: 'Non autorisé' }

    await prisma.task.deleteMany({
      where: { 
        id: taskId,
        OR: [
          { store_id: store_id || 'unmatchable' },
          { user_id: user_id }
        ]
      }
    })

    revalidatePath('/dashboard/tasks')
    revalidatePath('/client/tasks')
    revalidatePath('/portal/tasks')
    return { success: true }
  } catch (error: any) {
    console.error('[Delete Task Error]', error)
    return { error: 'Erreur lors de la suppression' }
  }
}

// ── NOUVEAU PHASE 28C : Autocomplétion Clients ──
export async function getStoreCustomersAction() {
  try {
    const store_id = await getStoreId()
    if (!store_id) return { error: 'Non autorisé', customers: [] }

    // On récupère les commandes pour extraire une liste unique de clients
    const orders = await prisma.order.findMany({
      where: { store_id },
      select: { buyer_name: true, buyer_phone: true },
      orderBy: { created_at: 'desc' }
    })

    // Déduplication
    const uniqueMap = new Map<string, {name: string, phone: string}>()
    for (const o of orders) {
      if (o.buyer_phone && !uniqueMap.has(o.buyer_phone)) {
        uniqueMap.set(o.buyer_phone, {
          name: o.buyer_name || 'Client Inconnu',
          phone: o.buyer_phone
        })
      }
    }

    const customers = Array.from(uniqueMap.values())
    return { success: true, customers }

  } catch(e) {
    console.error(e)
    return { error: 'Erreur serveur', customers: [] }
  }
}

export async function createAffiliateTaskAction(data: any) {
  return createTaskAction(data, 'affiliate')
}

export async function createClientTaskAction(data: any) {
  return createTaskAction(data, 'client')
}
