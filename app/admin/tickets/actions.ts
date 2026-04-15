'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function checkIsAdmin() {
  const supabase = await createClient()
  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) return null

  const admin = createAdminClient()
  const { data: user } = await admin
    .from('User')
    .select('id, name, role')
    .eq('id', userData.user.id)
    .single()

  if (!user || !['super_admin', 'admin'].includes(user.role)) return null
  return user as { id: string; name: string; role: string }
}

/**
 * Assign a ticket to an admin user
 */
export async function assignTicketAction(ticketId: string, adminId: string | null) {
  const currentAdmin = await checkIsAdmin()
  if (!currentAdmin) return { success: false, error: 'Non autorisé' }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('HelpdeskTicket')
    .update({
      assigned_admin_id: adminId,
      status: adminId ? 'IN_PROGRESS' : 'OPEN',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)

  if (error) {
    console.error('[AssignTicket] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/tickets')
  return { success: true }
}

/**
 * Escalate a ticket to super_admin level
 */
export async function escalateTicketAction(ticketId: string) {
  const currentAdmin = await checkIsAdmin()
  if (!currentAdmin) return { success: false, error: 'Non autorisé' }

  const supabase = createAdminClient()

  // Find a super_admin to escalate to
  const { data: superAdmins } = await supabase
    .from('User')
    .select('id, name')
    .eq('role', 'super_admin')
    .limit(1)

  const superAdminId = superAdmins?.[0]?.id || null

  const { error } = await supabase
    .from('HelpdeskTicket')
    .update({
      assigned_admin_id: superAdminId,
      status: 'IN_PROGRESS',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)

  if (error) {
    console.error('[EscalateTicket] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/tickets')
  return { success: true, escalatedTo: superAdmins?.[0]?.name || 'Super Admin' }
}

/**
 * Update ticket status
 */
export async function updateTicketStatusAction(ticketId: string, status: string) {
  const currentAdmin = await checkIsAdmin()
  if (!currentAdmin) return { success: false, error: 'Non autorisé' }

  const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
  if (!validStatuses.includes(status)) {
    return { success: false, error: 'Statut invalide' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('HelpdeskTicket')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)

  if (error) {
    console.error('[UpdateTicketStatus] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/tickets')
  return { success: true }
}
