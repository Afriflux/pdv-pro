'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Fetch available templates for a specific store/user based on their roles
 */
export async function getTemplates(storeId: string, userRole: string, vendorType: string) {
  try {
    // Determine the roles to filter by. "all" is always included.
    const roles = ['all', userRole, vendorType]

    const templates = await prisma.themeTemplate.findMany({
      where: {
        active: true,
        OR: [
          { is_global: true },
          { store_id: storeId }
        ],
        // PostgreSQL array overlaps. 
        // Prisma doesn't have a direct "overlaps" for String[] in some older versions, 
        // but we can use raw query if needed, or hasSome feature
        allowed_roles: {
          hasSome: roles
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return { success: true, data: templates }
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Import a template from JSON
 */
export async function importTemplate(data: any, storeId: string) {
  try {
    const newTemplate = await prisma.themeTemplate.create({
      data: {
        name: data.name || 'Template importé',
        description: data.description || '',
        type: data.type || 'sale_page',
        category: data.category || 'general',
        sub_category: data.sub_category || null,
        niche: data.niche || null,
        preview_url: data.preview_url || null,
        data: data.data || {},
        is_premium: data.is_premium || false,
        is_global: false, // Imported by user, so it's private by default
        store_id: storeId,
        allowed_roles: ['all']
      }
    })

    revalidatePath('/dashboard/apps/templates')
    return { success: true, data: newTemplate }
  } catch (error: any) {
    console.error('Error importing template:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Toggle active state or delete a private template
 */
export async function deleteTemplate(templateId: string, storeId: string) {
  try {
    // Only allow deletion if it belongs to the store
    await prisma.themeTemplate.delete({
      where: {
        id: templateId,
        store_id: storeId
      }
    })
    
    revalidatePath('/dashboard/apps/templates')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'Cannot delete template' }
  }
}

/**
 * Fetch a single template by ID
 */
export async function getTemplateById(templateId: string) {
  try {
    const template = await prisma.themeTemplate.findUnique({
      where: { id: templateId }
    })
    if (!template) return { success: false, error: 'Template not found' }
    return { success: true, data: template }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
