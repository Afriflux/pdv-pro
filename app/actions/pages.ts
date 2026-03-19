'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Active/Désactive une page de vente
 */
export async function togglePageStatus(id: string, currentStatus: boolean) {
  try {
    await prisma.salePage.update({
      where: { id },
      data: { 
        active: !currentStatus,
        updated_at: new Date()
      }
    })
    revalidatePath('/dashboard/pages')
    return { success: true }
  } catch (error: unknown) {
    console.error('Erreur toggle status page:', error)
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Supprime une page de vente
 */
export async function deletePage(id: string) {
  try {
    await prisma.salePage.delete({
      where: { id }
    })
    revalidatePath('/dashboard/pages')
    return { success: true }
  } catch (error: unknown) {
    console.error('Erreur suppression page:', error)
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Duplique une page de vente
 */
export async function duplicatePage(id: string) {
  try {
    const page = await prisma.salePage.findUnique({
      where: { id }
    })

    if (!page) throw new Error("Page introuvable")

    const newSlug = `${page.slug}-copy-${Date.now().toString().slice(-4)}`
    
    const dataToCopy = { ...page } as any
    delete dataToCopy.id
    delete dataToCopy.created_at
    delete dataToCopy.updated_at

    const newPage = await prisma.salePage.create({
      data: {
        ...dataToCopy,
        title: `${page.title} (Copie)`,
        slug: newSlug,
        active: false,
      }
    })

    revalidatePath('/dashboard/pages')
    return { success: true, data: newPage }
  } catch (error: unknown) {
    console.error('Erreur duplication page:', error)
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
