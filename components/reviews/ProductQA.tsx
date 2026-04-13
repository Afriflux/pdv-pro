'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Loader2, Send, HelpCircle, UserCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

interface Question {
  id: string
  product_id: string
  user_id: string 
  question: string
  answer: string | null
  created_at: string
}

export function ProductQA({ productId }: { productId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Formulaire
  const [newQuestion, setNewQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 1. Vérifier la session
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    checkUser()
  }, [])

  // 2. Charger les questions
  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/questions?product_id=${productId}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || [])
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  // 3. Soumettre
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, question: newQuestion })
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Erreur inconnue')
      }

      setSuccess(true)
      setNewQuestion('')
      await loadQuestions()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[#0F7A60]" />
        <h3 className="text-xl font-black text-[#1A1A1A]">Questions & Réponses</h3>
      </div>

      {/* Formulaire si connecté */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        {!user ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            <HelpCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            Veuillez vous <a href="/login" className="text-[#0F7A60] font-bold hover:underline">connecter</a> pour poser une question sur ce produit.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Poser une question au vendeur
            </label>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ex: Le produit est-il compatible avec Mac ?"
              rows={3}
              className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3 px-4 text-sm
                focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/20 outline-none transition-all resize-none shadow-inner"
            />
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            {success && <p className="text-[#0F7A60] text-xs font-bold">Votre question a bien été envoyée !</p>}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newQuestion.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0F7A60] hover:bg-[#0D5C4A] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Liste des questions */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement des questions…
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-[#FAFAF7] rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Aucune question pour le moment. Soyez le premier à poser une question !
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="bg-white border text-left border-gray-100 rounded-2xl p-5 shadow-sm">
                
                {/* Question acheteur */}
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <UserCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-gray-900">Acheteur</span>
                       <span className="text-xs text-gray-400">
                         {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: fr })}
                       </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 font-medium">{q.question}</p>
                  </div>
                </div>

                {/* Réponse vendeur */}
                {q.answer && (
                  <div className="mt-4 pl-4 border-l-2 border-[#0F7A60]/30 ml-4 py-1">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black text-[#0F7A60] tracking-wide uppercase">Vendeur</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 italic">&ldquo;{q.answer}&rdquo;</p>
                  </div>
                )}
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
