'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, CheckCircle2, Clock, Loader2, Send, Search, AlertCircle, Zap, BarChart3, Inbox } from 'lucide-react'

interface ProductQuestion {
  id: string
  product_id: string
  question: string
  answer: string | null
  created_at: string
  product_name: string
}

const QUICK_REPLIES = [
  "✅ Oui, cet article est bien en stock.",
  "📦 La livraison prend généralement 24h à 48h.",
  "🙏 Merci de votre intérêt ! N'hésitez pas."
]

export default function QuestionsDashboard() {
  const [questions, setQuestions] = useState<ProductQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [generatingAi, setGeneratingAi] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: store, error: storeError } = await supabase.from('Store').select('id').eq('user_id', user.id).single()
      if (storeError || !store) throw new Error('Store introuvable')

      const { data: products } = await supabase.from('Product').select('id, name').eq('store_id', store.id)
      
      if (!products || products.length === 0) {
        setQuestions([])
        setLoading(false)
        return
      }

      const productIds = products.map((p: any) => p.id)
      const productsMap = products.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.name }), {})

      const { data: qData, error: qError } = await supabase
        .from('ProductQuestion')
        .select('*')
        .in('product_id', productIds)
        .order('created_at', { ascending: false })

      if (qError) throw qError

      const mappedQuestions = (qData || []).map((q: any) => ({
        ...q,
        product_name: productsMap[q.product_id] || 'Produit inconnu'
      }))

      setQuestions(mappedQuestions)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (questionId: string) => {
    const answer = answers[questionId]
    if (!answer?.trim()) return

    setSubmitting(questionId)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/questions/answer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, answer })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccessMsg('Réponse enregistrée avec succès.')
      setAnswers(prev => ({ ...prev, [questionId]: '' }))
      fetchQuestions()
      
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(null)
    }
  }

  const handleGenerateAI = async (q: ProductQuestion) => {
    setGeneratingAi(q.id)
    try {
      const res = await fetch('/api/ai/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, productName: q.product_name })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setAnswers(prev => ({ ...prev, [q.id]: data.answer }))
    } catch (err: any) {
      alert("Erreur IA : " + err.message)
    } finally {
      setGeneratingAi(null)
    }
  }

  const appendQuickReply = (questionId: string, reply: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || '';
      return { ...prev, [questionId]: current ? `${current} ${reply}` : reply };
    });
  }

  const isUrgent = (createdAt: string, hasAnswer: boolean) => {
    if (hasAnswer) return false;
    const diffTime = Math.abs(new Date().getTime() - new Date(createdAt).getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60)); 
    return diffHours > 48;
  };

  const filteredQuestions = questions.filter(q => {
    if (filter === 'pending' && q.answer) return false
    if (filter === 'answered' && !q.answer) return false
    
    if (searchQuery) {
      const sq = searchQuery.toLowerCase()
      if (!q.product_name.toLowerCase().includes(sq) && !q.question.toLowerCase().includes(sq)) return false
    }
    return true
  })

  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.answer).length;
  const pendingQuestions = totalQuestions - answeredQuestions;
  const responseRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-screen bg-[#FAFAF7]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F7A60]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] w-full flex flex-col">
      {/* ── HERO BANNER IMMERSIF ── */}
      <div className="relative bg-white w-full pt-10 pb-16 lg:pt-14 lg:pb-20 overflow-hidden border-b border-slate-200 shrink-0 shadow-sm mb-8">
         <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-50/50 to-transparent"></div>
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0DE0A1]/10 rounded-full blur-[100px] pointer-events-none"></div>

         <div className="max-w-[1200px] mx-auto px-6 relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner relative group">
               <div className="absolute inset-0 bg-gradient-to-br from-[#0DE0A1] to-[#0F7A60] rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
               <MessageSquare className="w-8 h-8 text-[#0F7A60] relative z-10 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h1 className="text-3xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight">Questions Clients</h1>
            <p className="text-slate-500 font-medium mt-3 text-sm lg:text-[15px] leading-relaxed max-w-lg">
               Répondez aux questions posées sur vos pages produits pour rassurer et convertir vos futurs clients. 💬
            </p>
         </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="flex-1 max-w-[1200px] w-full mx-auto px-6 pb-20 space-y-8">
        
        {/* STATS RAPIDES (Mini-Analytics) */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between gap-4 group hover:border-[#0DE0A1]/30 hover:shadow-md transition-all">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Questions</p>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalQuestions}</p>
              </div>
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                <Inbox size={24} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between gap-4 group hover:border-amber-200 hover:shadow-md transition-all">
              <div>
                <p className="text-xs font-black text-amber-500/80 uppercase tracking-widest mb-1">À Traiter</p>
                <p className="text-3xl font-extrabold text-amber-600 tracking-tight">{pendingQuestions}</p>
              </div>
              <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <AlertCircle size={24} />
              </div>
            </div>
            <div className={`bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between gap-4 group hover:shadow-md transition-all ${responseRate > 80 ? 'hover:border-[#0DE0A1]/50' : ''}`}>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest mb-1 ${responseRate > 80 ? 'text-[#0F7A60]/80' : 'text-slate-400'}`}>Taux de Réponse</p>
                <p className={`text-3xl font-extrabold tracking-tight ${responseRate > 80 ? 'text-[#0F7A60]' : 'text-slate-700'}`}>{responseRate}%</p>
              </div>
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform ${responseRate > 80 ? 'bg-emerald-50 border-emerald-100 text-[#0F7A60]' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                <BarChart3 size={24} />
              </div>
            </div>
          </div>
        )}

        {/* BARRE DE CONTRÔLE (Filtres & Recherche) */}
        {!loading && (
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-200/50 shadow-sm z-10 relative">
            <div className="flex gap-2 p-1.5 bg-slate-50/80 rounded-[1.5rem] overflow-x-auto custom-scrollbar border border-slate-100">
               <button onClick={() => setFilter('all')} className={`px-5 py-2.5 rounded-2xl text-[13px] font-extrabold transition-all whitespace-nowrap ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>Toutes</button>
               <button onClick={() => setFilter('pending')} className={`px-5 py-2.5 rounded-2xl text-[13px] font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${filter === 'pending' ? 'bg-white text-amber-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-amber-600'}`}>
                 <span className={`w-2 h-2 rounded-full ${filter === 'pending' ? 'bg-amber-500 animate-[pulse_2s_infinite]' : 'bg-slate-300'}`}></span> En attente
               </button>
               <button onClick={() => setFilter('answered')} className={`px-5 py-2.5 rounded-2xl text-[13px] font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${filter === 'answered' ? 'bg-white text-[#0F7A60] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-[#0F7A60]'}`}>
                 <CheckCircle2 size={16} className={filter === 'answered' ? 'text-[#0DE0A1]' : 'text-slate-400'}/> Répondues
               </button>
            </div>
            
            <div className="relative flex-1 max-w-md lg:pr-2 pb-2 lg:pb-0 px-2 lg:px-0">
               <div className="absolute inset-y-0 left-0 pl-3 lg:pl-1 flex items-center pointer-events-none lg:translate-x-3 pb-2 lg:pb-0">
                 <Search size={18} className="text-slate-400" />
               </div>
               <input
                 type="text"
                 placeholder="Rechercher par produit ou question..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[13px] font-bold rounded-2xl focus:ring-4 focus:ring-[#0DE0A1]/20 focus:border-[#0DE0A1] block pl-10 lg:pl-11 py-3 outline-none transition-all placeholder:text-slate-400"
               />
            </div>
          </div>
        )}

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[13px] font-bold border border-red-100 shadow-sm">{error}</div>}
        {successMsg && <div className="p-4 bg-emerald-50 text-[#0F7A60] rounded-2xl text-[13px] font-bold border border-emerald-200 shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300"><CheckCircle2 className="w-5 h-5"/> {successMsg}</div>}

        <div className="w-full">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-16 text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0DE0A1]/5 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="w-24 h-24 bg-slate-50 border border-slate-100 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative z-10 rotate-3">
                <MessageSquare className="w-10 h-10" />
              </div>
              <p className="font-extrabold text-slate-900 text-xl tracking-tight relative z-10">Sens du calme absolu</p>
              <p className="text-slate-500 text-[15px] font-medium mt-2 relative z-10">Les acheteurs n'ont pas encore posé de questions sur vos produits.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredQuestions.map((q) => (
                <article key={q.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-[0_8px_30px_rgb(15,122,96,0.06)] hover:-translate-y-1 hover:border-[#0DE0A1]/30 transition-all duration-300 p-6 md:p-8 group relative animate-in fade-in slide-in-from-bottom-4">
                  
                  <div className="flex flex-col gap-6">
                    <div className="flex-1 space-y-5">
                      
                      {/* Badges */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest rounded-lg border border-slate-200">
                          {q.product_name}
                        </span>
                        <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(q.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {q.answer ? (
                           <span className="px-2.5 py-1 bg-emerald-50 text-[#0F7A60] rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-100 shadow-sm truncate">
                             <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Répondu
                           </span>
                        ) : isUrgent(q.created_at, !!q.answer) ? (
                           <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-red-200 shadow-sm animate-pulse">
                             <AlertCircle className="w-3.5 h-3.5" /> Urgent ({Math.ceil(Math.abs(new Date().getTime() - new Date(q.created_at).getTime()) / (1000 * 60 * 60))}h)
                           </span>
                        ) : (
                           <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-200 shadow-sm">
                             <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[pulse_2s_infinite]"></span> En attente
                           </span>
                        )}
                      </div>
                      
                      {/* Contenu Question */}
                      <div className="bg-slate-50/80 border border-slate-100 p-5 rounded-2xl relative">
                        <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                          <MessageSquare className="w-16 h-16" />
                        </div>
                        <p className="text-slate-800 font-medium text-[15px] leading-relaxed relative z-10 italic">"{q.question}"</p>
                      </div>

                      {/* Zone Réponse */}
                      {q.answer ? (
                        <div className="mt-6 pl-5 border-l-4 border-emerald-400 py-2">
                          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#0DE0A1]" /> Votre réponse publique
                          </p>
                          <p className="text-slate-900 text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                        </div>
                      ) : (
                        <div className="mt-6 pt-5 border-t border-slate-100">
                          <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">
                            Rédiger une réponse publique <span className="text-slate-400 font-medium normal-case">(Sera visible dans la FAQ publiquement)</span>
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
                            <div className="relative flex-1">
                              <textarea 
                                value={answers[q.id] || ''}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Laissez la magie opérer avec l'IA ou tapez votre réponse..."
                                className={`w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:border-[#0DE0A1] focus:ring-4 focus:ring-[#0DE0A1]/20 text-[14px] font-medium outline-none transition-all resize-none min-h-[90px] shadow-sm placeholder:text-slate-400 ${generatingAi === q.id ? 'animate-pulse bg-indigo-50/50 border-indigo-200' : ''}`}
                              />
                            </div>
                            <div className="flex flex-col gap-2 min-w-[160px]">
                              <button 
                                onClick={() => handleAnswer(q.id)}
                                disabled={submitting === q.id || !answers[q.id]?.trim() || generatingAi === q.id}
                                className="w-full bg-gradient-to-r from-[#0F7A60] to-emerald-600 text-white px-6 py-4 rounded-2xl text-[13px] font-extrabold tracking-wide hover:to-[#0DE0A1] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 hover:shadow-emerald-900/30 group/btn"
                              >
                                {submitting === q.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />}
                                 Répondre
                              </button>
                              <button
                                onClick={() => handleGenerateAI(q)}
                                disabled={generatingAi === q.id || submitting === q.id}
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-2xl text-[12px] font-extrabold tracking-wide hover:from-indigo-400 hover:to-purple-500 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-indigo-900/10 hover:shadow-indigo-900/30 overflow-hidden relative group/ai"
                              >
                                <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover/ai:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
                                {generatingAi === q.id ? <Loader2 className="w-4 h-4 animate-spin relative z-10" /> : <span className="relative z-10 text-[14px]">✨</span>}
                                 <span className="relative z-10">{generatingAi === q.id ? 'Génération...' : 'Générer la réponse'}</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* Quick Replies */}
                          <div className="mt-4 flex flex-wrap gap-2">
                             {QUICK_REPLIES.map((reply, idx) => (
                               <button
                                 key={idx}
                                 onClick={() => appendQuickReply(q.id, reply)}
                                 className="text-xs font-bold text-slate-500 bg-slate-50 hover:bg-emerald-50 hover:text-[#0F7A60] border border-slate-200 hover:border-[#0DE0A1]/50 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                               >
                                 <Zap size={12} className="text-amber-500"/> {reply.length > 35 ? reply.substring(0, 35) + '...' : reply}
                               </button>
                             ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
