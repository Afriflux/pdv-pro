'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createCourseAction(storeId: string, data: { product_id: string; title: string; description: string }) {
  try {
    // Vérifier que le produit appartient bien au vendeur
    const product = await prisma.product.findFirst({
      where: { id: data.product_id, store_id: storeId }
    })
    if (!product) return { success: false, error: 'Produit non trouvé ou accès refusé' }

    const newCourse = await prisma.course.create({
      data: {
        product_id: data.product_id,
        title: data.title,
        description: data.description
      }
    })

    revalidatePath('/dashboard/academy')
    return { success: true, courseId: newCourse.id }
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'Une formation existe déjà pour ce produit.' }
    return { success: false, error: error.message }
  }
}

export async function createModuleAction(courseId: string, title: string) {
  try {
    const modsCount = await prisma.courseModule.count({ where: { course_id: courseId } })
    await prisma.courseModule.create({
      data: {
        course_id: courseId,
        title,
        order_index: modsCount
      }
    })
    revalidatePath('/dashboard/academy')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createLessonAction(moduleId: string, data: { title: string; video_url: string; content: string }) {
  try {
    const lessonsCount = await prisma.courseLesson.count({ where: { module_id: moduleId } })
    await prisma.courseLesson.create({
      data: {
        module_id: moduleId,
        title: data.title,
        video_url: data.video_url,
        content: data.content,
        order_index: lessonsCount
      }
    })
    revalidatePath('/dashboard/academy')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteLessonAction(lessonId: string) {
  try {
    await prisma.courseLesson.delete({ where: { id: lessonId } })
    revalidatePath('/dashboard/academy')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteModuleAction(moduleId: string) {
  try {
    await prisma.courseModule.delete({ where: { id: moduleId } })
    revalidatePath('/dashboard/academy')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteCourseAction(courseId: string) {
  try {
    await prisma.course.delete({ where: { id: courseId } })
    revalidatePath('/dashboard/academy')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
