'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')
  
  const role = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  if (role?.role !== 'super_admin' && role?.role !== 'gestionnaire') {
    throw new Error('Accès refusé')
  }
}

export async function getThemeTemplates() {
  try {
    const templates = await prisma.themeTemplate.findMany({ take: 50, 
      where: { is_global: true },
      orderBy: { created_at: 'desc' }
    })
    return templates
  } catch (error) {
    console.error('Error fetching theme templates:', error)
    return []
  }
}

export async function createThemeTemplate(data: any) {
  await checkAdmin()
  try {
    const template = await prisma.themeTemplate.create({
      data: {
        ...data,
        is_global: true
      }
    })
    return { success: true, template }
  } catch (error: any) {
    console.error('Create theme template error:', error)
    return { success: false, error: "Erreur lors de la création du thème" }
  }
}

export async function updateThemeTemplate(id: string, data: any) {
  await checkAdmin()
  try {
    const template = await prisma.themeTemplate.update({
      where: { id },
      data
    })
    return { success: true, template }
  } catch (error: any) {
    console.error('Update theme template error:', error)
    return { success: false, error: "Erreur lors de la mise à jour" }
  }
}

export async function toggleThemeTemplate(id: string, active: boolean) {
  await checkAdmin()
  try {
    await prisma.themeTemplate.update({
      where: { id },
      data: { active }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erreur lors de la modification du statut" }
  }
}

export async function deleteThemeTemplate(id: string) {
  await checkAdmin()
  try {
    await prisma.themeTemplate.delete({
      where: { id }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erreur lors de la suppression" }
  }
}
