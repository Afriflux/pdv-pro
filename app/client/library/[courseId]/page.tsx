import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LessonViewerClient from './LessonViewerClient'

export const dynamic = 'force-dynamic'

export default async function CoursePage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Fetch the course
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      modules: {
        orderBy: { order_index: 'asc' },
        include: {
          lessons: {
            orderBy: { order_index: 'asc' }
          }
        }
      }
    }
  })

  if (!course) {
    redirect('/client/library')
  }

  // 2. Security Check: Did the user buy the associated product?
  const access = await prisma.digitalAccess.findFirst({
    where: {
      product_id: course.product_id,
      order: {
        buyer_id: user.id
      },
      revoked: false
    }
  })

  if (!access) {
    redirect('/client/library')
  }

  // 3. Fetch User Progress
  const progress = await prisma.userLessonProgress.findMany({
    where: {
      user_id: user.id,
      lesson: {
        module: {
          course_id: course.id
        }
      }
    }
  })

  return (
    <div className="animate-in fade-in duration-500 w-full min-h-[calc(100vh-80px)] bg-[#FAFAFA]">
      <LessonViewerClient course={course} progress={progress} userId={user.id} />
    </div>
  )
}
