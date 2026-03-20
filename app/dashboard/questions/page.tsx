'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, CheckCircle2, Clock, Loader2, Send } from 'lucide-react'

export default function QuestionsDashboard() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: store, error: storeError } = await supabase.from('Store').select('id').eq('vendor_id', user.id).single()
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F7A60]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-[#0F7A60]" />
          Questions Clients
        </h1>
      </div>

      <p className="text-gray-500 text-sm">Répondez aux questions posées par les acheteurs sur vos pages produits pour rassurer vos futurs clients.</p>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
      {successMsg && <div className="p-4 bg-emerald/10 text-emerald-rich rounded-xl text-sm font-bold border border-emerald/20">{successMsg}</div>}

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {questions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="font-bold text-gray-900 text-lg">Aucune question pour le moment</p>
            <p className="text-gray-500 text-sm mt-1">Les acheteurs n'ont pas encore posé de questions sur vos produits.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {questions.map((q) => (
              <div key={q.id} className="p-6 md:p-8 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  {/* Info question */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-wider rounded-lg border border-gray-200">
                        {q.product_name}
                      </span>
                      <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(q.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {q.answer ? (
                         <span className="px-2 py-1 bg-emerald/10 text-emerald-rich text-xs font-bold rounded-lg flex items-center gap-1">
                           <CheckCircle2 className="w-3 h-3" /> Répondu
                         </span>
                      ) : (
                         <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg flex items-center gap-1 border border-amber-200">
                           <Clock className="w-3 h-3" /> En attente
                         </span>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                      <p className="text-gray-900 font-medium italic text-sm">"{q.question}"</p>
                    </div>

                    {q.answer ? (
                      <div className="mt-4 pl-4 border-l-4 border-emerald py-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald" /> Votre réponse
                        </p>
                        <p className="text-gray-900 text-sm whitespace-pre-wrap">{q.answer}</p>
                      </div>
                    ) : (
                      <div className="mt-4 pt-2">
                        <label className="block text-xs font-bold text-gray-700 mb-2">Rédiger une réponse publique</label>
                        <div className="flex gap-3">
                          <textarea 
                            value={answers[q.id] || ''}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Votre réponse sera visible sur la page produit..."
                            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0F7A60]/10 text-sm outline-none transition-all resize-none min-h-[60px]"
                          />
                          <button 
                            onClick={() => handleAnswer(q.id)}
                            disabled={submitting === q.id || !answers[q.id]?.trim()}
                            className="bg-[#0F7A60] hover:bg-[#0D5C4A] text-white px-5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-start py-3"
                          >
                            {submitting === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Répondre
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
