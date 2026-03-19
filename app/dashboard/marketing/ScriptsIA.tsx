// ─── Générateur de Scripts Pub IA ─────────────────────────────────────────────
// Client Component — Appel POST /api/ai/generate-script
// Génère : script principal + hooks alternatifs + hashtags

'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
type Platform  = 'tiktok' | 'instagram' | 'facebook' | 'whatsapp'
type Objective = 'ventes' | 'notoriete' | 'engagement'
type Duration  = '15s' | '30s' | '60s'

interface GeneratedScript {
  script:   string
  hooks:    string[]
  hashtags: string[]
}

// ─── Bouton radio stylé ───────────────────────────────────────────────────────
function RadioOption<T extends string>({
  value, current, label, emoji, onChange,
}: {
  value: T; current: T; label: string; emoji?: string; onChange: (v: T) => void
}) {
  const active = value === current
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
        active
          ? 'bg-[#0F7A60] border-[#0F7A60] text-white shadow-sm'
          : 'bg-white border-gray-200 text-gray-500 hover:border-[#0F7A60]/40'
      }`}
    >
      {emoji && <span>{emoji}</span>}
      {label}
    </button>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ScriptsIA() {
  const [productName, setProductName] = useState('')
  const [platform,    setPlatform]    = useState<Platform>('tiktok')
  const [objective,   setObjective]   = useState<Objective>('ventes')
  const [duration,    setDuration]    = useState<Duration>('30s')
  const [generating,  setGenerating]  = useState(false)
  const [result,      setResult]      = useState<GeneratedScript | null>(null)
  const [copied,      setCopied]      = useState(false)

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast.error('Entrez le nom de votre produit.')
      return
    }
    setGenerating(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/generate-script', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim(), platform, objective, duration }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur serveur')
      }
      const data = await res.json() as GeneratedScript
      setResult(data)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Script copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* ── En-tête ── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-[#FAFAF7]">
        <div className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-[#0F7A60]" />
        </div>
        <div>
          <h2 className="text-base font-black text-[#1A1A1A]">Générateur de Scripts Pub IA</h2>
          <p className="text-xs text-gray-400">Créez des scripts optimisés pour vos publicités en secondes</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Produit */}
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
            Produit *
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ex: Robe en wax premium, Cours Excel 2024…"
            className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3 px-4 text-sm
              focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all"
          />
        </div>

        {/* Plateforme */}
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
            Plateforme
          </label>
          <div className="flex flex-wrap gap-2">
            <RadioOption<Platform> value="tiktok"    current={platform} label="TikTok"    emoji="🎵" onChange={setPlatform} />
            <RadioOption<Platform> value="instagram" current={platform} label="Instagram" emoji="📸" onChange={setPlatform} />
            <RadioOption<Platform> value="facebook"  current={platform} label="Facebook"  emoji="👥" onChange={setPlatform} />
            <RadioOption<Platform> value="whatsapp"  current={platform} label="WhatsApp"  emoji="💬" onChange={setPlatform} />
          </div>
        </div>

        {/* Objectif */}
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
            Objectif
          </label>
          <div className="flex flex-wrap gap-2">
            <RadioOption<Objective> value="ventes"     current={objective} label="Ventes"      emoji="💰" onChange={setObjective} />
            <RadioOption<Objective> value="notoriete"  current={objective} label="Notoriété"   emoji="📢" onChange={setObjective} />
            <RadioOption<Objective> value="engagement" current={objective} label="Engagement"  emoji="❤️" onChange={setObjective} />
          </div>
        </div>

        {/* Durée */}
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
            Durée
          </label>
          <div className="flex gap-2">
            <RadioOption<Duration> value="15s" current={duration} label="15s" onChange={setDuration} />
            <RadioOption<Duration> value="30s" current={duration} label="30s" onChange={setDuration} />
            <RadioOption<Duration> value="60s" current={duration} label="60s" onChange={setDuration} />
          </div>
        </div>

        {/* Bouton générer */}
        <button
          onClick={handleGenerate}
          disabled={generating || !productName.trim()}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0F7A60]
            hover:bg-[#0D5C4A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm
            font-black rounded-xl transition-all shadow-sm"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours…</>
            : <><Sparkles className="w-4 h-4" /> Générer le script</>}
        </button>

        {/* ── Résultat ── */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="h-px bg-gray-100" />

            {/* Script principal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                  📋 Script principal
                </label>
                <button
                  onClick={() => handleCopy(result.script)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAFAF7] border border-gray-200
                    rounded-lg text-xs font-bold text-gray-600 hover:border-[#0F7A60] hover:text-[#0F7A60] transition-all"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <div className="bg-[#FAFAF7] border border-gray-100 rounded-xl p-4 text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap font-mono text-xs">
                {result.script}
              </div>
            </div>

            {/* Hooks alternatifs */}
            {result.hooks.length > 0 && (
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  🪝 Hooks alternatifs
                </label>
                <div className="space-y-2">
                  {result.hooks.map((hook, i) => (
                    <div key={i} className="flex items-start gap-2 bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-xl px-4 py-3">
                      <span className="text-[#C9A84C] font-black text-xs flex-shrink-0">{i + 1}.</span>
                      <span className="text-sm text-[#1A1A1A]">{hook}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {result.hashtags.length > 0 && (
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  # Hashtags suggérés
                </label>
                <div className="flex flex-wrap gap-2">
                  {result.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-[#0F7A60]/10 text-[#0F7A60] rounded-full text-xs font-semibold cursor-pointer hover:bg-[#0F7A60]/20 transition"
                      onClick={() => handleCopy(result.hashtags.join(' '))}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleCopy(result.hashtags.join(' '))}
                  className="mt-2 text-xs text-gray-400 hover:text-[#0F7A60] transition underline"
                >
                  Copier tous les hashtags
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
