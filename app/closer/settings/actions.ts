'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateCloserFinance(
  withdrawalMethod: string, 
  withdrawalNumber: string, 
  withdrawalName: string,
  closerAutoWithdraw: boolean = false,
  closerAutoWithdrawThreshold: number = 50000
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  if (!withdrawalNumber || !withdrawalNumber.trim() || !withdrawalName || !withdrawalName.trim()) {
    return { error: 'Veuillez remplir tous les champs obligatoires.' }
  }

  const supabaseAdmin = createAdminClient()

  // Update User Table with new fields
  const { error: dbError } = await supabaseAdmin
    .from('User')
    .update({ 
      withdrawal_method: withdrawalMethod,
      withdrawal_number: withdrawalNumber.trim(),
      withdrawal_name: withdrawalName.trim(),
      closer_auto_withdraw: closerAutoWithdraw,
      closer_auto_withdraw_threshold: closerAutoWithdrawThreshold
    })
    .eq('id', user.id)

  if (dbError) {
    console.error('Erreur MAJ Base (Finance):', dbError)
    return { error: 'Une erreur est survenue lors de la sauvegarde.' }
  }
  
  revalidatePath('/closer/settings')
  return { success: true }
}
