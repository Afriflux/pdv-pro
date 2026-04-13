'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Loader2, RefreshCw } from 'lucide-react'

interface CreateAmbassadorResponse {
  error?: string
  ambassador?: { id: string; code: string; name: string }
}

function generateCode(name: string): string {
  const cleaned = name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 15)
    .replace(/^-|-$/g, '')
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${cleaned}-${suffix}`
}

export default function CreateAmbassadorForm() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [commissionPerVendor, setCommissionPerVendor] = useState(1000)
  const [minCaRequirement, setMinCaRequirement] = useState(50000)
  const [loading, setLoading] = useState(false)

  // Regénérer un code à partir du nom
  const handleRegenCode = () => {
    if (!name.trim()) return
    setCode(generateCode(name.trim()))
  }

  // Auto-générer le code quand le nom perd le focus
  const handleNameBlur = () => {
    if (!code && name.trim()) {
      setCode(generateCode(name.trim()))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim() || !email.trim()) {
      toast.error('Nom, code et email sont obligatoires.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/ambassador/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          bio: bio.trim() || undefined,
          email: email.trim().toLowerCase(),
          commissionPerVendor,
          minCaRequirement,
        }),
      })

      const data = (await res.json()) as CreateAmbassadorResponse

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la création.')
      } else {
        toast.success(`Ambassadeur ${data.ambassador?.name} créé ✅ — Code : ${data.ambassador?.code}`)
        // Reset formulaire
        setName('')
        setCode('')
        setBio('')
        setEmail('')
        setCommissionPerVendor(1000)
        setMinCaRequirement(50000)
        // Recharger la page pour afficher le nouvel ambassadeur
        setTimeout(() => window.location.reload(), 800)
      }
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-sm text-[#E6EDF3] placeholder:text-[#484F58] focus:outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/15 transition-all'

  const labelClass = 'block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Nom */}
        <div>
          <label className={labelClass}>Nom de l&apos;ambassadeur *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Ex : Amadou Konaté"
            required
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>Email du compte User *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            required
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[#484F58]">
            L&apos;utilisateur doit déjà avoir un compte Yayyam.
          </p>
        </div>

        {/* Code ambassadeur */}
        <div>
          <label className={labelClass}>Code ambassadeur *</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="COACH-AMADOU"
              maxLength={30}
              required
              className={`${inputClass} font-mono tracking-wider flex-1`}
            />
            <button
              type="button"
              onClick={handleRegenCode}
              title="Régénérer le code"
              className="px-3 py-3 rounded-xl border border-[#30363D] text-[#8B949E] hover:border-[#0F7A60] hover:text-[#0F7A60] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-[#484F58]">
            Unique, en majuscules. Généré automatiquement depuis le nom.
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className={labelClass}>Bio (optionnel)</label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Coach e-commerce, formateur..."
            maxLength={150}
            className={inputClass}
          />
        </div>

        {/* Commission par vendeur */}
        <div>
          <label className={labelClass}>Commission par vendeur qualifié (FCFA)</label>
          <input
            aria-label="Commission par vendeur"
            type="number"
            value={commissionPerVendor}
            onChange={(e) => setCommissionPerVendor(Number(e.target.value))}
            min={0}
            step={500}
            required
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[#484F58]">
            Montant crédité à l&apos;ambassadeur quand le vendeur atteint le CA minimum.
          </p>
        </div>

        {/* CA minimum requis */}
        <div>
          <label className={labelClass}>CA minimum requis (FCFA)</label>
          <input
            aria-label="CA minimum requis"
            type="number"
            value={minCaRequirement}
            onChange={(e) => setMinCaRequirement(Number(e.target.value))}
            min={0}
            step={5000}
            required
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[#484F58]">
            CA que le vendeur doit réaliser le mois de son inscription pour valider la commission.
          </p>
        </div>
      </div>

      {/* Bouton submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${
            loading
              ? 'bg-[#30363D] text-[#484F58] cursor-not-allowed'
              : 'bg-[#0F7A60] hover:bg-[#0D5C4A] text-white shadow-lg shadow-[#0F7A60]/20'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Création...
            </>
          ) : (
            '+ Créer l\'ambassadeur'
          )}
        </button>
      </div>
    </form>
  )
}
