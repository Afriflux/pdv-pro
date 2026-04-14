'use server'

import { createClient } from '@/lib/supabase/server'
import { activateAmbassadorProfile } from '@/lib/ambassador/ambassador-service'
import { revalidatePath } from 'next/cache'

export async function activateAmbassadorAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non authentifié' }
    }

    await activateAmbassadorProfile(user.id)
    
    // Revalider les chemins impliqués
    revalidatePath('/dashboard/ambassadeur')
    revalidatePath('/client/ambassadeur')
    revalidatePath('/dashboard')
    revalidatePath('/client')
    
    return { success: true }
  } catch (error: Error | any) {
    console.error('[activateAmbassadorAction]', error)
    return { error: error.message || 'Erreur lors de l\'activation du profil ambassadeur.' }
  }
}
