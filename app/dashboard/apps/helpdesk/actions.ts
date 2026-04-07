'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function submitTicketAction(data: {
  store_id: string
  order_id?: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  subject: string
  message: string
}) {
  try {
    await prisma.helpdeskTicket.create({
      data: {
        store_id: data.store_id,
        order_id: data.order_id || null,
        customer_name: data.customer_name,
        customer_email: data.customer_email || null,
        customer_phone: data.customer_phone || null,
        subject: data.subject,
        message: data.message,
        status: "OPEN"
      }
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateTicketStatusAction(ticketId: string, status: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Non autorisé" }

    const store = await prisma.store.findUnique({
      where: { user_id: user.id }
    })

    if (!store) return { success: false, error: "Boutique introuvable" }

    // Validate ownership
    const ticket = await prisma.helpdeskTicket.findUnique({ where: { id: ticketId } })
    if (!ticket || ticket.store_id !== store.id) return { success: false, error: "Ticket introuvable" }

    await prisma.helpdeskTicket.update({
      where: { id: ticketId },
      data: { status }
    })

    revalidatePath('/dashboard/apps/helpdesk')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
