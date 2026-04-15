'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateComplaintStatusAction(complaintId: string, storeId: string, newStatus: string) {
  try {
    const complaint = await prisma.complaint.findFirst({
      where: { id: complaintId, store_id: storeId }
    })

    if (!complaint) {
      return { success: false, error: 'Plainte introuvable ou accès refusé' }
    }

    await prisma.complaint.update({
      where: { id: complaintId },
      data: { status: newStatus, updated_at: new Date() }
    })

    revalidatePath('/dashboard/helpdesk')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addComplaintNoteAction(complaintId: string, storeId: string, note: string) {
  try {
    const complaint = await prisma.complaint.findFirst({
      where: { id: complaintId, store_id: storeId }
    })

    if (!complaint) {
      return { success: false, error: 'Plainte introuvable ou accès refusé' }
    }

    const currentNotes = complaint.admin_notes || ''
    const newNotes = currentNotes 
       ? `${currentNotes}\n---\n[Vendeur] ${new Date().toLocaleDateString()}: ${note}` 
       : `[Vendeur] ${new Date().toLocaleDateString()}: ${note}`

    await prisma.complaint.update({
      where: { id: complaintId },
      data: { admin_notes: newNotes, updated_at: new Date() }
    })

    revalidatePath('/dashboard/helpdesk')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function submitTicketAction(data: {
  store_id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  order_id?: string
  subject: string
  message: string
}) {
  try {
    await prisma.complaint.create({
      data: {
        store_id: data.store_id,
        order_id: data.order_id,
        reporter_name: data.customer_name,
        type: data.subject,
        description: data.message,
        status: 'pending'
      }
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
