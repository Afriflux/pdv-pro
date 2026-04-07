'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Met à jour le profil de l'utilisateur (nom, téléphone et avatar)
 */
export async function updateProfile(formData: { name: string; phone?: string; avatarUrl: string | null }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const updateData: any = {
    name: formData.name.trim(),
    avatar_url: formData.avatarUrl,
    updated_at: new Date().toISOString()
  }

  // N'ajouter/mettre à jour 'phone' que s'il est fourni (optionnel)
  if (formData.phone !== undefined) {
    updateData.phone = formData.phone.trim() || null
  }

  const { error } = await supabase
    .from('User')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505' && error.message.includes('User_phone_key')) {
      return { success: false, error: "Ce numéro de téléphone est déjà utilisé par un autre compte." }
    }
    return { success: false, error: "Erreur serveur: " + error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Met à jour le slug de la boutique
 */
export async function updateSlug(slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  // Vérifier si le slug est déjà utilisé par une autre boutique
  const { data: existing } = await supabase
    .from('Store')
    .select('id')
    .eq('slug', slug)
    .neq('user_id', user.id)
    .single()

  if (existing) throw new Error('Ce lien est déjà utilisé par une autre boutique.')

  const { error } = await supabase
    .from('Store')
    .update({
      slug: slug.toLowerCase().trim(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Met à jour l'apparence de la boutique (logo et couleur)
 */
export async function updateAppearance(formData: { 
  logoUrl: string | null; 
  primaryColor: string;
  bannerUrl?: string | null;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { error } = await supabase
    .from('Store')
    .update({
      logo_url: formData.logoUrl,
      primary_color: formData.primaryColor,
      banner_url: formData.bannerUrl,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Met à jour le mot de passe de l'utilisateur
 */
export async function updatePassword(password: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) throw new Error(error.message)

  return { success: true }
}

/**
 * Met à jour les préférences de notifications
 * Note: Ces champs doivent exister dans la table Store ou User
 */
export async function updateNotifications(settings: { 
  notif_new_order: boolean; 
  notif_weekly_report: boolean; 
  notif_stock_alert: boolean; 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { error } = await supabase
    .from('Store')
    .update({
      notif_new_order: settings.notif_new_order,
      notif_weekly_report: settings.notif_weekly_report,
      notif_stock_alert: settings.notif_stock_alert,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Met à jour les préférences de notifications Telegram (JSONB)
 */
export async function updateTelegramNotifications(notifications: { 
  orders: boolean; 
  payments: boolean; 
  whatsapp: boolean; 
  stock: boolean; 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { error } = await supabase
    .from('Store')
    .update({
      telegram_notifications: notifications,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Supprime le compte de l'utilisateur et sa boutique
 */
export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  // Supabase Auth Admin API serait nécessaire pour supprimer l'utilisateur auth
  // Mais ici on peut marquer le profil comme "désactivé" ou supprimer les données liées
  
  // 1. Supprimer la boutique (les cascades devraient gérer le reste)
  const { error: storeErr } = await supabase
    .from('Store')
    .delete()
    .eq('user_id', user.id)

  if (storeErr) throw new Error(storeErr.message)

  // 2. Déconnexion
  await supabase.auth.signOut()

  return { success: true }
}

/**
 * Met à jour les informations KYC de la boutique
 */
export async function updateKYC(formData: { 
  idCardUrl?: string | null; 
  kycDocuments?: any;
  documentType: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { error } = await supabase
    .from('Store')
    .update({
      id_card_url: formData.idCardUrl || null,
      kyc_document_type: formData.documentType,
      kyc_documents: formData.kycDocuments,
      kyc_status: 'pending', // Passe en attente de vérification
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Met à jour les liens des réseaux sociaux de la boutique
 */
export async function updateSocialLinks(links: {
  instagram?: string
  tiktok?: string
  facebook?: string
  youtube?: string
  linkedin?: string
  whatsapp?: string
  website?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { error } = await supabase
    .from('Store')
    .update({
      social_links: links,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  revalidatePath('/') // Pour la page vitrine si nécessaire
  return { success: true }
}

/**
 * Met à jour les IDs des pixels de tracking
 */
export async function updatePixels(data: {
  meta_pixel_id?: string
  tiktok_pixel_id?: string
  google_tag_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { error } = await supabase
    .from('Store')
    .update({
      meta_pixel_id: data.meta_pixel_id || null,
      tiktok_pixel_id: data.tiktok_pixel_id || null,
      google_tag_id: data.google_tag_id || null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Met à jour le paramétrage SEO et les Pixels de Tracking
 */
export async function updateSEO(data: {
  seo_title?: string
  seo_description?: string
  meta_pixel_id?: string
  meta_capi_token?: string
  tiktok_pixel_id?: string
  google_tag_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { error } = await supabase
    .from('Store')
    .update({
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
      meta_pixel_id: data.meta_pixel_id || null,
      meta_capi_token: data.meta_capi_token || null,
      tiktok_pixel_id: data.tiktok_pixel_id || null,
      google_tag_id: data.google_tag_id || null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  return { success: true }
}
