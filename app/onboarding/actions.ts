'use server'

import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/brevo/brevo-service'

export async function checkStoreName(name: string): Promise<{ exists: boolean }> {
  const supabase = await createClient()
  const { data } = await supabase.from('Store').select('id').ilike('name', name).maybeSingle()
  return { exists: !!data }
}

export async function saveStoreInfo(payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { error } = await supabase.from('Store').update(payload).eq('user_id', user.id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function savePaymentMethod(method: string, details: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { data: store } = await supabase.from('Store').select('id').eq('user_id', user.id).single()
  if (!store) return { success: false, error: 'Boutique introuvable' }
  
  const { error } = await supabase.from('Wallet').upsert({
    vendor_id: store.id,
    payout_method: method,
    payout_details: details
  }, { onConflict: 'vendor_id' })
  
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function completeOnboarding(storeName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { error } = await supabase.from('Store').update({ onboarding_completed: true }).eq('user_id', user.id)
  if (error) return { success: false, error: error.message }
  
  const { data: userData } = await supabase.from('User').select('email').eq('id', user.id).single()
  if (userData?.email) {
    sendWelcomeEmail(userData.email, storeName || 'votre boutique').catch(console.error)
  }
  return { success: true }
}
