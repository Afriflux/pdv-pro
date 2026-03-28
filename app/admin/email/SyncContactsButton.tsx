'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function SyncContactsButton() {
  const [syncing, setSyncing] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSync() {
    setSyncing(true)
    setSuccess(false)
    
    // Simulate initial delay to show the spinner clearly
    await new Promise(r => setTimeout(r, 800))

    try {
      // In production, uncomment the fetch call. 
      // For this test/preview flow, we just simulate the sync to avoid Brevo API errors on mock data.
      
      const res = await fetch('/api/admin/email/sync', { method: 'POST' })
      if (!res.ok) throw new Error('La clé API Brevo est manquante ou invalide.')
      
      const data = await res.json()
      if (data.error) throw new Error(data.error)
        
      setSuccess(true)
      toast.success(
        `Synchronisation réussie ! ${data.data?.syncedBuyers ?? 0} Acheteurs et ${data.data?.syncedVendors ?? 0} Vendeurs poussés vers Brevo.`
      )
      
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Erreur lors de la synchronisation.'
      if (message.includes('API') || message.length > 0) {
        toast.error(message || 'Erreur lors de la synchronisation.')
      }
    } finally {
      setSyncing(false)
    }
  }

  return (
    <button 
      onClick={handleSync}
      disabled={syncing}
      className={`flex items-center gap-2 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl font-bold transition-all text-sm group disabled:cursor-not-allowed ${
        success 
          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50' 
          : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
      }`}
    >
      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
      <span>{syncing ? 'Synchro en cours...' : success ? 'Parfaitement Synchronisé' : 'Synchroniser Contacts'}</span>
    </button>
  )
}
