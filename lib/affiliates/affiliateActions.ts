'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AffiliateData {
  id: string
  user_id: string
  token: string
  status: 'pending' | 'active' | 'rejected'
  commission_rate: number
  clicks: number
  conversions: number
  total_earned: number
  created_at: string
  user: {
    name: string
    phone: string
  }
}

/**
 * Active ou désactive le programme d'affiliation pour la boutique,
 * et définit le taux de commission par défaut (ex: 0.10 pour 10%).
 */
export async function updateStoreAffiliateSettings(storeId: string, isActive: boolean, margin: number) {
  const supabase = await createClient()

  // Mettre à jour la table Store directement via Prisma ou Supabase (on utilise Supabase REST ici)
  const { error } = await supabase
    .from('Store')
    .update({ 
      affiliate_active: isActive, 
      affiliate_margin: margin 
    })
    .eq('id', storeId)

  if (error) {
    console.error('Erreur updateStoreAffiliateSettings:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/affilies')
  return { success: true }
}

/**
 * Récupère tous les affiliés existants (en attente, actifs, rejetés) d'une boutique
 */
export async function getStoreAffiliates(storeId: string): Promise<AffiliateData[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('Affiliate')
    .select(`
      id, user_id, token, status, commission_rate,
      clicks, conversions, total_earned, created_at,
      user:User(name, phone)
    `)
    .eq('vendor_id', storeId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // Normaliser le retour de relations Supabase
  return data.map(row => ({
    ...row,
    user: Array.isArray(row.user) ? row.user[0] : row.user
  })) as AffiliateData[]
}

/**
 * Accepte un affilié en attente et génère son ShortLink global
 * Redevient 'active' et le lien WhatsApp est prêt à être envoyé par le client
 */
export async function approveAffiliate(affiliateId: string) {
  const supabase = await createClient()

  // 1. Passer le statut à 'active'
  const { error } = await supabase
    .from('Affiliate')
    .update({ status: 'active' })
    .eq('id', affiliateId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/affilies')
  return { success: true }
}

/**
 * Refuse/Ban un affilié
 */
export async function rejectAffiliate(affiliateId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('Affiliate')
    .update({ status: 'rejected' })
    .eq('id', affiliateId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/affilies')
  return { success: true }
}
