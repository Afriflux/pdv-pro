'use client'

import { useEffect, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { X, Loader2, Users, ShieldAlert, ShieldCheck, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react'
import { getAmbassadorDetails, payAmbassador } from '@/app/admin/ambassadeurs/actions'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'

interface AmbassadorDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  ambassadorId: string | null
  ambassadorName: string
  ambassadorCode: string
}

export default function AmbassadorDetailsDrawer({ isOpen, onClose, ambassadorId, ambassadorName, ambassadorCode }: AmbassadorDetailsDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'referrals' | 'transactions'>('referrals')
  const [isPaying, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (isOpen && ambassadorId) {
      setLoading(true)
      getAmbassadorDetails(ambassadorId)
        .then(res => setData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    } else {
      setData(null)
      setActiveTab('referrals')
    }
  }, [isOpen, ambassadorId])

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 flex flex-col translate-x-0`}>
        
        {/* HEADER */}
        <div className="flex-shrink-0 bg-gradient-to-r from-[#0D5C4A] to-[#0F7A60] px-6 py-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <button 
            onClick={onClose}
            aria-label="Fermer le tiroir"
            title="Fermer"
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
               <div className="px-2 py-1 bg-white/20 text-white backdrop-blur-md rounded border border-white/30 text-xs font-black uppercase tracking-widest shadow-sm inline-block">
                 Code: {ambassadorCode}
               </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{ambassadorName}</h2>
            <p className="text-emerald-100/80 text-sm mt-1">Détails de parrainage et transactions</p>
          </div>
          
          <div className="absolute top-4 right-16 z-10">
             <button
                onClick={() => {
                  startTransition(async () => {
                    if (!ambassadorId) return
                    try {
                      const res = await payAmbassador(ambassadorId)
                      toast.success(`Succès ! Ambassadeur payé de ${res.amount} FCFA`)
                      // Refresh for new transaction list
                      const newData = await getAmbassadorDetails(ambassadorId)
                      setData(newData)
                      router.refresh()
                    } catch (err: unknown) {
                      toast.error(`Erreur de paiement: ${err instanceof Error ? err.message : String(err)}`)
                    }
                  })
                }}
                disabled={isPaying}
                className="bg-white/20 hover:bg-white text-white hover:text-[#0F7A60] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm focus:outline-none flex items-center gap-2"
             >
                {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Solder le compte
             </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('referrals')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'referrals' ? 'border-[#0F7A60] text-[#0F7A60]' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}
          >
            <Users className="w-4 h-4" />
            Filleuls Recrutés
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-[#0F7A60] text-[#0F7A60]' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}
          >
            <CreditCard className="w-4 h-4" />
            Transactions
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAF7] custom-scrollbar p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0F7A60]" />
              <p className="text-sm font-medium">Chargement des données...</p>
            </div>
          ) : !data ? (
            <p className="text-center text-gray-400 py-10">Aucune donnée trouvée.</p>
          ) : (
            <>
              {activeTab === 'referrals' && (
                <div className="space-y-4">
                  {data.referrals.length === 0 ? (
                    <div className="text-center py-10">
                       <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                         <Users className="w-8 h-8 text-gray-300" />
                       </div>
                       <p className="text-sm font-bold text-gray-400">Aucun vendeur parrainé pour le moment.</p>
                    </div>
                  ) : (
                    data.referrals.map((ref: any) => {
                      const store = ref.Store as { name: string; slug: string; kyc_status: string } | undefined
                      return (
                        <div key={ref.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                               <Link href={`/admin/vendeurs/${ref.vendor_store_id}`} className="text-sm font-black text-gray-900 group flex items-center gap-1.5 focus:outline-none">
                                 {store?.name ?? 'Boutique introuvable'}
                                 <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#0F7A60] transition-colors" />
                               </Link>
                               <p className="text-xs text-gray-400 font-mono mt-0.5">Inscription : {format(new Date(ref.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                            </div>
                            <div className="text-right">
                              {ref.is_qualified ? (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 border border-emerald-200 font-black text-xs uppercase tracking-wider text-emerald-600">
                                  Qualifié
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-amber-50 border border-amber-200 font-black text-xs uppercase tracking-wider text-amber-600">
                                  En test ({ref.ca_in_registration_month} FCFA)
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-3 text-xs">
                             <div className="flex items-center gap-2">
                               {store?.kyc_status === 'verified' ? (
                                 <span className="flex items-center gap-1 text-emerald-600 font-bold"><ShieldCheck className="w-3.5 h-3.5" /> KYC OK</span>
                               ) : (
                                 <span className="flex items-center gap-1 text-red-500 font-bold"><ShieldAlert className="w-3.5 h-3.5" /> KYC Manquant</span>
                               )}
                             </div>
                             <div className="font-bold">
                               Commission: {ref.commission_paid ? <span className="text-blue-600">Payée ({ref.commission_amount}F)</span> : <span className="text-gray-400">Non payée</span>}
                             </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  {data.transactions.length === 0 ? (
                    <div className="text-center py-10">
                       <p className="text-sm font-bold text-gray-400">Aucune transaction (commission / retrait) effectuée.</p>
                    </div>
                  ) : (
                    data.transactions.map((tx: any) => (
                      <div key={tx.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'commission' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-gray-900">{tx.type === 'commission' ? 'Gain (+)' : 'Retrait (-)'}</p>
                              <p className="text-xs text-gray-400">{format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                              {tx.description && <p className="text-xs text-gray-500 mt-1">{tx.description}</p>}
                            </div>
                         </div>
                         <div className="text-right">
                           <p className={`text-sm font-black ${tx.type === 'commission' ? 'text-emerald-600' : 'text-gray-800'}`}>
                             {tx.amount.toLocaleString()} F
                           </p>
                           <span className={`text-xs uppercase font-bold ${tx.status === 'completed' ? 'text-blue-500' : 'text-amber-500'}`}>
                             {tx.status}
                           </span>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
