'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle2, 
  XCircle, 
  UserMinus, 
  UserCheck, 
  Loader2 
} from 'lucide-react'
import { toast } from 'sonner'

interface VendorActionsProps {
  vendorId: string
  kycStatus: string | null
  isActive: boolean
}

export default function VendorActions({ vendorId, kycStatus, isActive }: VendorActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (action: 'verify' | 'reject' | 'suspend' | 'activate') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/vendeurs/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!res.ok) throw new Error('Erreur lors de l\'action')

      toast.success(
        action === 'verify' ? 'KYC validé !' :
        action === 'reject' ? 'KYC rejeté !' :
        action === 'suspend' ? 'Compte suspendu !' : 'Compte réactivé !'
      )
      router.refresh()
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* ACTIONS KYC */}
      {kycStatus === 'pending' && (
        <>
          <button
            onClick={() => handleAction('verify')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
          >
            {loading === 'verify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Valider KYC
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all"
          >
            {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Rejeter KYC
          </button>
        </>
      )}

      {/* ACTIONS COMPTE */}
      {isActive ? (
        <button
          onClick={() => handleAction('suspend')}
          disabled={!!loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-600/30 text-orange-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all"
        >
          {loading === 'suspend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
          Suspendre
        </button>
      ) : (
        <button
          onClick={() => handleAction('activate')}
          disabled={!!loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all"
        >
          {loading === 'activate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
          Réactiver
        </button>
      )}
    </div>
  )
}
