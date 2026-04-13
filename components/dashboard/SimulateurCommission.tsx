/* eslint-disable react/forbid-dom-props */
'use client'

// ─── components/dashboard/SimulateurCommission.tsx ───────────────────────────
// Client Component — Simulateur de commission Yayyam en temps réel

import { useState } from 'react'

// ─── Constantes ───────────────────────────────────────────────────────────────

interface Tier {
  name:  string
  min:   number
  max:   number | null
  rate:  number
  color: string
}

const TIERS: Tier[] = [
  { name: '0 – 100K',    min: 0,         max: 100_000,   rate: 8, color: '#94a3b8' },
  { name: '100K – 500K', min: 100_001,   max: 500_000,   rate: 7, color: '#3b82f6' },
  { name: '500K – 1M',   min: 500_001,   max: 1_000_000, rate: 6, color: '#8b5cf6' },
  { name: '+ 1M',        min: 1_000_001, max: null,       rate: 5, color: '#C9A84C' },
]

const QUICK_AMOUNTS = [
  { label: '50K',  value: 50_000   },
  { label: '100K', value: 100_000  },
  { label: '250K', value: 250_000  },
  { label: '500K', value: 500_000  },
  { label: '1M',   value: 1_000_000 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentTier(ca: number): Tier {
  return TIERS.find(t => t.max === null || ca <= t.max) ?? TIERS[TIERS.length - 1]
}

function getNextTier(ca: number): Tier | null {
  const idx = TIERS.findIndex(t => t.max === null || ca <= t.max)
  return TIERS[idx + 1] ?? null
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function SimulateurCommission() {
  const [rawInput, setRawInput] = useState<string>('250000')

  const ca          = Math.max(0, parseInt(rawInput.replace(/\D/g, '') || '0', 10))
  const tier        = getCurrentTier(ca)
  const nextTier    = getNextTier(ca)
  const commission  = ca * (tier.rate / 100)
  const net         = ca - commission

  const tierProgress = tier.max
    ? Math.min(((ca - tier.min) / (tier.max - tier.min)) * 100, 100)
    : 100

  const missingForNext = nextTier ? Math.max(0, nextTier.min - ca) : 0

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Garder uniquement les chiffres dans le state brut
    setRawInput(e.target.value.replace(/\D/g, ''))
  }

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">

      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center text-xl">
          🧮
        </div>
        <div>
          <h2 className="font-black text-lg text-[#1A1A1A]">Simulateur de commission</h2>
          <p className="text-xs text-gray-400 font-medium">Estimez vos gains selon votre CA mensuel</p>
        </div>
      </div>

      {/* ── Saisie + boutons rapides ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-700 block">
          Montant CA mensuel souhaité
        </label>

        {/* Input */}
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={rawInput === '0' ? '' : rawInput}
            placeholder="Saisissez un montant…"
            onChange={handleInput}
            className="w-full border-2 border-gray-200 focus:border-[#0F7A60] outline-none
              rounded-2xl px-4 py-3.5 text-xl font-black text-[#1A1A1A] transition-colors
              placeholder:text-gray-300 placeholder:font-normal placeholder:text-base"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
            FCFA
          </span>
        </div>

        {/* Boutons rapides */}
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map(q => (
            <button
              key={q.label}
              onClick={() => setRawInput(String(q.value))}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 border-2 ${
                ca === q.value
                  ? 'border-[#0F7A60] bg-[#0F7A60]/10 text-[#0F7A60]'
                  : 'border-gray-200 text-gray-500 hover:border-[#0F7A60]/40 hover:text-[#0F7A60]'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Résultats temps réel ──────────────────────────────────────────────── */}
      {ca > 0 ? (
        <div className="space-y-4">

          {/* Grille 3 métriques */}
          <div className="grid grid-cols-3 gap-3">
            {/* Palier */}
            <div className="bg-[#FAFAF7] rounded-2xl p-4 space-y-1 text-center border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Palier</p>
              <p className="font-black text-sm" style={{ color: tier.color }}>{tier.name}</p>
              <p className="text-2xl font-black" style={{ color: tier.color }}>{tier.rate}%</p>
            </div>

            {/* Commission */}
            <div className="bg-red-50 rounded-2xl p-4 space-y-1 text-center border border-red-100">
              <p className="text-xs font-black text-red-400 uppercase tracking-widest">Commission</p>
              <p className="font-black text-sm text-red-500">Yayyam</p>
              <p className="text-xl font-black text-red-600">
                {fmt(commission)}
                <span className="text-xs font-bold ml-1">FCFA</span>
              </p>
            </div>

            {/* Net */}
            <div className="bg-[#0F7A60]/5 rounded-2xl p-4 space-y-1 text-center border border-[#0F7A60]/10">
              <p className="text-xs font-black text-[#0F7A60] uppercase tracking-widest">Vous gardez</p>
              <p className="font-black text-sm text-[#0F7A60]">Net vendeur</p>
              <p className="text-xl font-black text-[#0F7A60]">
                {fmt(net)}
                <span className="text-xs font-bold ml-1">FCFA</span>
              </p>
            </div>
          </div>

          {/* Barre de progression vers le palier suivant */}
          {nextTier ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span style={{ color: tier.color }}>{tier.name} ({tier.rate}%)</span>
                <span style={{ color: nextTier.color }}>{nextTier.name} ({nextTier.rate}%)</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${tierProgress}%`, backgroundColor: tier.color }}
                />
              </div>
              <p className="text-xs text-gray-500 font-medium text-center">
                Encore <strong style={{ color: nextTier.color }}>{fmt(missingForNext)} FCFA</strong>
                {' '}pour passer au palier{' '}
                <strong style={{ color: nextTier.color }}>{nextTier.name} ({nextTier.rate}%)</strong>
              </p>
            </div>
          ) : (
            <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-2xl p-3 text-center">
              <p className="text-sm font-black text-[#C9A84C]">
                🎉 Palier + 1M — Meilleur taux possible : <strong>5%</strong>
              </p>
            </div>
          )}

          {/* Récap complet */}
          <div className="bg-[#FAFAF7] rounded-2xl border border-gray-100 p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">CA mensuel simulé</span>
              <span className="font-black text-[#1A1A1A]">{fmt(ca)} FCFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">
                Commission Yayyam ({tier.rate}% — palier {tier.name})
              </span>
              <span className="font-bold text-red-500">− {fmt(commission)} FCFA</span>
            </div>
            <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
              <span className="font-black text-[#1A1A1A]">Revenu net</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#0F7A60]">{fmt(net)}</span>
                <span className="text-sm font-bold text-[#0F7A60]"> FCFA</span>
                <span className="ml-2 text-xs font-black text-[#0F7A60] bg-[#0F7A60]/10 px-2 py-0.5 rounded-full">
                  {ca > 0 ? Math.round((net / ca) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#FAFAF7] rounded-2xl border border-gray-100 p-8 text-center space-y-2">
          <p className="text-3xl">💸</p>
          <p className="text-sm text-gray-400 font-medium">
            Saisissez un CA ou cliquez sur un montant rapide pour simuler.
          </p>
        </div>
      )}
    </section>
  )
}
