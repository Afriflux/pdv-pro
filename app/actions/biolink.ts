'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

import { checkUserQuota } from '@/lib/admin/quota'

export async function getBioLinks(userId: string) {
  try {
    const bioLinks = await prisma.bioLink.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    })
    return { success: true, data: bioLinks }
  } catch (error) {
    console.error('Error fetching BioLinks:', error)
    return { success: false, error: 'Impossible de charger vos pages Link-in-Bio' }
  }
}

export async function saveBioLink(userId: string, data: any) {
  try {
    // Generate a slug if missing
    let slug = data.slug
    if (!slug) {
      slug = data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `user-${userId.substring(0, 8)}`
    }
    
    // Check slug uniqueness
    const existingSlug = await prisma.bioLink.findFirst({
      where: data.id ? { slug, NOT: { id: data.id } } : { slug }
    })
    if (existingSlug) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`
    }

    const payload = {
      title: data.title,
      slug: slug,
      bio: data.bio,
      avatar_url: data.avatar_url,
      banner_url: data.banner_url,
      brand_color: data.brand_color || '#0F7A60',
      theme: data.theme || 'light',
      links: data.links || [],
      socials: data.socials || [],
      newsletter_active: data.newsletter_active ?? false,
      newsletter_text: data.newsletter_text || 'Abonnez-vous à ma newsletter',
      tip_active: data.tip_active ?? false,
      tip_text: data.tip_text || 'Offrez-moi un café ☕️',
      phone_active: data.phone_active ?? false,
      phone_number: data.phone_number || '',
      phone_text: data.phone_text || 'Appeler Maintenant 📞',
      custom_appearance: data.custom_appearance || {}
    } as any

    let bioLink;
    if (data.id) {
       // UPDATE
       bioLink = await prisma.bioLink.update({
         where: { id: data.id, user_id: userId },
         data: payload
       })
    } else {
       // CREATION WITH QUOTA CHECK
       const quota = await checkUserQuota(userId, 'link_bio')
       if (!quota.allowed) {
          return { success: false, error: `Quota atteint. Vous êtes limité à ${quota.limit} page(s).` }
       }
       bioLink = await prisma.bioLink.create({
         data: { ...payload, user_id: userId }
       })
    }

    revalidatePath('/dashboard/links')
    revalidatePath('/portal/links')
    revalidatePath(`/bio/${bioLink.slug}`)

    return { success: true, data: bioLink }
  } catch (error) {
    console.error('Error saving BioLink:', error)
    return { success: false, error: 'Erreur lors de la sauvegarde du BioLink' }
  }
}

export async function deleteBioLink(userId: string, id: string) {
  try {
    await prisma.bioLink.delete({
       where: { id, user_id: userId }
    })
    revalidatePath('/dashboard/links')
    revalidatePath('/portal/links')
    return { success: true }
  } catch(e) {
    return { success: false, error: 'Impossible de supprimer cette page' }
  }
}



export async function subscribeNewsletter(storeId: string, email: string, name: string) {
  try {
    // Check if lead already exists
    const existing = await prisma.lead.findFirst({
      where: { store_id: storeId, email }
    })
    
    if (existing) {
      return { success: true, message: 'Vous êtes déjà inscrit !' }
    }

    await prisma.lead.create({
      data: {
        store_id: storeId,
        email,
        name: name || email.split('@')[0],
        phone: '', 
        status: 'new'
      }
    })

    return { success: true, message: 'Inscription réussie !' }
  } catch (error) {
    console.error('Newsletter error:', error)
    return { success: false, error: 'Une erreur est survenue.' }
  }
}

export async function recordBioLinkClick(slug: string) {
  try {
    await prisma.bioLink.update({
      where: { slug },
      data: { clicks: { increment: 1 } }
    })
    return { success: true }
  } catch(error) {
    return { success: false }
  }
}
