// ─── ReviewWidget — affiche et collecte les avis clients ──────────────────────
// Client Component : chargement via fetch, formulaire POST /api/reviews/create

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Star, Loader2, CheckCircle2, Send, Camera, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Review {
  id:         string
  buyer_name: string
  rating:     number
  comment:    string | null
  verified:   boolean
  created_at: string
  image_url?: string | null
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
  const [file,    setFile]    = useState<File | null>(null)

  // UI States
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent')
  const [expanded, setExpanded] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      let uploadedImageUrl = null

      if (file) {
        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${storeId}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('reviews')
          .upload(fileName, file)
        
        if (uploadError) {
          throw new Error("Erreur lors de l'upload de l'image: " + uploadError.message)
        }
        
        const { data: { publicUrl } } = supabase.storage.from('reviews').getPublicUrl(fileName)
        uploadedImageUrl = publicUrl
      }

      const res = await fetch('/api/reviews/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id:   storeId,
          product_id: productId,
          buyer_name: name.trim(),
          rating,
          comment: comment.trim() || null,
          image_url: uploadedImageUrl
        }),
      })
      
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur serveur')
      }
      
      setSubmitted(true)
      await loadReviews()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.")
    } finally {
      setSubmitting(false)
    }
  }

  // Derived UI computations
  const total = reviews.length
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating as keyof typeof counts]++
  })

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const displayedReviews = expanded ? sortedReviews : sortedReviews.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Lightbox pour l'image (si on clique sur une miniature) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            type="button"
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Review zoomée" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
          />
        </div>
      )}

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-[#1A1A1A] flex items-center gap-2">
          <Star className="w-5 h-5 text-[#C9A84C] fill-[#C9A84C]" />
          Avis clients
        </h3>
        
        {/* Toggle Tri */}
        {total > 0 && (
          <select 
            className="text-sm border-none bg-gray-50 text-gray-600 font-semibold rounded-lg px-2 py-1.5 focus:ring-0 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
          >
            <option value="recent">Plus récents</option>
            <option value="rating">Mieux notés</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des avis…
        </div>
      ) : (
        <>
          {/* ── Résumé note (Amazon Style) ── */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row gap-6 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-5xl font-black text-[#1A1A1A] tracking-tighter">{avg.toFixed(1)}</div>
                <div className="mt-2 mb-1"><StarDisplay rating={Math.round(avg)} size={18} /></div>
                <p className="text-xs text-gray-500 font-semibold">
                  {total} avis{total > 1 ? '' : ''}
                </p>
              </div>
              
              {/* Barres de progression par étoile */}
              <div className="flex-1 space-y-2.5 flex flex-col justify-center">
                {[5, 4, 3, 2, 1].map((star) => {
                  const val = counts[star as keyof typeof counts]
                  const percent = total > 0 ? (val / total) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                      <div className="w-6 text-right whitespace-nowrap">{star} <span className="text-[#C9A84C]">★</span></div>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#C9A84C] rounded-full transition-all duration-1000" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-gray-400">{Math.round(percent)}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Liste des avis */}
          {total > 0 ? (
            <div className="space-y-4 transition-all duration-500">
              {displayedReviews.map((r) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col gap-1.5">
                    <StarDisplay rating={r.rating} />
                    {r.comment && (
                      <p className="text-sm text-gray-800 mt-1 leading-relaxed whitespace-pre-line">&ldquo;{r.comment}&rdquo;</p>
                    )}
                    {r.image_url && (
                      <div className="mt-2">
                        <button 
                          type="button"
                          onClick={() => setSelectedImage(r.image_url!)}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:opacity-90 hover:scale-105 transition-all cursor-zoom-in"
                        >
                          <img src={r.image_url} alt="Photo du client" className="w-full h-full object-cover" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                    <span className="text-xs font-bold text-gray-900">{r.buyer_name}</span>
                    {r.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-[#0F7A60] uppercase tracking-wide bg-[#0F7A60]/10 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Achat vérifié
                      </span>
                    )}
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Bouton Voir tout */}
              {!expanded && total > 3 && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors border border-gray-200"
                >
                  Voir tous les avis ({total})
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#FAFAF7] rounded-2xl border border-gray-100 p-8 text-center">
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">
                Aucun avis pour le moment. Soyez le premier !
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Formulaire d'ajout d'avis ── */}
      {showForm && (
        <div className="border-t border-gray-100 pt-6 mt-6">
          {submitted ? (
            <div className="flex items-center gap-3 text-[#0F7A60] bg-[#0F7A60]/10 border border-[#0F7A60]/20 rounded-2xl px-5 py-4 text-sm font-bold shadow-sm">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                Merci pour votre avis !<br/>
                <span className="text-xs font-medium text-[#0F7A60]/80">Il sera publié très prochainement.</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <h4 className="text-base font-black text-[#1A1A1A]">Laisser un avis</h4>

              {/* Étoiles */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Note globale *
                </label>
                <div className="bg-gray-50 inline-block p-1.5 rounded-xl border border-gray-100">
                  <StarPicker value={rating} onChange={setRating} />
                </div>
              </div>

              {/* Nom */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Votre prénom *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Fatou K."
                  required
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3 px-4 text-sm
                    focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/20 focus:bg-white outline-none transition-all shadow-inner"
                />
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Partagez votre expérience</span>
                  <span className="text-gray-300 normal-case font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Qu'avez-vous particulièrement apprécié ?"
                  rows={4}
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3 px-4 text-sm
                    focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/20 focus:bg-white outline-none transition-all resize-none shadow-inner"
                />
              </div>

              {/* Upload Photo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Ajouter une photo
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                
                {file ? (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFile(null)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#0F7A60]/50 hover:bg-[#0F7A60]/5 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                      <Camera className="w-5 h-5 text-gray-400 group-hover:text-[#0F7A60]" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 group-hover:text-[#0F7A60]">Cliquez pour uploader une image</span>
                  </button>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0F7A60]
                  hover:bg-[#0D5C4A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm
                  font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Traitement en cours…' : 'Envoyer mon avis'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
