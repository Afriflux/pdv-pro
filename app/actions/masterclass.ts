'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Middleware de vérification Admin
async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')
  
  // Vérification du rôle admin (à adapter selon votre logique)
  const role = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  if (role?.role !== 'super_admin' && role?.role !== 'gestionnaire') {
    throw new Error('Accès refusé')
  }
}

export async function getMasterclassArticles(adminMode = false) {
  try {
    const articles = await prisma.masterclassArticle.findMany({
      where: adminMode ? undefined : { is_active: true },
      orderBy: { created_at: 'desc' }
    })
    return articles
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

export async function getMasterclassArticleById(id: string) {
  try {
    return await prisma.masterclassArticle.findUnique({
      where: { id }
    })
  } catch (error) {
    console.error('Error fetching article by id:', error)
    return null
  }
}

export async function createMasterclassArticle(data: {
  title: string
  emoji: string
  color: string
  category: string
  readTime: string
  intro: string
  tips: any
  is_active: boolean
}) {
  await checkAdmin()
  try {
    const article = await prisma.masterclassArticle.create({
      data
    })
    return { success: true, article }
  } catch (error: any) {
    console.error('Create article error:', error)
    return { success: false, error: "Erreur lors de la création de l'article" }
  }
}

export async function updateMasterclassArticle(id: string, data: any) {
  await checkAdmin()
  try {
    const article = await prisma.masterclassArticle.update({
      where: { id },
      data
    })
    return { success: true, article }
  } catch (error: any) {
    console.error('Update article error:', error)
    return { success: false, error: "Erreur lors de la mise à jour" }
  }
}

export async function toggleMasterclassArticle(id: string, is_active: boolean) {
  await checkAdmin()
  try {
    await prisma.masterclassArticle.update({
      where: { id },
      data: { is_active }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erreur lors de la modification de l'état" }
  }
}

export async function deleteMasterclassArticle(id: string) {
  await checkAdmin()
  try {
    await prisma.masterclassArticle.delete({
      where: { id }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erreur lors de la suppression" }
  }
}

// ── GAMIFICATION: PROGRESSION ──

export async function markMasterclassCompleted(articleId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autorisé')

    await prisma.masterclassProgress.upsert({
      where: {
        user_id_article_id: {
          user_id: user.id,
          article_id: articleId
        }
      },
      update: {},
      create: {
        user_id: user.id,
        article_id: articleId
      }
    })
    
    // We don't revalidatePath here because it will refresh the page abruptly 
    // it's better purely for client side state OR we let the client refresh state
    return { success: true }
  } catch (error) {
    console.error('Gamification tracking error:', error)
    return { success: false, error: "Impossible de marquer comme terminé" }
  }
}
