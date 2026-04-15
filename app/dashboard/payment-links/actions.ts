'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPaymentLinkAction(storeId: string, data: { title: string; description: string; amount: number; currency: string }) {
  try {
    const newLink = await prisma.paymentLink.create({
      data: {
        store_id: storeId,
        title: data.title,
        description: data.description,
        amount: data.amount,
        currency: data.currency || 'XOF',
        is_active: true
      }
    })

    revalidatePath('/dashboard/payment-links')
    return { success: true, linkId: newLink.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function togglePaymentLinkAction(linkId: string, storeId: string, isActive: boolean) {
  try {
    const link = await prisma.paymentLink.findFirst({
      where: { id: linkId, store_id: storeId }
    })
    
    if (!link) return { success: false, error: 'Link non trouvé' }

    await prisma.paymentLink.update({
      where: { id: linkId },
      data: { is_active: isActive }
    })

    revalidatePath('/dashboard/payment-links')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deletePaymentLinkAction(linkId: string, storeId: string) {
  try {
    await prisma.paymentLink.deleteMany({
      where: { id: linkId, store_id: storeId }
    })

    revalidatePath('/dashboard/payment-links')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
