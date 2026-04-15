'use client'

import { useState } from 'react'
import { CheckCircle2, PlayCircle, BookOpen, ChevronRight, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toggleLessonProgress } from './actions'
import Swal from 'sweetalert2'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LessonViewerClient({ course, progress, userId }: { course: any, progress: any[], userId: string }) {
  const allLessons = course.modules.flatMap((m: any) => m.lessons)
  const [activeLesson, setActiveLesson] = useState<any>(allLessons[0] || null)
  const [localProgress, setLocalProgress] = useState<any[]>(progress)
  const [loadingComplete, setLoadingComplete] = useState(false)

  const isCompleted = (lessonId: string) => {
    return localProgress.some(p => p.lesson_id === lessonId && p.completed)
  }

  const handleToggleComplete = async () => {
    if (!activeLesson) return
    setLoadingComplete(true)
    
    const currentlyCompleted = isCompleted(activeLesson.id)
    const newState = !currentlyCompleted

    const res = await toggleLessonProgress(userId, activeLesson.id, newState)
    if (res.success) {
      if (newState) {
        setLocalProgress([...localProgress, { lesson_id: activeLesson.id, completed: true }])
      } else {
        setLocalProgress(localProgress.filter(p => !(p.lesson_id === activeLesson.id && p.completed)))
      }
    } else {
      Swal.fire('Erreur', 'Impossible de sauvegarder la progression', 'error')
    }
    setLoadingComplete(false)
  }

  const completedCount = allLessons.filter((l: any) => isCompleted(l.id)).length
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0

  return (
    <div className="flex flex-col h-full lg:flex-row max-w-[1600px] mx-auto overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-full lg:w-[350px] xl:w-[400px] border-r border-gray-200 bg-white flex flex-col shrink-0 lg:h-[calc(100vh-80px)] overflow-y-auto hidden-scrollbar">
        <div className="p-6 pb-4 border-b border-gray-100 bg-[#FAFAFA] sticky top-0 z-10">
          <Link href="/client/library" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#0F7A60] transition-colors mb-4">
            <ArrowLeft size={16} /> Retour à la bibliothèque
          </Link>
          <h2 className="text-xl font-black text-[#1A1A1A] leading-tight mb-3">
            {course.title}
          </h2>
          
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
              <span className="text-gray-400">Progression</span>
              <span className="text-[#0F7A60]">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
               {/* eslint-disable-next-line */}
               <div className="h-full bg-[#0F7A60] transition-all duration-500" {...{ style: { width: `${progressPercent}%` } }} />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {course.modules.map((mod: any, mIdx: number) => (
            <div key={mod.id} className="space-y-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-2">
                Module {mIdx + 1} : {mod.title}
              </h3>
              <div className="space-y-1">
                {mod.lessons.map((lesson: any, lIdx: number) => {
                  const active = activeLesson?.id === lesson.id
                  const done = isCompleted(lesson.id)

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all ${
                        active 
                          ? 'bg-[#0F7A60]/5 border border-[#0F7A60]/20' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {done ? (
                          <CheckCircle2 size={18} className="text-[#0F7A60]" />
                        ) : (
                          <div className={`w-[18px] h-[18px] rounded-full border-2 ${active ? 'border-[#0F7A60]' : 'border-gray-300'}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold leading-snug ${active ? 'text-[#0F7A60]' : 'text-[#1A1A1A]'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
                          {lesson.video_url ? <PlayCircle size={12} /> : <BookOpen size={12} />}
                          {lesson.video_url ? 'Vidéo' : 'Lecture'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN PLAyER */}
      <div className="flex-1 lg:h-[calc(100vh-80px)] overflow-y-auto bg-gray-50">
        {activeLesson ? (
          <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* VIDEO PLAYER */}
            {activeLesson.video_url && (
              <div className="w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl relative border border-gray-200/50">
                <iframe 
                  src={activeLesson.video_url} 
                  title={activeLesson.title || "Video Lesson"}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0F7A60]/10 text-[#0F7A60] rounded-lg text-xs font-black uppercase tracking-widest mb-4">
                  {activeLesson.video_url ? 'Vidéo' : 'Lecture'}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] mb-4 tracking-tight">
                  {activeLesson.title}
                </h1>
                {activeLesson.content && (
                  <div className="prose prose-sm md:prose-base prose-emerald max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                )}
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <button
                  disabled={loadingComplete}
                  onClick={handleToggleComplete}
                  className={`w-full md:w-auto px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm ${
                    isCompleted(activeLesson.id)
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      : 'bg-[#1A1A1A] text-white hover:bg-black border border-transparent'
                  }`}
                >
                  {loadingComplete ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {isCompleted(activeLesson.id) ? 'Complété !' : 'Marquer comme terminé'}
                </button>
              </div>
            </div>

            {/* Pagination Navigation */}
            <div className="flex items-center justify-between py-6 border-t border-gray-200 mt-8">
               {/* Compute Next/Prev logic if desired */}
            </div>
            
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-10">
            <BookOpen size={48} className="text-gray-300 mb-4" />
            <h3 className="text-2xl font-black text-gray-400">Sélectionnez une leçon</h3>
            <p className="text-gray-500 mt-2">Choisissez une leçon dans le menu pour commencer.</p>
          </div>
        )}
      </div>

    </div>
  )
}
