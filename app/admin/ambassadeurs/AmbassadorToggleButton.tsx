'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AmbassadorToggleButtonProps {
  ambassadorId: string
  isActive: boolean
}

interface ToggleResponse {
  success?: boolean
  error?: string
}

export default function AmbassadorToggleButton({
  ambassadorId,
  isActive,
}: AmbassadorToggleButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ambassador/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambassadorId, isActive: !isActive }),
      })

      const data = (await res.json()) as ToggleResponse

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la mise à jour du statut.')
      } else {
        toast.success(
          `Ambassadeur ${!isActive ? 'activé' : 'désactivé'} avec succès.`
        )
        // Recharger la page pour refléter le nouveau statut
        setTimeout(() => window.location.reload(), 600)
      }
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive
          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
          : 'border-[#0F7A60]/30 text-[#0F7A60] hover:bg-[#0F7A60]/10'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        isActive ? 'Désactiver' : 'Activer'
      )}
    </button>
  )
}
