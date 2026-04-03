'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const avatar_url = formData.get('avatar_url') as string
  
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
      ...(avatar_url ? { avatar_url } : {})
    })
    .eq('id', user.id)

  if (dbError) {
    console.error('Erreur MAJ Base:', dbError)
    if (dbError.message.includes('unique')) {
      return { error: 'Ce numéro de téléphone est déjà pris par un autre compte.' }
    }
    return { error: 'Une erreur est survenue lors de la sauvegarde.' }
  }

  return { success: true }
}

export async function addDeliveryAddress(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const label = formData.get('label') as string
  const city = formData.get('city') as string

  if (!name || !phone || !address || !label) {
    return { error: 'Tous les champs requis ne sont pas remplis.' }
  }

  try {
    await prisma.deliveryAddress.create({
      data: {
        user_id: user.id,
        name,
        phone,
        address,
        label,
        city: city || null
      }
    })
    
    revalidatePath('/client/settings')
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de l’ajout de l’adresse.' }
  }
}

export async function deleteDeliveryAddress(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  try {
    await prisma.deliveryAddress.delete({
      where: { id: id, user_id: user.id }
    })
    
    revalidatePath('/client/settings')
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de la suppression de l’adresse.' }
  }
}

export async function deleteClientAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  const supabaseAdmin = createAdminClient()

  try {
    // Supprimer l'utilisateur de la base de données Prisma/Supabase
    // Prisma on cascade should handle most things or Supabase auth deletion will.
    // Il est préférable de supprimer d'abord depuis Supabase Auth, ce qui purgera la DB si un cascade onDelete est en place sur l'id,
    // Sinon on supprime le User manuellement avant auth (dépend de l'architecture). 
    // Faisons la suppression via Supabase Admin (Auth) qui déclenche souvent les cascades ou supprime le profile via auth schema.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (authError) {
      console.error('Erreur supression compte:', authError)
      return { error: 'Impossible de supprimer ce compte. Il est possible que des données soient liées (commandes, etc.).' }
    }

    // Déconnexion
    await supabase.auth.signOut()

    return { success: true }
  } catch (err) {
    console.error('Erreur inattendue:', err)
    return { error: 'Une erreur inattendue est survenue.' }
  }
}
