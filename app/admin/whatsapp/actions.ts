'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function saveWhatsAppAgents(agentsJsonStr: string) {
  try {
    const supabase = createAdminClient()

    // Sauvegarde en DB via PlatformConfig. 
    // Utiliser upsert ne marche pas bien si l'ID n'est pas envoyé, 
    // on utilise donc update avec eq('key') ou insert si ça n'existe pas.
    const { data: existing } = await supabase
      .from('PlatformConfig')
      .select('id')
      .eq('key', 'whatsapp_agents')
      .maybeSingle()

    if (existing) {
      await supabase
        .from('PlatformConfig')
        .update({ value: agentsJsonStr, updated_at: new Date().toISOString() })
        .eq('key', 'whatsapp_agents')
    } else {
      await supabase
        .from('PlatformConfig')
        .insert({ key: 'whatsapp_agents', value: agentsJsonStr, updated_at: new Date().toISOString() })
    }

    // Vider le cache de Layout pour mise à jour instantanée du widget sur le site
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error saving WhatsApp Config:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}
