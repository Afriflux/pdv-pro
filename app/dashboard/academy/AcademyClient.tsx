'use client'

import React, { useState } from 'react'
import { GraduationCap, BookOpen, PlayCircle, Plus, Trash, FolderPlus, Video, X, Loader2, ArrowRight } from 'lucide-react'
import { createCourseAction, createModuleAction, createLessonAction, deleteLessonAction, deleteModuleAction, deleteCourseAction } from './actions'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'

interface LessonData {
  id: string
  title: string
  video_url: string | null
}

interface ModuleData {
  id: string
  title: string
  lessons: LessonData[]
}

interface CourseData {
  id: string
  product_id: string
  product_name: string
  title: string
  description: string | null
  modules: ModuleData[]
}

interface Product {
  id: string
  name: string
}

export default function AcademyClient({ storeId, courses, products }: { storeId: string, courses: CourseData[], products: Product[] }) {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(courses[0] || null)
  
  // Modals state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Forms
  const [courseForm, setCourseForm] = useState({ product_id: '', title: '', description: '' })
  const [moduleTitle, setModuleTitle] = useState('')
  const [lessonForm, setLessonForm] = useState({ module_id: '', title: '', video_url: '' })

  const handleCreateCourse = async () => {
     if (!courseForm.product_id || !courseForm.title) {
       toast.error("Veuillez remplir le produit lié et le titre de la formation.")
       return
     }
     setIsSubmitting(true)
     const res = await createCourseAction(storeId, courseForm)
     if (res.success) {
       toast.success("Formation créée avec succès !")
       setIsCourseModalOpen(false)
       setCourseForm({ product_id: '', title: '', description: '' })
       router.refresh()
     } else {
       toast.error(res.error)
     }
     setIsSubmitting(false)
  }

  const handleCreateModule = async () => {
    if (!selectedCourse || !moduleTitle) return
    setIsSubmitting(true)
    const res = await createModuleAction(selectedCourse.id, moduleTitle)
    if (res.success) {
      toast.success("Module ajouté.")
      setIsModuleModalOpen(false)
      setModuleTitle('')
      router.refresh()
    }
    setIsSubmitting(false)
  }

  const handleCreateLesson = async () => {
    if (!lessonForm.module_id || !lessonForm.title) return
    setIsSubmitting(true)
    const res = await createLessonAction(lessonForm.module_id, { title: lessonForm.title, video_url: lessonForm.video_url, content: '' })
    if (res.success) {
      toast.success("Leçon ajoutée.")
      setIsLessonModalOpen(false)
      setLessonForm({ module_id: '', title: '', video_url: '' })
      router.refresh()
    }
    setIsSubmitting(false)
  }

  const handleDeleteCourse = async (id: string) => {
    const confirm = await Swal.fire({ title: 'Confirmation', text: 'Supprimer toute la formation ?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler' })
    if(!confirm.isConfirmed) return
    setIsSubmitting(true)
    await deleteCourseAction(id)
    toast.success("Formation supprimée.")
    if(selectedCourse?.id === id) setSelectedCourse(null)
    router.refresh()
    setIsSubmitting(false)
  }

  const handleDeleteModule = async (id: string) => {
    const confirm = await Swal.fire({ title: 'Confirmation', text: 'Supprimer ce module ?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler' })
    if(!confirm.isConfirmed) return
    setIsSubmitting(true)
    await deleteModuleAction(id)
    router.refresh()
    setIsSubmitting(false)
  }

  const handleDeleteLesson = async (id: string) => {
    const confirm = await Swal.fire({ title: 'Confirmation', text: 'Supprimer cette vidéo ?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler' })
    if(!confirm.isConfirmed) return
    setIsSubmitting(true)
    await deleteLessonAction(id)
    router.refresh()
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6 font-sans pb-32">
       {/* HEADER */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-3 bg-gradient-to-br from-[#0F7A60] to-emerald-800 text-white rounded-2xl shadow-lg">
                <GraduationCap size={26} />
             </div>
             <h1 className="text-3xl font-display font-black text-ink tracking-tight">Yayyam Academy</h1>
          </div>
          <p className="text-dust font-medium text-sm mt-1 max-w-xl">
             Créez un catalogue e-Learning. Liez vos vidéos privées à vos produits digitaux et générez passivement des revenus.
          </p>
        </div>
        <button 
          onClick={() => setIsCourseModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-ink hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>Nouvelle Formation</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
         {/* SIDEBAR COURSES LIST */}
         <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <h3 className="text-xs font-black text-dust uppercase tracking-widest pl-2 mb-1">Vos Formations</h3>
            {courses.length === 0 ? (
               <div className="p-6 bg-white border border-line border-dashed rounded-3xl text-center">
                  <p className="text-slate text-sm font-medium">Vous n'avez pas encore créé de formation.</p>
               </div>
            ) : (
              courses.map(course => (
                 <div 
                   key={course.id} 
                   onClick={() => setSelectedCourse(course)}
                   className={`p-4 rounded-2xl cursor-pointer transition flex justify-between items-center ${selectedCourse?.id === course.id ? 'bg-[#0F7A60] text-emerald-50 shadow-md' : 'bg-white border border-line text-ink hover:bg-slate-50'}`}
                 >
                    <div>
                       <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${selectedCourse?.id === course.id ? 'text-emerald-300' : 'text-dust'}`}>{course.product_name}</p>
                       <h4 className={`font-black text-base line-clamp-1 ${selectedCourse?.id === course.id ? 'text-white' : 'text-ink'}`}>{course.title}</h4>
                    </div>
                    {selectedCourse?.id === course.id && <ArrowRight size={20} className="text-white shrink-0" />}
                 </div>
              ))
            )}
         </div>

         {/* MAIN EDITOR */}
         <div className="w-full lg:w-2/3">
            {!selectedCourse ? (
               <div className="bg-white border border-line rounded-3xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                  <BookOpen size={64} className="text-slate-100 mb-6" />
                  <h2 className="text-xl font-black text-ink">Sélectionnez une formation</h2>
                  <p className="text-slate text-sm mt-2 max-w-sm">Cliquez sur une formation à gauche pour commencer à construire vos modules et importer vos liens vidéos.</p>
               </div>
            ) : (
               <div className="bg-white border border-line rounded-3xl p-6 shadow-sm min-h-[500px] flex flex-col">
                  
                  <div className="flex justify-between items-start mb-6 border-b border-line pb-6">
                     <div>
                        <div className="inline-block px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg mb-2">Produit Lié: {selectedCourse.product_name}</div>
                        <h2 className="text-2xl font-black text-ink">{selectedCourse.title}</h2>
                        <p className="text-sm font-medium text-slate mt-1">{selectedCourse.description}</p>
                     </div>
                     <button onClick={() => handleDeleteCourse(selectedCourse.id)} title="Delete Course" className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-xl hover:bg-red-50 transition">
                        <Trash size={20} />
                     </button>
                  </div>

                  <div className="flex-1 space-y-6">
                     {selectedCourse.modules.length === 0 ? (
                        <div className="text-center py-12">
                           <FolderPlus size={40} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-sm font-bold text-slate">Aucun module dans cette formation.</p>
                        </div>
                     ) : (
                        selectedCourse.modules.map(mod => (
                           <div key={mod.id} className="bg-[#FAFAF7] border border-line rounded-2xl overflow-hidden">
                              <div className="flex items-center justify-between p-4 bg-white border-b border-line group">
                                 <h3 className="font-black text-ink flex items-center gap-2"><BookOpen size={16} className="text-[#0F7A60]"/> {mod.title}</h3>
                                 <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => { setLessonForm({ module_id: mod.id, title: '', video_url: '' }); setIsLessonModalOpen(true); }}
                                      className="text-xs font-bold text-[#0F7A60] bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 flex items-center gap-1 transition"
                                    >
                                       <Video size={14} /> Leçon
                                    </button>
                                    <button onClick={() => handleDeleteModule(mod.id)} title="Delete Module" className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1.5"><Trash size={16}/></button>
                                 </div>
                              </div>
                              <div className="p-2">
                                 {mod.lessons.length === 0 ? (
                                    <p className="text-xs text-dust p-3 italic">Ce module est vide.</p>
                                 ) : (
                                    <div className="space-y-1">
                                       {mod.lessons.map(lesson => (
                                          <div key={lesson.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white border border-transparent hover:border-line transition group">
                                             <div className="flex items-center gap-3">
                                                <PlayCircle size={18} className="text-slate-300" />
                                                <div>
                                                   <p className="text-sm font-bold text-ink">{lesson.title}</p>
                                                   {lesson.video_url && <a href={lesson.video_url} target="_blank" className="text-[10px] text-blue-500 hover:underline">Lien Vidéo VOD</a>}
                                                </div>
                                             </div>
                                             <button onClick={() => handleDeleteLesson(lesson.id)} title="Delete Lesson" className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2"><Trash size={14}/></button>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  <div className="pt-6 border-t border-line mt-6">
                     <button 
                       onClick={() => setIsModuleModalOpen(true)}
                       className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-2"
                     >
                        <FolderPlus size={18} /> Ajouter un Module / Chapitre
                     </button>
                  </div>

               </div>
            )}
         </div>
      </div>

      {/* CREATE COURSE MODAL */}
      {isCourseModalOpen && (
         <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-ink">Nouvelle Formation</h2>
               <button onClick={() => setIsCourseModalOpen(false)} title="Close" className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dust uppercase mb-1.5">Produit Associé (Trigger)</label>
                <select value={courseForm.product_id} title="Attacher à un produit" onChange={e => setCourseForm({...courseForm, product_id: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 text-sm outline-none">
                   <option value="">Sélectionner un produit existant</option>
                   {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <p className="text-[10px] text-slate mt-1">L'acheteur obtiendra accès à cette formation après l'achat de ce produit.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-dust uppercase mb-1.5">Titre de la formation</label>
                <input type="text" value={courseForm.title} title="Titre" placeholder="Titre de la formation" onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dust uppercase mb-1.5">Description optionnelle</label>
                <textarea value={courseForm.description} title="Description" placeholder="Description de la formation" onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 text-sm min-h-[80px] outline-none resize-none" />
              </div>
              <button onClick={handleCreateCourse} disabled={isSubmitting || !courseForm.title || !courseForm.product_id} className="w-full bg-[#0F7A60] text-white font-black py-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                 {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Créer l\'espace de formation'}
              </button>
            </div>
          </div>
         </div>
      )}

      {/* CREATE MODULE MODAL */}
      {isModuleModalOpen && (
         <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-ink">Nouveau Chapitre (Module)</h2>
               <button onClick={() => setIsModuleModalOpen(false)} title="Close" className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dust uppercase mb-1.5">Titre du module</label>
                <input type="text" placeholder="Ex: Semaine 1 - Les bases" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} className="w-full border border-line rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <button onClick={handleCreateModule} disabled={isSubmitting || !moduleTitle} className="w-full bg-ink text-white font-black py-4 rounded-xl disabled:opacity-50 flex items-center justify-center">
                 {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Ajouter le module'}
              </button>
            </div>
          </div>
         </div>
      )}

      {/* CREATE LESSON MODAL */}
      {isLessonModalOpen && (
         <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-ink">Nouvelle Vidéo (Leçon)</h2>
               <button onClick={() => setIsLessonModalOpen(false)} title="Close" className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dust uppercase mb-1.5">Titre de la leçon</label>
                <input autoFocus type="text" placeholder="Ex: 1.1 Introduction au marché" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dust uppercase mb-1.5">Lien de la Vidéo (Vimeo / YouTube / Drive)</label>
                <input type="url" placeholder="https://" value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} className="w-full border border-line rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <button onClick={handleCreateLesson} disabled={isSubmitting || !lessonForm.title} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                 {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Video size={18} /> Uploader l'accès</>}
              </button>
            </div>
          </div>
         </div>
      )}

    </div>
  )
}
