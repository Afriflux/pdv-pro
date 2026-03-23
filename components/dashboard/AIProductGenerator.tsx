'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, Edit2 } from 'lucide-react'

interface GeneratedProduct {
  title: string
  description: string
  benefits: string[]
  faq: Array<{ question: string; answer: string }>
  callToAction: string
  marketingAngles: string[]
  seoTitle: string
  metaDescription: string
}

interface AIProductGeneratorProps {
  onGenerated: (data: GeneratedProduct) => void
  category?: string
}

const CATEGORIE_OPTIONS = [
  { value: 'mode', label: 'Mode & Vêtements' },
  { value: 'beaute', label: 'Beauté & Cosmétique' },
  { value: 'digital', label: 'Produits Digitaux' },
  { value: 'alimentaire', label: 'Alimentaire' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'service', label: 'Services' },
  { value: 'autre', label: 'Autre' }
]

const MARKET_OPTIONS = [
  { value: 'senegal', label: '🇸🇳 Sénégal' },
  { value: 'cotedivoire', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'mali', label: '🇲🇱 Mali' },
  { value: 'general', label: '🌍 Général (Afrique)' }
]

export default function AIProductGenerator({ onGenerated, category: defaultCategory }: AIProductGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [category, setCategory] = useState(defaultCategory || 'mode')
  const [market, setMarket] = useState('senegal')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<GeneratedProduct | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    setGenerated(null)

    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: prompt, category, market })
      })

      if (!res.ok) {
        throw new Error('Erreur lors de la génération. Veuillez réessayer.')
      }

      const data = await res.json()
      
      if (data.success && data.product) {
        setGenerated(data.product)
      } else {
        throw new Error(data.error || 'Erreur inattendue')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-2 border-[#0F7A60]/20 rounded-2xl overflow-hidden shadow-sm mb-8 relative">
      {/* Label IA */}
      <div className="absolute top-0 right-0 bg-[#0F7A60] pt-1 pb-1.5 px-3 rounded-bl-xl text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
        <Sparkles size={12} className="text-[#C9A84C]" /> PDV IA
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center text-[#0F7A60]">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-[#1A1A1A] text-lg">Générer avec l&apos;IA</h3>
            <p className="text-xs text-gray-500 mt-0.5">Laissez notre IA écrire la fiche parfaite pour vendre plus.</p>
          </div>
        </div>

        {!generated ? (
          // ── FORMULAIRE ──
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Décrivez votre produit en quelques mots
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: robe wax taille unique rouge et or, tissu respirant, livraison gratuite sur dakar..."
                className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:border-[#0F7A60] focus:ring-1 focus:ring-[#0F7A60] transition-colors resize-none placeholder-gray-400"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Catégorie
                </label>
                <select
                  aria-label="Catégorie"
                  title="Catégorie"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F7A60] transition-colors appearance-none"
                  disabled={loading}
                >
                  {CATEGORIE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Marché cible
                </label>
                <div className="flex bg-[#FAFAF7] border border-gray-200 rounded-xl overflow-x-auto hide-scrollbar p-1">
                  {MARKET_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMarket(opt.value)}
                      disabled={loading}
                      className={`flex-1 min-w-[max-content] px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                        market === opt.value 
                          ? 'bg-white text-[#1A1A1A] shadow-sm' 
                          : 'text-gray-500 hover:text-[#1A1A1A]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm font-bold text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                ⚠️ {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-[#0F7A60] hover:bg-[#0D6B53] disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles size={18} className={prompt.trim() ? "text-[#C9A84C]" : ""} />
                  Générer la fiche produit
                </>
              )}
            </button>
          </div>
        ) : (
          // ── APERÇU RÉSULTAT ──
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#FAFAF7] border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-black text-[#0F7A60] mb-2">
                <Check size={16} /> Fiche générée avec succès
              </div>
              
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Titre généré</p>
                <p className="font-bold text-[#1A1A1A]">{generated.title}</p>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description optimisée</p>
                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                  {generated.description}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Angles Marketing clés</p>
                  <ul className="text-sm text-gray-600 list-disc pl-4">
                    {generated.marketingAngles?.map((angle, i) => <li key={i}>{angle}</li>)}
                  </ul>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">SEO (Meta Title & Meta Description)</p>
                  <div className="bg-white p-3 rounded-lg border border-gray-100 mt-1">
                    <p className="text-blue-600 text-sm font-semibold truncate hover:underline cursor-pointer">{generated.seoTitle}</p>
                    <p className="text-green-700 text-xs truncate">pdvpro.com/p/votre-produit</p>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{generated.metaDescription}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGenerated(null)}
                className="px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors flex items-center gap-2"
              >
                <Edit2 size={16} /> Modifier
              </button>
              
              <button
                type="button"
                onClick={() => onGenerated(generated)}
                className="flex-1 bg-[#0F7A60] hover:bg-[#0D6B53] text-white font-black py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Utiliser cette fiche
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
