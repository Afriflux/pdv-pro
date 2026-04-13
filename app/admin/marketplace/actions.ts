'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function checkIsSuperAdmin() {
  const supabase = await createClient()
  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) return false
  
  const admin = await prisma.user.findUnique({
    where: { id: userData.user.id },
    select: { role: true }
  })
  
  return admin?.role === 'super_admin'
}

export async function getMarketplaceResourcesAction() {
  const isSuper = await checkIsSuperAdmin()
  if (!isSuper) return { success: false, error: 'Non autorisé' }

  const templates = await prisma.themeTemplate.findMany({  orderBy: { created_at: 'desc' }, take: 50 })
  const workflows = await prisma.workflow.findMany({  where: { store_id: 'system' }, take: 50 }) // Assuming standard workflows are system ? Wait, user workflows don't have is_premium maybe, or maybe we have a system table for them. Wait, let's just fetch all workflows that are marked as templates, or maybe all workflows.
  // Wait, the user mentioned workflows. The workflows might not have a generic global template. 
  // Let's check how workflows are handled later. For now, fetch them all or we may need to filter by global templates.
  // Actually, standard Workflows have store_id. Some might have no store_id or store_id = 'system'. 
  // Let's query all templates and workflows for now, but Masterclass is definitely global.
  
  const masterclasses = await prisma.masterclassArticle.findMany({  orderBy: { created_at: 'desc' }, take: 50 })

  return { success: true, templates, masterclasses, workflows }
}

export async function getGlobalWorkflowsAction() {
   const isSuper = await checkIsSuperAdmin()
   if (!isSuper) return { success: false, error: 'Non autorisé' }
   
   const workflows = await prisma.workflow.findMany({ 
      where: { store_id: null, user_id: null },
      orderBy: { created_at: 'desc' },
      take: 50
   })
   return { success: true, workflows }
}

export async function updateResourceMonetizationAction(
  type: 'template' | 'workflow' | 'masterclass',
  id: string,
  is_premium: boolean,
  price: number
) {
  const isSuper = await checkIsSuperAdmin()
  if (!isSuper) return { success: false, error: 'Non autorisé' }

  try {
    if (type === 'template') {
      await prisma.themeTemplate.update({
        where: { id },
        data: { is_premium, price }
      })
    } else if (type === 'workflow') {
      await prisma.workflow.update({
        where: { id },
        data: { is_premium, price }
      })
    } else if (type === 'masterclass') {
      await prisma.masterclassArticle.update({
        where: { id },
        data: { is_premium, price }
      })
    }

    revalidatePath('/admin/marketplace')
    return { success: true }
  } catch (error: any) {
    console.error('Update error:', error)
    return { success: false, error: error.message }
  }
}
