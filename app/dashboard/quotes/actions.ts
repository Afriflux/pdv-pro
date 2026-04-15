'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createQuoteAction(storeId: string, data: { client_name: string; client_email: string; client_phone: string; items: any[]; total_amount: number; expires_in_days: number }) {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + data.expires_in_days)

    const newQuote = await prisma.quote.create({
      data: {
        store_id: storeId,
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        items: data.items,
        total_amount: data.total_amount,
        status: 'DRAFT',
        expires_at: expiresAt
      }
    })

    revalidatePath('/dashboard/quotes')
    return { success: true, quoteId: newQuote.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateQuoteStatusAction(quoteId: string, storeId: string, newStatus: string) {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, store_id: storeId }
    })
    
    if (!quote) return { success: false, error: 'Devis non trouvé' }

    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: newStatus, updated_at: new Date() }
    })

    if (newStatus === 'PAID') {
      // Create an Invoice if it doesn't already exist for this quote
      const existingInvoice = await prisma.invoice.findFirst({ where: { quote_id: quoteId } })
      
      if (!existingInvoice) {
        // Generate a random 6-digit invoice number
        const randStr = Math.floor(100000 + Math.random() * 900000).toString()
        const numero = `INV-${new Date().getFullYear()}-${randStr}`

        await prisma.invoice.create({
          data: {
            quote_id: quoteId,
            numero: numero
          }
        })
      }
    }

    revalidatePath('/dashboard/quotes')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteQuoteAction(quoteId: string, storeId: string) {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, store_id: storeId }
    })
    if (!quote) return { success: false, error: 'Devis non trouvé' }

    await prisma.quote.delete({
      where: { id: quoteId }
    })

    revalidatePath('/dashboard/quotes')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
