import { createClient } from '@/lib/supabase/server'

export async function isPro(storeId: string): Promise<boolean> {
  const supabase = await createClient()

  // Chercher un abonnement actif pour cette boutique
  const { data, error } = await supabase
    .from('Subscription')
    .select('plan, expires_at')
    .eq('vendor_id', storeId)
    .eq('plan', 'pro')
    .single()

  if (error || !data) return false

  // Vérifier si l'abonnement n'a pas expiré (s'il y a une date d'expiration)
  if (data.expires_at) {
    const expirationDate = new Date(data.expires_at)
    if (new Date() > expirationDate) {
      return false
    }
  }

  return true
}
