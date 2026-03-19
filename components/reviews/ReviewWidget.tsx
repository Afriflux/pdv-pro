// ─── ReviewWidget — affiche et collecte les avis clients ──────────────────────
// Client Component : chargement via fetch, formulaire POST /api/reviews/create

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Loader2, CheckCircle2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Review {
  id:         string
  buyer_name: string
  rating:     number
  comment:    string | null
  verified:   boolean
  created_at: string
}

interface ReviewWidgetProps {
  storeId:   string
  productId?: string
  showForm?: boolean
}

// ─── Étoiles ──────────────────────────────────────────────────────────────────
function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= rating ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  )
}

// ─── Sélecteur d'étoiles ──────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          aria-label={`Noter ${n} étoiles`}
          title={`Noter ${n} étoiles`}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={
              n <= (hovered || value)
                ? 'text-[#C9A84C] fill-[#C9A84C]'
                : 'text-gray-200 fill-gray-200'
            }
          />
        </button>
      ))}
    </div>
  )
}

// ─── Badge note globale ───────────────────────────────────────────────────────
function RatingSummary({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return (
    <div className="flex items-center gap-3 p-4 bg-[#FAFAF7] rounded-xl border border-gray-100">
      <div className="text-3xl font-black text-[#1A1A1A]">{avg.toFixed(1)}</div>
      <div>
        <StarDisplay rating={Math.round(avg)} size={16} />
        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
          {reviews.length} avis{reviews.length > 1 ? '' : ''}
        </p>
      </div>
    </div>
  )
}

// ─── Widget principal ─────────────────────────────────────────────────────────
export function ReviewWidget({ storeId, productId, showForm = false }: ReviewWidgetProps) {
  const [reviews,    setReviews]    = useState<Review[]>([])
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Formulaire
  const [rating,  setRating]  = useState(5)
  const [name,    setName]    = useState('')
  const [comment, setComment] = useState('')

  // Chargement des avis
  const loadReviews = useCallback(async () => {
    try {
      const params = new URLSearchParams({ store_id: storeId })
      if (productId) params.set('product_id', productId)
      const res  = await fetch(`/api/reviews?${params}`)
      const data = await res.json() as { reviews?: Review[] }
      setReviews(data.reviews ?? [])
    } catch {
      // Silencieux — les avis ne sont pas critiques
    } finally {
      setLoading(false)
    }
  }, [storeId, productId])

  useEffect(() => { loadReviews() }, [loadReviews])

  // Soumission d'un avis
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Votre nom est requis.'); return }
    if (rating === 0) { setError('Choisissez une note.'); return }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id:   storeId,
          product_id: productId,
          buyer_name: name.trim(),
          rating,
          comment: comment.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur serveur')
      }
      setSubmitted(true)
      await loadReviews()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── En-tête ── */}
      <h3 className="text-base font-black text-[#1A1A1A] flex items-center gap-2">
        <Star className="w-4 h-4 text-[#C9A84C] fill-[#C9A84C]" />
        Avis clients
      </h3>

      {/* ── Résumé note ── */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des avis…
        </div>
      ) : (
        <>
          <RatingSummary reviews={reviews} />

          {/* Liste des avis */}
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <StarDisplay rating={r.rating} />
                      {r.comment && (
                        <p className="text-sm text-[#1A1A1A] mt-1 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-gray-500">{r.buyer_name}</span>
                    {r.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-[#0F7A60] uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Vérifié
                      </span>
                    )}
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-4">
              Aucun avis pour le moment. Soyez le premier !
            </p>
          )}
        </>
      )}

      {/* ── Formulaire d'ajout d'avis ── */}
      {showForm && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          {submitted ? (
            <div className="flex items-center gap-2 text-[#0F7A60] bg-[#0F7A60]/10 rounded-xl px-4 py-3 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Merci pour votre avis ! Il sera publié après vérification.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="text-sm font-black text-[#1A1A1A]">Laisser un avis</h4>

              {/* Étoiles */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Note *
                </label>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Votre nom *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Fatou K."
                  required
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-2.5 px-4 text-sm
                    focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all"
                />
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Commentaire <span className="text-gray-300 normal-case font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre expérience…"
                  rows={3}
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-2.5 px-4 text-sm
                    focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 font-semibold">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0F7A60]
                  hover:bg-[#0D5C4A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm
                  font-bold rounded-xl transition-all shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Envoi en cours…' : 'Envoyer mon avis'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
