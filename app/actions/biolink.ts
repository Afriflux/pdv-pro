'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getBioLink(userId: string) {
  try {
    const bioLink = await prisma.bioLink.findUnique({
      where: { user_id: userId }
    })
    return { success: true, data: bioLink }
  } catch (error) {
    console.error('Error fetching BioLink:', error)
    return { success: false, error: 'Impossible de charger le BioLink' }
  }
}

export async function saveBioLink(userId: string, data: any) {
  try {
    // Generate a slug if missing
    let slug = data.slug
    if (!slug) {
      slug = data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `user-${userId.substring(0, 8)}`
    }
    
    // Check slug uniqueness if it's changing or new
    const existingSlug = await prisma.bioLink.findFirst({
      where: { slug, NOT: { user_id: userId } }
    })
    if (existingSlug) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`
    }

    const bioLink = await prisma.bioLink.upsert({
      where: { user_id: userId },
      update: {
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
        phone_text: data.phone_text || 'Appeler Maintenant 📞'
      },
      create: {
        user_id: userId,
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
        phone_text: data.phone_text || 'Appeler Maintenant 📞'
      }
    })

    revalidatePath('/dashboard/links')
    revalidatePath('/portal/links')
    revalidatePath(`/bio/${bioLink.slug}`)

    return { success: true, data: bioLink }
  } catch (error) {
    console.error('Error saving BioLink:', error)
    return { success: false, error: 'Erreur lors de la sauvegarde du BioLink' }
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
