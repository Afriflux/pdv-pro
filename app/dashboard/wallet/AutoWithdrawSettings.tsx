'use client'
import { useState } from 'react'

export function AutoWithdrawSettings({
  walletId,
  initialEnabled,
  initialThreshold,
  targetContext = 'vendor'
}: {
  walletId: string,
  initialEnabled: boolean,
  initialThreshold: number,
  targetContext?: 'vendor' | 'closer' | 'affiliate'
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [threshold, setThreshold] = useState(initialThreshold)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    const newEnabled = !enabled
    try {
      const res = await fetch('/api/wallet/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId, auto_withdraw_enabled: newEnabled, targetContext })
      })
      if (res.ok) setEnabled(newEnabled)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveThreshold = async () => {
    setLoading(true)
    setSaved(false)
    try {
      const res = await fetch('/api/wallet/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId, auto_withdraw_threshold: threshold, targetContext })
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-black text-[#1A1A1A] flex items-center gap-2">
            <span className="text-lg">🤖</span> Retraits Automatisés
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px] leading-relaxed">
            Transférez vos fonds automatiquement vers votre compte dès que le seuil défini est atteint.
          </p>
        </div>
        <button 
          aria-label={enabled ? "Désactiver les retraits automatisés" : "Activer les retraits automatisés"}
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-1 shadow-inner focus:outline-none ${enabled ? 'bg-[#0F7A60]' : 'bg-gray-200'}`}
        >
          <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      
      {enabled && (
        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seuil de déclenchement (FCFA)</label>
          <div className="flex items-center gap-2">
            <input 
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              placeholder="Ex: 50000"
              className="flex-1 min-w-0 bg-[#FAFAF7] border border-gray-200 text-sm font-black text-[#1A1A1A] rounded-xl px-3 py-2 outline-none focus:border-[#0F7A60] transition-colors"
            />
            <button 
              onClick={handleSaveThreshold}
              disabled={loading}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                saved 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-[#0F7A60] text-white hover:bg-[#0D5C4A]'
              }`}
            >
              {saved ? 'Enregistré ✓' : 'Valider'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
