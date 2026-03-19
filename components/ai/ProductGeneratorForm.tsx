'use client'

// ─── Formulaire de génération IA de fiche produit ────────────────────────────

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Loader2 } from 'lucide-react'
import type { GeneratedProduct } from '@/app/api/ai/generate-product/route'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Mode & Beauté',
  'Électronique',
  'Maison & Cuisine',
  'Alimentation',
  'Santé & Bien-être',
  'Sport',
  'Enfants & Jouets',
  'Services',
  'Formation & Digital',
  'Autre',
]

const TONES = [
  { value: 'persuasif',         label: '🎯 Persuasif (recommandé)' },
  { value: 'luxe',              label: '💎 Luxe & Premium' },
  { value: 'urgence',           label: '⚡ Urgence & Rareté' },
  { value: 'economique',        label: '💰 Économique & Accessible' },
  { value: 'probleme_solution', label: '🔧 Problème / Solution' },
]

const LOADING_MESSAGES = [
  '🤖 Analyse de votre produit...',
  '✍️ Rédaction du titre...',
  '📝 Génération de la description...',
  '❓ Création de la FAQ...',
  '🎯 Optimisation SEO...',
  '✨ Finalisation de la fiche...',
]

// ─── Réponse API ──────────────────────────────────────────────────────────────

interface GenerateApiResponse {
  product?: GeneratedProduct
  error?: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductGeneratorFormProps {
  onGenerated: (product: GeneratedProduct) => void
  isLoading: boolean
  setIsLoading: (v: boolean) => void
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ProductGeneratorForm({
  onGenerated,
  isLoading,
  setIsLoading,
}: ProductGeneratorFormProps) {
  // État du formulaire
  const [productName,    setProductName]    = useState('')
  const [category,       setCategory]       = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [keyBenefits,    setKeyBenefits]    = useState('')
  const [price,          setPrice]          = useState<number | ''>('')
  const [tone,           setTone]           = useState('persuasif')

  // Message de loading séquentiel
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  // Fait défiler les messages pendant le loading
  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      )
    }, 1500)
    return () => clearInterval(interval)
  }, [isLoading])

  // ── Envoi du formulaire ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim()) {
      toast.error('Le nom du produit est obligatoire.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName:    productName.trim(),
          category:       category || undefined,
          targetAudience: targetAudience.trim() || undefined,
          keyBenefits:    keyBenefits.trim() || undefined,
          price:          price !== '' ? price : undefined,
          tone,
        }),
      })

      const data = (await res.json()) as GenerateApiResponse

      if (!res.ok || !data.product) {
        toast.error(data.error ?? 'Erreur lors de la génération. Réessayez.')
        return
      }

      toast.success('Fiche produit générée avec succès ✨')
      onGenerated(data.product)

    } catch {
      toast.error('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Classes partagées ────────────────────────────────────────────────────────
  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white'

  const labelClass = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#0F7A60]" />
        </div>
        <div>
          <h2 className="font-black text-gray-900 text-lg">Générateur IA</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Décrivez votre produit — l&apos;IA génère une fiche complète
          </p>
        </div>
      </div>

      {/* ── Formulaire ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset disabled={isLoading} className="space-y-5">

          {/* Nom du produit */}
          <div>
            <label className={labelClass}>
              Nom du produit <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex : Robe en wax multicolore"
              required
              className={inputClass}
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className={labelClass}>Catégorie</label>
            <select
              aria-label="Catégorie"
              title="Catégorie"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Cible */}
          <div>
            <label className={labelClass}>Audience cible</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Ex : Femmes 25-40 ans, cadres actives"
              className={inputClass}
            />
          </div>

          {/* Bénéfices clés */}
          <div>
            <label className={labelClass}>Bénéfices clés</label>
            <textarea
              value={keyBenefits}
              onChange={(e) => setKeyBenefits(e.target.value)}
              placeholder="Ex : Tissu respirant, coupe flatteuse, lavage facile, couleurs vives..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Prix */}
          <div>
            <label className={labelClass}>Prix (FCFA)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder="Ex : 15000"
              min={0}
              step={500}
              className={inputClass}
            />
          </div>

          {/* Ton */}
          <div>
            <label className={labelClass}>Ton de communication</label>
            <select
              aria-label="Ton de communication"
              title="Ton de communication"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className={inputClass}
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

        </fieldset>

        {/* ── Bouton submit ──────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={isLoading || !productName.trim()}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm transition-all ${
            isLoading || !productName.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#0F7A60] hover:bg-[#0D5C4A] text-white shadow-lg shadow-[#0F7A60]/20'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="transition-all duration-300">
                {LOADING_MESSAGES[loadingMessageIndex]}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Générer ma fiche produit
            </>
          )}
        </button>

        {/* ── Note de bas de formulaire ──────────────────────────────────── */}
        <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          ✨ Propulsé par Claude AI · Anthropic
        </p>
      </form>
    </div>
  )
}
