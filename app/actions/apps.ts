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

export async function getMarketplaceApps() {
  try {
    const apps = await prisma.marketplaceApp.findMany({
      orderBy: { created_at: 'desc' }
    })
    return apps
  } catch (error) {
    console.error('Error fetching apps:', error)
    return []
  }
}

export async function createMarketplaceApp(data: any) {
  await checkAdmin()
  try {
    const app = await prisma.marketplaceApp.create({
      data
    })
    return { success: true, app }
  } catch (error: any) {
    console.error('Create app error:', error)
    return { success: false, error: "Erreur lors de la création de l'application" }
  }
}

export async function updateMarketplaceApp(id: string, data: any) {
  await checkAdmin()
  try {
    const app = await prisma.marketplaceApp.update({
      where: { id },
      data
    })
    return { success: true, app }
  } catch (error: any) {
    console.error('Update app error:', error)
    return { success: false, error: "Erreur lors de la mise à jour" }
  }
}

export async function toggleMarketplaceApp(id: string, active: boolean) {
  await checkAdmin()
  try {
    await prisma.marketplaceApp.update({
      where: { id },
      data: { active }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erreur lors de la modification du statut" }
  }
}

export async function deleteMarketplaceApp(id: string) {
  await checkAdmin()
  try {
    await prisma.marketplaceApp.delete({
      where: { id }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Erreur lors de la suppression" }
  }
}
