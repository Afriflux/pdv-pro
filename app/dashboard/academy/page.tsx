import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AcademyClient from './AcademyClient'

export default async function AcademyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, name: true }
  })

  if (!store) {
    return (
      <div className="p-8 text-center text-slate-500">
        Veuillez configurer votre boutique avant d'accéder à Yayyam Academy.
      </div>
    )
  }

  // Produits pour lesquels on peut créer un cours
  const products = await prisma.product.findMany({
    where: { store_id: store.id },
    select: { id: true, name: true }
  })

  // Cours existants
  const coursesDB = await prisma.course.findMany({
    where: { product: { store_id: store.id } },
    include: {
      product: { select: { name: true } },
      modules: {
        orderBy: { order_index: 'asc' },
        include: {
          lessons: { orderBy: { order_index: 'asc' } }
        }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  const courses = coursesDB.map(c => ({
    id: c.id,
    product_id: c.product_id,
    product_name: c.product.name,
    title: c.title,
    description: c.description,
    modules: c.modules.map(m => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map(l => ({
        id: l.id,
        title: l.title,
        video_url: l.video_url
      }))
    }))
  }))

  return (
    <div className="animate-in fade-in duration-500">
      <AcademyClient storeId={store.id} courses={courses} products={products} />
    </div>
  )
}
