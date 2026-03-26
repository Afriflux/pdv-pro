'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function toggleWorkflowStatus(id: string, currentStatus: string) {
  try {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await prisma.workflow.update({
      where: { id },
      data: { status: newStatus }
    })
    revalidatePath('/dashboard/workflows')
    return { success: true, newStatus }
  } catch (error) {
    console.error('Erreur toggleWorkflowStatus:', error)
    return { success: false, error: 'Impossible de changer le statut.' }
  }
}

export async function saveWorkflow(data: any, storeId: string) {
  try {
    // Si l'ID est généré coté client (par. ex. avec Math.random()), c'est un nouveau workflow
    const isNew = data.id.includes('.')

    if (!isNew) {
      await prisma.workflow.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          triggerType: data.triggerType,
          config: data.config || {}
        }
      })
    } else {
      await prisma.workflow.create({
        data: {
          store_id: storeId,
          title: data.title,
          description: data.description || "Automatisation personnalisée",
          status: data.status,
          triggerType: data.triggerType,
          config: data.config || {}
        }
      })
    }
    revalidatePath('/dashboard/workflows')
    return { success: true }
  } catch (error) {
    console.error('Erreur saveWorkflow:', error)
    return { success: false, error: 'Impossible de sauvegarder le workflow.' }
  }
}

export async function deleteWorkflow(id: string) {
  try {
    await prisma.workflow.delete({ where: { id } })
    revalidatePath('/dashboard/workflows')
    return { success: true }
  } catch (error) {
    console.error('Erreur deleteWorkflow:', error)
    return { success: false, error: 'Impossible de supprimer le workflow.' }
  }
}
