'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateAffiliateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const professional_phone = formData.get('professional_phone') as string
  const avatar_url = formData.get('avatar_url') as string
  const meta_pixel_id = formData.get('meta_pixel_id') as string
  const tiktok_pixel_id = formData.get('tiktok_pixel_id') as string
  const google_tag_id = formData.get('google_tag_id') as string
  
  // Construction du JSON des réseaux sociaux
  const social_links = {
    whatsapp: formData.get('social_whatsapp') as string || '',
    instagram: formData.get('social_instagram') as string || '',
    facebook: formData.get('social_facebook') as string || '',
    tiktok: formData.get('social_tiktok') as string || '',
    youtube: formData.get('social_youtube') as string || '',
    linkedin: formData.get('social_linkedin') as string || '',
    website: formData.get('social_website') as string || '',
  }
  
  if (!name || name.trim() === '') {
    return { error: 'Le nom complet est obligatoire.' }
  }

  const supabaseAdmin = createAdminClient()

  const userUpdateData: any = { name: name }
  if (avatar_url) {
    userUpdateData.avatar_url = avatar_url
    // Update Auth profile too if avatar changed
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { name: name, avatar_url: avatar_url }
    })
  } else {
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { name: name }
    })
  }

  // Update User Table with new fields
  const { error: dbError } = await supabaseAdmin
    .from('User')
    .update({ 
      name: name.trim(), 
      phone: phone ? phone.trim() : null,
      professional_phone: professional_phone ? professional_phone.trim() : null,
      meta_pixel_id: meta_pixel_id ? meta_pixel_id.trim() : null,
      tiktok_pixel_id: tiktok_pixel_id ? tiktok_pixel_id.trim() : null,
      google_tag_id: google_tag_id ? google_tag_id.trim() : null,
      social_links: social_links,
      ...(avatar_url ? { avatar_url } : {})
    })
    .eq('id', user.id)

  if (dbError) {
    console.error('Erreur MAJ Base:', dbError)
    // Message user-friendly pour les contraintes d'unicité (numéro de téléphone, etc.)
    if (dbError.message.includes('unique')) {
      return { error: 'Ce numéro de téléphone est déjà pris par un autre compte.' }
    }
    return { error: 'Une erreur est survenue lors de la sauvegarde.' }
  }


  return { success: true }
}

export async function acceptAffiliateContract() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('Affiliate')
    .update({ 
      contract_accepted: true, 
      contract_accepted_at: new Date().toISOString() 
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('Erreur signature contrat affilié:', error)
    return { error: 'Une erreur est survenue lors de la signature.' }
  }

  return { success: true }
}
