'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from './adminActions'

interface PayoutPayload {
  shareholderId: string
  amount: number
  paymentMethod: string
  reference?: string
}

export async function distributeDividends(payload: PayoutPayload) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non authentifié.")

  // Verification RBAC
  const { data: currentUser } = await supabaseAdmin.from('User').select('role, internal_role_id').eq('id', user.id).single()
  if (!currentUser) throw new Error("Utilisateur introuvable.")
  
  if (currentUser.role !== 'super_admin') {
     // Check if they have 'full' equity access
     const { data: internalRole } = await supabaseAdmin.from('InternalRole').select('permissions').eq('id', currentUser.internal_role_id).single()
     const perms = internalRole?.permissions as Record<string, string> || {}
     if (perms['equity'] !== 'full') {
       throw new Error("Vous n'avez pas l'autorisation requise (full) sur le module Actionnariat pour décaisser des dividendes.")
     }
  }

  // Effectuer la distribution
  const { data: distribution, error } = await supabaseAdmin
    .from('DividendDistribution')
    .insert({
       shareholder_id: payload.shareholderId,
       amount: payload.amount,
       payment_method: payload.paymentMethod,
       reference: payload.reference || 'Aucune',
       status: 'completed',
       distributed_by: user.id
    })
    .select()
    .single()

  if (error) throw new Error(`Erreur lors de la distribution: ${error.message}`)

  await logAdminAction(
    `Distribution de dividendes (${payload.amount} F) via ${payload.paymentMethod}`,
    'DividendDistribution',
    distribution.id,
    { amount: payload.amount, method: payload.paymentMethod, ref: payload.reference }
  )

  return { success: true, distribution }
}
