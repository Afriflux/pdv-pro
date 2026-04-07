'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Toggle status of a system workflow
export async function toggleSystemWorkflowStatus(id: string, currentStatus: string) {
  try {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await prisma.workflow.update({
      where: { id },
      data: { status: newStatus }
    })
    revalidatePath('/admin/workflows')
    revalidatePath('/admin/marketplace')
    return { success: true, newStatus }
  } catch (error) {
    console.error('Erreur toggleSystemWorkflowStatus:', error)
    return { success: false, error: 'Impossible de changer le statut.' }
  }
}

// Saving a system workflow -> it must have store_id = 'system' or store_id = null and user_id = null
export async function saveSystemWorkflow(data: any, _ownerId: string) {
  try {
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
          store_id: null, // Global template
          user_id: null,  // Global template
          title: data.title,
          description: data.description || "Modèle d'automatisation premium",
          status: data.status,
          triggerType: data.triggerType,
          config: data.config || {},
          is_premium: false, // On the marketplace controls, the admin will set this to true if they want
          price: 0
        }
      })
    }
    revalidatePath('/admin/workflows')
    revalidatePath('/admin/marketplace')
    return { success: true }
  } catch (error) {
    console.error('Erreur saveSystemWorkflow:', error)
    return { success: false, error: 'Impossible de sauvegarder le modèle de workflow.' }
  }
}

export async function deleteSystemWorkflow(id: string) {
  try {
    await prisma.workflow.delete({ where: { id } })
    revalidatePath('/admin/workflows')
    revalidatePath('/admin/marketplace')
    return { success: true }
  } catch (error) {
    console.error('Erreur deleteSystemWorkflow:', error)
    return { success: false, error: 'Impossible de supprimer ce modèle.' }
  }
}
