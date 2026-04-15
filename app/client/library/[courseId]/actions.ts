'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function toggleLessonProgress(userId: string, lessonId: string, completed: boolean) {
  try {
    const existing = await prisma.userLessonProgress.findFirst({
      where: { user_id: userId, lesson_id: lessonId }
    })

    if (existing) {
      await prisma.userLessonProgress.update({
        where: { id: existing.id },
        data: {
          completed,
          completed_at: completed ? new Date() : null
        }
      })
    } else {
      await prisma.userLessonProgress.create({
        data: {
          user_id: userId,
          lesson_id: lessonId,
          completed,
          completed_at: completed ? new Date() : null
        }
      })
    }

    revalidatePath(`/client/library`)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Internal Server Error' }
  }
}
