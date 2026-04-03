'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, Wand2, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

export default function ScriptsIA() {
  const [productName, setProductName] = useState('')
  const [platform, setPlatform] = useState('tiktok')
  const [objective, setObjective] = useState('ventes')
  const [duration, setDuration] = useState('30s')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{script: string} | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast.error('Entrez le nom de votre produit.')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-script', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, platform, objective, duration }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      const data = await res.json()
      setResult(data)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erreur lors de la génération.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-[#C9A84C]" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#1A1A1A]">Générateur IA</h2>
          <p className="text-sm text-gray-500">Des scripts pubs percutants en 1 clic.</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Que vendez-vous ?
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ex: Robe en wax premium..."
            className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-[#1A1A1A] outline-none focus:border-[#C9A84C] transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <select
              aria-label="Sélectionnez la plateforme ciblée pour le script publicitaire"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full appearance-none bg-[#FAFAF7] border border-gray-200 rounded-xl py-3.5 pl-4 pr-10 text-sm font-bold text-[#1A1A1A] outline-none focus:border-[#C9A84C] transition-colors cursor-pointer"
            >
              <option value="tiktok">🎵 TikTok</option>
              <option value="instagram">📸 Instagram</option>
              <option value="facebook">👥 Facebook</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
             <select
              aria-label="Sélectionnez l'objectif du script publicitaire"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full appearance-none bg-[#FAFAF7] border border-gray-200 rounded-xl py-3.5 pl-4 pr-10 text-sm font-bold text-[#1A1A1A] outline-none focus:border-[#C9A84C] transition-colors cursor-pointer"
            >
              <option value="ventes">💰 Ventes</option>
              <option value="engagement">❤️ Engagement</option>
              <option value="notoriete">📢 Notoriété</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

           <div className="relative">
             <select
              aria-label="Sélectionnez la durée du script publicitaire"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full appearance-none bg-[#FAFAF7] border border-gray-200 rounded-xl py-3.5 pl-4 pr-10 text-sm font-bold text-[#1A1A1A] outline-none focus:border-[#C9A84C] transition-colors cursor-pointer"
            >
              <option value="15s">⏱️ 15s (Court)</option>
              <option value="30s">⏱️ 30s (Classique)</option>
              <option value="60s">⏱️ 60s (Long)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !productName.trim()}
          className="w-full py-4 mt-2 bg-[#0F7A60] hover:bg-[#0D5C4A] text-white rounded-xl font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
        >
          {generating ? (
             <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Création de la magie...</span>
          ) : (
            <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4"/> Générer mon Script</span>
          )}
        </button>

        {result && (
          <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-black text-[#1A1A1A]">Résultat ({platform})</span>
              <button onClick={() => handleCopy(result.script)} className="text-xs font-bold flex items-center gap-1 text-[#C9A84C] hover:text-[#B39340]">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copié!' : 'Copier'}
              </button>
            </div>
            <div className="p-5 bg-[#FAFAF7] rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-medium text-gray-700 border border-gray-100">
              {result.script}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
