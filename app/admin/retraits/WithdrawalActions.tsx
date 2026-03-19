'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface WithdrawalActionsProps {
  withdrawalId: string
  status: string
}

export default function WithdrawalActions({ withdrawalId, status }: WithdrawalActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  if (status !== 'pending') return null

  const handleAction = async (newStatus: 'approved' | 'rejected') => {
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/admin/retraits/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'action')
      }

      toast.success(newStatus === 'approved' ? 'Retrait approuvé !' : 'Retrait rejeté !')
      router.refresh()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Une erreur est survenue'
      toast.error(msg)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction('approved')}
        disabled={!!loading}
        className="p-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-lg transition-all disabled:opacity-50"
        title="Approuver"
      >
        {loading === 'approved' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
      </button>
      <button
        onClick={() => handleAction('rejected')}
        disabled={!!loading}
        className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-all disabled:opacity-50"
        title="Rejeter"
      >
        {loading === 'rejected' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
      </button>
    </div>
  )
}
