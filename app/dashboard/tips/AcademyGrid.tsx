'use client'

import { useState, useEffect } from 'react'
import { X, Clock, ChevronRight } from 'lucide-react'

// interface Tip removed as it's not being used and TS complains

interface Article {
  id:    number
  emoji: string
  title: string
  intro: string
  color: string
  category: string
  readTime: string
  tips:  any
}

import { markMasterclassCompleted } from '@/app/actions/masterclass'
import { CheckCircle2 } from 'lucide-react'

export default function AcademyGrid({ articles, completedIds: initialCompletedIds = [] }: { articles: Article[], completedIds?: string[] }) {
  const [localCompletedIds, setLocalCompletedIds] = useState<string[]>(initialCompletedIds)
  const [filter, setFilter] = useState('Tous')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false)
  
  const categories = ['Tous', ...Array.from(new Set(articles.map(a => a.category)))]
  
  const filtered = filter === 'Tous' ? articles : articles.filter(a => a.category === filter)

  // Scroll logic for the modal
  const [readProgress, setReadProgress] = useState(0)

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight <= clientHeight) {
      setReadProgress(100);
    } else {
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
      setReadProgress(progress)
    }
  }

  // Prevent background scroll when modal open
  useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = 'hidden'
      setReadProgress(0) // reset progress 
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedArticle])

  return (
    <div>
      {/* ── FILTERS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-black whitespace-nowrap transition-all ${
              filter === cat 
                ? 'bg-ink text-white shadow-md transform scale-105' 
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-ink'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(article => (
          <div 
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full transform hover:-translate-y-1"
          >
            {/* Image Placeholder / Banner */}
            <div className={`h-40 w-full ${article.color} relative overflow-hidden flex items-center justify-center isolate border-b border-gray-50`}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="text-6xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 z-10 drop-shadow-md">
                {article.emoji}
              </div>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-ink text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 z-10 shadow-sm border border-gray-100">
                👁️ {(article.id.toString().charCodeAt(0) * 7) % 80 + 12}
              </div>
              
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-ink text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 z-10 shadow-sm border border-gray-100">
                <Clock size={12} className="text-gray-400" /> {article.readTime}
              </div>
              <div className="absolute top-3 left-3 bg-[#0F7A60] text-white text-[10px] font-black px-2.5 py-1 rounded-lg z-10 uppercase tracking-wide shadow-sm">
                {article.category}
              </div>
              {localCompletedIds.includes(article.id.toString()) && (
                <div className="absolute top-3 right-1/2 translate-x-1/2 bg-emerald-500 text-white p-1 rounded-full z-10 shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 size={16} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-black text-ink leading-tight mb-3 group-hover:text-[#0F7A60] transition-colors">{article.title}</h3>
              <p className="text-[13px] text-gray-500 line-clamp-2 mb-6 flex-1 leading-relaxed">{article.intro}</p>
              
              <div className="flex items-center text-ink font-black text-sm mt-auto bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl w-fit transition-colors">
                {localCompletedIds.includes(article.id.toString()) ? (
                   <span className="text-[#0F7A60] flex items-center">Relire <ChevronRight size={16} className="ml-1" /></span>
                ) : (
                   <span>Commencer <ChevronRight size={16} className="ml-1 transform group-hover:translate-x-1" /></span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL LECTURE FOCUS ── */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] lg:max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
            
            {/* Header Modal */}
            <div className="relative flex-shrink-0">
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 z-50">
                <div 
                  className="h-full bg-[#0F7A60] transition-all duration-150 ease-out rounded-r-full"
                  ref={el => { if (el) el.style.width = `${readProgress}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 bg-white/95 backdrop-blur-xl absolute top-1.5 left-0 w-full z-40">
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wide">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs font-bold text-gray-400 hidden sm:inline-block">
                    {readProgress >= 98 ? '🎉 Terminé' : `${Math.round(readProgress)}% lu`}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedArticle(null)}
                  title="Fermer"
                  aria-label="Fermer"
                  className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 hover:text-red-500 text-ink rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div 
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-24 sm:px-12 scroll-smooth bg-[#FAFAF7] custom-scrollbar"
            >
              {/* Article Header */}
              <div className="text-center mb-14">
                <div className={`w-28 h-28 mx-auto ${selectedArticle.color} border border-white rounded-[2rem] flex items-center justify-center text-6xl mb-6 shadow-lg shadow-emerald-900/5 transform -rotate-3 hover:rotate-0 transition-transform duration-300`}>
                  {selectedArticle.emoji}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink leading-[1.1] tracking-tight mb-6">
                  {selectedArticle.title}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto font-medium">
                  {selectedArticle.intro}
                </p>
              </div>

              {/* Article Steps */}
              <div className="space-y-8 max-w-3xl mx-auto pb-16">
                {(Array.isArray(selectedArticle.tips) ? selectedArticle.tips : (typeof selectedArticle.tips === 'string' ? JSON.parse(selectedArticle.tips) : [])).map((tip: any) => (
                  <div key={tip.number} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#0F7A60]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6 relative z-10">
                      <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#0F7A60] to-emerald-500 text-white text-2xl font-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        {tip.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-ink mb-3 leading-snug">{tip.title}</h3>
                        
                        {tip.videoUrl && (
                           <div className="w-full aspect-video mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-black">
                             <iframe 
                               src={tip.videoUrl.replace('watch?v=', 'embed/')} 
                               title={`Vidéo explicative: ${tip.title}`}
                               className="w-full h-full" 
                               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                               allowFullScreen 
                             />
                           </div>
                        )}
                        {!tip.videoUrl && tip.imageUrl && (
                           <div className="w-full h-48 sm:h-64 mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                             <img src={tip.imageUrl} alt={tip.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                           </div>
                        )}
                        
                        <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-wrap">{tip.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Completion Block */}
              <div className={`max-w-2xl mx-auto pb-20 text-center transition-all duration-700 ease-out transform ${readProgress > 95 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {localCompletedIds.includes(selectedArticle.id.toString()) ? (
                  <>
                    <div className="inline-block bg-gold/10 text-gold px-5 py-2 rounded-full text-xs font-black mb-5 uppercase tracking-widest border border-gold/20 flex items-center gap-2 mx-auto w-fit">
                      <CheckCircle2 size={16} /> Mission Complète
                    </div>
                    <h3 className="text-3xl font-black text-ink mb-3">Bravo, vous maîtrisez ce sujet !</h3>
                    <p className="text-gray-500 mb-8 font-medium">Appliquez ces stratégies dès aujourd'hui sur votre boutique PDV Pro.</p>
                    <button 
                      onClick={() => setSelectedArticle(null)}
                      className="bg-gray-100 hover:bg-gray-200 text-ink font-black px-10 py-4 rounded-2xl transition-all shadow-sm active:scale-95 text-lg"
                    >
                      Fermer la leçon
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl font-black text-ink mb-3">Avez-vous bien assimilé ce cours ?</h3>
                    <p className="text-gray-500 mb-8 font-medium">Marquez-le comme lu pour augmenter votre jauge de progression !</p>
                    <button 
                      disabled={isMarkingCompleted}
                      onClick={async () => {
                        setIsMarkingCompleted(true)
                        const res = await markMasterclassCompleted(selectedArticle.id.toString())
                        if (res.success) {
                          setLocalCompletedIds(prev => [...prev, selectedArticle.id.toString()])
                        }
                        setIsMarkingCompleted(false)
                        setSelectedArticle(null)
                      }}
                      className="bg-[#0F7A60] hover:bg-emerald-700 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/10 active:scale-95 text-lg flex items-center justify-center gap-2 mx-auto min-w-[300px]"
                    >
                      {isMarkingCompleted ? "Validation en cours..." : "✨ J'ai compris la leçon !"}
                    </button>
                  </>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  )
}
