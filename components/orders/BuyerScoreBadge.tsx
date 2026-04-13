'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldAlert, Ban, Flag, Loader2 } from 'lucide-react'

interface BuyerScoreBadgeProps {
  phone: string
  storeId: string
  compact?: boolean
}

interface BuyerInfo {
  score: number
  riskLevel: string
  label: string
  color: string
  emoji: string
  totalOrders: number
  successOrders: number
  refusedOrders: number
  isBlacklisted: boolean
}

export function BuyerScoreBadge({ phone, storeId, compact = false }: BuyerScoreBadgeProps) {
  const [info, setInfo] = useState<BuyerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [flagging, setFlagging] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!phone) return
    fetch('/api/checkout/buyer-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
      .then(res => res.json())
      .then((data: any) => {
        setInfo({
          score: data.score ?? 50,
          riskLevel: data.riskLevel ?? 'normal',
          label: data.label ?? 'Client normal',
          color: data.color ?? 'bg-blue-100 text-blue-700 border-blue-200',
          emoji: data.riskLevel === 'trusted' ? '🟢' : data.riskLevel === 'warning' ? '🟠' : data.riskLevel === 'risky' ? '🔴' : data.riskLevel === 'blacklisted' ? '⛔' : '🟡',
          totalOrders: data.totalOrders ?? 0,
          successOrders: data.successOrders ?? 0,
          refusedOrders: data.refusedOrders ?? 0,
          isBlacklisted: data.riskLevel === 'blacklisted',
        })
      })
      .catch(() => setInfo(null))
      .finally(() => setLoading(false))
  }, [phone])

  const handleFlag = async () => {
    if (flagging) return
    if (!confirm(`Êtes-vous sûr de vouloir signaler ce numéro (${phone}) ? Il ne pourra plus payer en COD.`)) return

    setFlagging(true)
    try {
      const { flagBuyerAction } = await import('@/app/actions/anti-fraud')
      await flagBuyerAction(phone, storeId, 'manual')
      setInfo(prev => prev ? { ...prev, isBlacklisted: true, riskLevel: 'blacklisted', label: 'Bloqué (blacklist)', emoji: '⛔', score: 0 } : prev)
    } catch { /* ignore */ }
    setFlagging(false)
  }

  const handleUnflag = async () => {
    if (flagging) return
    setFlagging(true)
    try {
      const { unflagBuyerAction } = await import('@/app/actions/anti-fraud')
      await unflagBuyerAction(phone)
      setInfo(prev => prev ? { ...prev, isBlacklisted: false, riskLevel: 'normal', label: 'Client normal', emoji: '🟡', score: 50 } : prev)
    } catch { /* ignore */ }
    setFlagging(false)
  }

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400">
        <Loader2 size={10} className="animate-spin" /> Score...
      </span>
    )
  }

  if (!info) return null

  const Icon = info.isBlacklisted ? Ban : info.riskLevel === 'risky' ? ShieldAlert : ShieldCheck
  const iconColor = info.isBlacklisted || info.riskLevel === 'risky'
    ? 'text-red-600'
    : info.riskLevel === 'warning'
      ? 'text-orange-600'
      : info.riskLevel === 'trusted'
        ? 'text-emerald-600'
        : 'text-blue-600'

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-black px-1.5 py-0.5 rounded-md border ${info.color}`}>
        <Icon size={10} /> {info.score}
      </span>
    )
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg border transition-all ${info.color}`}
      >
        <Icon size={12} className={iconColor} />
        {info.emoji} {info.label} — Score {info.score}/100
      </button>

      {showDetails && (
        <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Commandes</p>
              <p className="text-sm font-black text-gray-800">{info.totalOrders}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Livrées</p>
              <p className="text-sm font-black text-emerald-600">{info.successOrders}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Refusées</p>
              <p className="text-sm font-black text-red-600">{info.refusedOrders}</p>
            </div>
          </div>

          {/* Score bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                info.score >= 80 ? 'bg-emerald-500'
                : info.score >= 50 ? 'bg-blue-500'
                : info.score >= 30 ? 'bg-orange-500'
                : 'bg-red-500'
              }`}
              style={{ width: `${info.score}%` }}
            />
          </div>

          {/* Actions */}
          <div className="pt-1">
            {info.isBlacklisted ? (
              <button
                type="button"
                onClick={handleUnflag}
                disabled={flagging}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                <ShieldCheck size={12} />
                {flagging ? 'En cours...' : 'Retirer de la blacklist'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFlag}
                disabled={flagging}
                className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <Flag size={12} />
                {flagging ? 'En cours...' : '🚫 Signaler ce numéro'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
