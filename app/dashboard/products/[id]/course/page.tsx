import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, PlayCircle, FileText, GripVertical, Settings } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  video_url: string | null
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

// Course Builder Page
export default async function CourseBuilderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: product } = await supabase
    .from('Product')
    .select('*, store:Store!inner(user_id)')
    .eq('id', params.id)
    .single()

  if (!product || product.store.user_id !== user.id || product.type !== 'course') {
    redirect('/dashboard/products')
  }

  // Fetch Course details
  const { data: course } = await supabase
    .from('Course')
    .select('*, modules:CourseModule(*, lessons:CourseLesson(*))')
    .eq('product_id', product.id)
    .single()

  return (
    <div className="flex-1 pb-20 bg-[#FAFAF7] min-h-screen">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">{course?.title || product.name}</h1>
            <p className="text-sm font-medium text-emerald-600">Constructeur d'Académie (Mode Édition)</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold text-sm rounded-xl transition-all border border-gray-200">
            Aperçu Client
          </button>
          <button className="px-5 py-2.5 bg-[#0F7A60] hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2">
            <Plus size={16} /> Ajouter un Module
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-xs text-center text-gray-400 font-bold mb-8 uppercase tracking-widest">
          Gérez les chapitres et les leçons de votre formation
        </p>

        {(!course || !course.modules || course.modules.length === 0) ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8 text-[#0F7A60]" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Votre formation est vide</h3>
            <p className="text-gray-500 text-sm mt-2 mb-6">Commencez par ajouter votre premier module (chapitre) pour structurer votre cours.</p>
            <button className="px-6 py-3 bg-[#0F7A60] text-white font-bold text-sm rounded-xl shadow-lg hover:bg-emerald-700 transition">
              Créer le Module 1
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {course.modules.map((module: Module, idx: number) => (
              <div key={module.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <GripVertical className="text-gray-300 cursor-grab" size={18} />
                    <h3 className="font-black text-gray-900">Module {idx + 1} : {module.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-bold text-gray-500 hover:text-emerald-600 transition flex items-center gap-1">
                      <Settings size={14} /> Paramètres
                    </button>
                  </div>
                </div>
                
                <div className="p-2 space-y-2">
                  {(!module.lessons || module.lessons.length === 0) ? (
                    <div className="p-6 text-center text-gray-400 text-sm font-medium">
                      Aucune leçon dans ce module.
                    </div>
                  ) : (
                    module.lessons.map((lesson: Lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition group">
                        <div className="flex items-center gap-3">
                          <GripVertical className="text-gray-300 cursor-grab opacity-0 group-hover:opacity-100 transition" size={16} />
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lesson.video_url ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {lesson.video_url ? <PlayCircle size={16} /> : <FileText size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{lesson.title}</p>
                            <p className="text-xs text-gray-500">{lesson.video_url ? 'Leçon Vidéo' : 'Support / Article'}</p>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition">
                          Éditer
                        </button>
                      </div>
                    ))
                  )}
                  
                  <button className="w-full mt-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition flex items-center justify-center gap-2">
                    <Plus size={14} /> Ajouter une leçon
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
