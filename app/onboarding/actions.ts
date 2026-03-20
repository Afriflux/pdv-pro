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
  
  const now = new Date().toISOString()
  
  // Assurer que le User existe dans la base Postgres (requis pour la clé étrangère Store_user_id_fkey)
  const authUserPhone = user.phone || user.user_metadata?.phone || null
  const authUserEmail = user.email || user.user_metadata?.email || null
  const authUserName = user.user_metadata?.name || user.user_metadata?.full_name || authUserEmail?.split('@')[0] || 'Vendeur'
  
  await supabase.from('User').upsert({
    id: user.id,
    name: authUserName,
    email: authUserEmail,
    phone: authUserPhone,
    role: 'vendeur',
    updated_at: now
  }, { onConflict: 'id' })
  
  const { data: existingStore } = await supabase.from('Store').select('id').eq('user_id', user.id).limit(1).maybeSingle()
  
  if (existingStore) {
    const { error } = await supabase.from('Store').update(payload).eq('id', existingStore.id)
    if (error) return { success: false, error: error.message }
  } else {
    try {
      // Génération UUID v4 manuelle pour éviter le crash "crypto non défini"
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      const storeId = generateUUID();
      const rHex = storeId.slice(0, 6)
      const name = payload.name || `Boutique de ${user.id.slice(0, 4)}`
      const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-') + '-' + rHex
      
      console.log("[saveStoreInfo] Tentative d'insertion avec :", { id: storeId, name, slug, ...payload })
      
      const { error } = await supabase.from('Store').insert({
        id: storeId,
        user_id: user.id,
        name,
        slug,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
        ...payload
      })
      
      if (error) {
        console.error("[saveStoreInfo] ERREUR INSERT :", error)
        return { success: false, error: error.message || JSON.stringify(error) }
      }
    } catch (e: any) {
      console.error("[saveStoreInfo] EXCEPTION :", e)
      return { success: false, error: e.message || "Erreur inconnue" }
    }
  }
  
  return { success: true }
}

export async function savePaymentMethod(method: string, details: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  
  const { data: store } = await supabase.from('Store').select('id').eq('user_id', user.id).limit(1).single()
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
