'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, addYears } from 'date-fns'

import { toast } from '@/lib/toast'
import { AlertTriangle, CheckCircle2, ShieldCheck, ShieldAlert, ShieldX, Files, UserCheck, LayoutGrid, List, ChevronRight, XCircle, FileText, Maximize2, ZoomIn, ZoomOut, MessageCircle, Calendar } from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface KYCDocuments {
  full_name?:        string
  id_card_url?:      string
  id_card_back_url?: string
  domicile_url?:     string
  submitted_at?:     string
  rejection_reason?: string
  expiration_date?:  string
}

export interface StoreKYC {
  id:                string
  name:              string
  slug:              string
  kyc_status:        string
  kyc_document_type: string | null
  kyc_documents:     KYCDocuments | null
  id_card_url:       string | null
  created_at:        string
  user_id:           string
}

interface KYCClientProps {
  stores: StoreKYC[]
  currentStatus: string
  totalSubmitted: number
  totalVerified: number
  totalRejected: number
  totalProfiles: number
  isDemoMode?: boolean
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────
export default function KYCClient({ 
  stores, 
  currentStatus, 
  totalSubmitted, 
  totalVerified, 
  totalRejected, 
  totalProfiles, 
  isDemoMode = false 
}: KYCClientProps) {
  
  const [localStores, setLocalStores] = useState<StoreKYC[]>(stores)
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('CARDS')
  const [selectedStore, setSelectedStore] = useState<StoreKYC | null>(null)
  
  const [rejectionReason, setRejectionReason] = useState('')
  const [expirationDate, setExpirationDate] = useState<string>(() => format(addYears(new Date(), 5), 'yyyy-MM-dd'))
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxScale, setLightboxScale] = useState(1)

  // Sync state if props change (ex: nav through tabs)
  useEffect(() => {
    setLocalStores(stores)
  }, [stores])

  useEffect(() => {
    if (selectedStore) setRejectionReason(selectedStore.kyc_documents?.rejection_reason || '')
  }, [selectedStore])

  const formatDateLabel = (iso?: string | null) => {
    if (!iso) return 'N/A'
    const d = new Date(iso)
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const handleAction = async (actionType: 'approve' | 'reject' | 'correction') => {
    if (!selectedStore) return
    if (actionType === 'reject' && !rejectionReason.trim()) {
      toast.error('Un motif de rejet est obligatoire.')
      return
    }



    if (isDemoMode) {
      setLocalStores(prev => prev.filter(s => s.id !== selectedStore.id)) // Remove from current tab
      setSelectedStore(null)
      toast.success(
        actionType === 'approve' ? 'Dossier Validé jusqu\'en ' + expirationDate : 
        actionType === 'correction' ? 'Demande de correction envoyée' : 'Dossier Rejeté'
      )
      return
    }

    const payload: Record<string, string> = { action: actionType, reason: rejectionReason.trim() }
    if (actionType === 'approve') payload.expiration_date = expirationDate

    const promise = fetch(`/api/admin/kyc/${selectedStore.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur API')
    })

    toast.promise(promise, {
      loading: "Traitement du dossier...",
      success: actionType === 'approve' ? "Dossier KYC Validé" : actionType === 'correction' ? "Demande de correction envoyée" : "Dossier KYC Rejeté",
      error: "Erreur lors du traitement"
    })

    promise.then(() => {
      // Remove from UI since it's no longer in the current status tab
      setLocalStores(prev => prev.filter(s => s.id !== selectedStore.id))
      setSelectedStore(null)
    }).catch((e) => { console.error('[KYC Client] Action failed:', e) })

    return undefined;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-12 flex flex-col items-center w-full">
      
      {/* ── EN-TÊTE FULL BLEED IMMERSIF ── */}
      <div className="relative bg-gradient-to-r from-[#012928] to-[#0A4138] pt-16 pb-32 px-4 sm:px-6 lg:px-8 border-b border-white/10 w-full overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -z-0 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[80px] -z-0 pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-widest uppercase">
                Gouvernance & Sécurité
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Review Hub KYC <span className="text-emerald-400 opacity-60">·</span>
            </h1>
            <p className="mt-4 text-emerald-100/70 text-sm max-w-xl font-medium leading-relaxed">
              Vérification des identités et conformité des vendeurs de la plateforme.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 w-full">
        
        {/* ── MODE DÉMO BANNER ── */}
        {isDemoMode && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-800">MODE DÉMO ACTIVÉ</h3>
              <p className="text-xs text-amber-700/80 mt-0.5">Vous naviguez actuellement avec de faux dossiers générés aléatoirement car votre base de données est vide.</p>
            </div>
          </div>
        )}

        {/* ── KPI STATS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           <div className="bg-white/70 backdrop-blur-3xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                <ShieldAlert className="w-24 h-24 text-[#C9A84C]" />
              </div>
              <p className="text-xs font-black uppercase text-[#C9A84C]/80 tracking-widest mb-1 relative z-10">À Traiter</p>
              <div className="flex items-baseline gap-2 relative z-10">
                 <h3 className="text-4xl font-black text-[#C9A84C] tracking-tight">{totalSubmitted}</h3>
              </div>
           </div>

           <div className="bg-white/70 backdrop-blur-3xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <ShieldCheck className="w-24 h-24 text-[#0F7A60]" />
              </div>
              <p className="text-xs font-black uppercase text-[#0F7A60]/80 tracking-widest mb-1 relative z-10">Vérifiés</p>
              <div className="flex items-baseline gap-2 relative z-10">
                 <h3 className="text-4xl font-black text-[#0F7A60] tracking-tight">{totalVerified}</h3>
              </div>
           </div>

           <div className="bg-white/70 backdrop-blur-3xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <ShieldX className="w-24 h-24 text-red-500" />
              </div>
              <p className="text-xs font-black uppercase text-red-500/80 tracking-widest mb-1 relative z-10">Rejetés</p>
              <div className="flex items-baseline gap-2 relative z-10">
                 <h3 className="text-4xl font-black text-red-500 tracking-tight">{totalRejected}</h3>
              </div>
           </div>

           <div className="bg-white/70 backdrop-blur-3xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                <UserCheck className="w-24 h-24" />
              </div>
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1 relative z-10">Vendeurs</p>
              <div className="flex items-baseline gap-2 relative z-10">
                 <h3 className="text-4xl font-black text-gray-900 tracking-tight">{totalProfiles}</h3>
              </div>
           </div>
        </div>

        {/* ── LAYOUT 2 COLONNES (Onglets & Contenu) ── */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* ── COLONNE GAUCHE : ONGLETS LATÉRAUX ── */}
          <aside className="w-full lg:w-[280px] flex-shrink-0 sticky top-[80px] z-10">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest pl-4 mb-3">Statuts KYC</h2>
            
            <nav className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-3xl p-3 flex flex-col gap-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <Link 
                href="/admin/kyc?status=submitted" 
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden group ${currentStatus === 'submitted' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md shadow-amber-500/20' : 'bg-transparent text-gray-500 hover:bg-white hover:text-amber-500 border border-transparent'}`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${currentStatus === 'submitted' ? 'bg-white' : 'bg-amber-400'}`} />
                  <span>En attente</span>
                </div>
                <span className={`text-xs font-black tabular-nums relative z-10 px-2 py-0.5 rounded-md ${currentStatus === 'submitted' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'}`}>
                  {totalSubmitted}
                </span>
              </Link>

              <Link 
                href="/admin/kyc?status=verified" 
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden group ${currentStatus === 'verified' ? 'bg-gradient-to-r from-[#0F7A60] to-teal-600 text-white shadow-md shadow-[#0F7A60]/20' : 'bg-transparent text-gray-500 hover:bg-white hover:text-[#0F7A60] border border-transparent'}`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${currentStatus === 'verified' ? 'bg-white' : 'bg-[#0F7A60]'}`} />
                  <span>Vérifiés</span>
                </div>
                <span className={`text-xs font-black tabular-nums relative z-10 px-2 py-0.5 rounded-md ${currentStatus === 'verified' ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-600'}`}>
                  {totalVerified}
                </span>
              </Link>

              <Link 
                href="/admin/kyc?status=rejected" 
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden group ${currentStatus === 'rejected' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20' : 'bg-transparent text-gray-500 hover:bg-white hover:text-red-500 border border-transparent'}`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${currentStatus === 'rejected' ? 'bg-white' : 'bg-red-500'}`} />
                  <span>Rejetés</span>
                </div>
                <span className={`text-xs font-black tabular-nums relative z-10 px-2 py-0.5 rounded-md ${currentStatus === 'rejected' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                  {totalRejected}
                </span>
              </Link>
            </nav>
          </aside>

          {/* ── COLONNE DROITE : CONTENU PRINCIPAL ── */}
          <div className="flex-1 w-full space-y-6">

            {/* En-tête de vue intégré */}
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/80 backdrop-blur-2xl border border-white/50 p-4 sm:p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Dossiers "{currentStatus === 'submitted' ? 'En Attente' : currentStatus === 'verified' ? 'Vérifiés' : 'Rejetés'}"</h2>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">{localStores.length} dossiers affichés actuellement</p>
                </div>
              </div>

              <div className="flex items-center bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
                <button 
                  title="Vue en cartes"
                  onClick={() => setViewMode('CARDS')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'CARDS' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  title="Vue en tableau"
                  onClick={() => setViewMode('TABLE')}
                  className={`p-2.5 rounded-lg transition-all ${viewMode === 'TABLE' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* ── État vide Premium ── */}
            {localStores.length === 0 && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-16 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/50 to-transparent pointer-events-none" />
                <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/50">
                  {currentStatus === 'submitted' ? <Files className="w-10 h-10 text-[#C9A84C]" /> : <ShieldCheck className="w-10 h-10 text-gray-300" />}
                  <div className="absolute -inset-4 bg-emerald-400/20 rounded-full blur-xl -z-10" />
                </div>
                <h2 className="text-xl font-black text-[#1A1A1A] mb-2 relative z-10">Aucun dossier trouvé</h2>
                <p className="text-sm text-gray-500 relative z-10">
                  Il n'y a aucun dossier d'identité dans cette catégorie.
                </p>
              </div>
            )}

            {/* ── VUE TABLEAU ── */}
            {viewMode === 'TABLE' && localStores.length > 0 && (
              <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-in fade-in">
                <div className="overflow-x-auto relative z-10">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Vendeur</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Document</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Date soumission</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Identité fournie</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50">
                      {localStores.map(store => {
                        const docs = store.kyc_documents
                        const submittedAt = docs?.submitted_at ? formatDateLabel(docs.submitted_at) : formatDateLabel(store.created_at)
                        const docType = store.kyc_document_type ?? 'N/A'
                        const fullName = docs?.full_name ?? '—'
                        
                        return (
                          <tr key={store.id} className="hover:bg-white/60 transition-colors group cursor-pointer" onClick={() => setSelectedStore(store)}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 flex items-center justify-center flex-shrink-0">
                                  <span className="font-black text-[#0F7A60]">{store.name[0]?.toUpperCase()}</span>
                                </div>
                                <span className="font-bold text-gray-900">{store.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg border border-gray-200/50 uppercase">{docType}</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                              {submittedAt}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-700 hidden sm:table-cell">
                              {fullName}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white hover:bg-[#0F7A60] rounded-xl text-xs font-bold transition-all shadow-sm">
                                Auditer
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── VUE CARTES KANBAN ── */}
            {viewMode === 'CARDS' && localStores.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none -translate-y-1/4"></div>

                {localStores.map(store => {
                  const docs = store.kyc_documents
                  const submittedAt = docs?.submitted_at ? formatDateLabel(docs.submitted_at) : formatDateLabel(store.created_at)
                  const docType = store.kyc_document_type ?? 'N/A'
                  const fullName = docs?.full_name ?? '—'
                  const docIcon = docType === 'cni' ? '🪪' : docType === 'passeport' ? '📕' : docType === 'permis' ? '🚗' : '📄'

                  return (
                    <div key={store.id} className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-5 relative overflow-hidden group">
                      
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 flex items-center justify-center flex-shrink-0">
                               <span className="font-black text-[#0F7A60] text-lg">{store.name[0]?.toUpperCase()}</span>
                           </div>
                           <div>
                             <h3 className="font-black text-gray-900 leading-none">{store.name}</h3>
                             <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><UserCheck size={12}/> {fullName}</p>
                           </div>
                        </div>
                        <span className="text-xs font-black text-gray-400 border border-gray-200 px-2 py-1 rounded-lg bg-white/50">{submittedAt}</span>
                      </div>

                      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <span className="text-xl">{docIcon}</span>
                           <div>
                             <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Document Reçu</p>
                             <p className="text-sm font-bold text-gray-700 capitalize">{docType}</p>
                           </div>
                        </div>
                        <div className="flex gap-1">
                           {docs?.id_card_url && <span className="w-2 h-2 rounded-full bg-[#0F7A60]"></span>}
                           {docs?.id_card_back_url && <span className="w-2 h-2 rounded-full bg-teal-400"></span>}
                           {docs?.domicile_url && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        </div>
                      </div>

                      <button onClick={() => setSelectedStore(store)} className="w-full mt-2 py-3 bg-gray-900 hover:bg-[#0F7A60] text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 group-hover:scale-[1.02]">
                        Auditer le dossier <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>

                    </div>
                  )
                })}
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* ── TIROIR D'AUDIT KYC (DRAWER) ── */}
      {selectedStore && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer" onClick={() => setSelectedStore(null)}></div>
          
          {/* Tiroir */}
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 relative flex flex-col border-l border-gray-200">
            
            {/* Header Tiroir */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm relative">
                  <FileText size={24} />
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white">
                    {Math.floor(Math.random() * 20 + 80)}% Trust
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Audit d'Identité</h2>
                  <p className="text-sm font-bold text-gray-500 mt-0.5 flex items-center gap-1.5">
                    {selectedStore.name} 
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span> 
                    <span className="text-[#0F7A60] bg-[#0F7A60]/10 px-2 py-0.5 rounded-md text-xs uppercase tracking-wider border border-[#0F7A60]/20">Score de Fiabilité A</span>
                  </p>
                </div>
              </div>
              <button title="Fermer" onClick={() => setSelectedStore(null)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-gray-100 hover:border-red-200 shadow-sm hover:shadow">
                <XCircle size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
               
               {/* OCR Analysis removed for Phase V1 (00 Mockups) */}               {/* Identity Verification */}
               <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                   <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Documents Fournis</h3>
                   <span className="text-xs font-bold text-[#0F7A60] bg-[#0F7A60]/10 px-3 py-1 rounded-lg border border-[#0F7A60]/20 uppercase flex items-center gap-1">
                     <CheckCircle2 size={14} /> {selectedStore.kyc_document_type}
                   </span>
                 </div>
                 
                 <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Recto (Image HD)</p>
                         {selectedStore.kyc_documents?.id_card_url || selectedStore.id_card_url ? (
                           <button onClick={() => { setLightboxImage(selectedStore.kyc_documents?.id_card_url || selectedStore.id_card_url!); setLightboxScale(1); }} className="block relative aspect-[1.58] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group/img w-full cursor-zoom-in">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={selectedStore.kyc_documents?.id_card_url || selectedStore.id_card_url!} alt="Recto" className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-500" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white font-bold text-sm flex items-center gap-2 border border-white/30 shadow-xl"><Maximize2 size={16}/> Agrandir (Lightbox)</span>
                             </div>
                           </button>
                         ) : <div className="aspect-[1.58] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-200 border-dashed">Absent</div>}
                       </div>

                       <div className="space-y-2">
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Verso (Optionnel)</p>
                         {selectedStore.kyc_documents?.id_card_back_url ? (
                           <button onClick={() => { setLightboxImage(selectedStore.kyc_documents!.id_card_back_url!); setLightboxScale(1); }} className="block relative aspect-[1.58] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group/img w-full cursor-zoom-in">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={selectedStore.kyc_documents.id_card_back_url} alt="Verso" className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-500" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white font-bold text-sm flex items-center gap-2 border border-white/30 shadow-xl"><Maximize2 size={16}/> Agrandir (Lightbox)</span>
                             </div>
                           </button>
                         ) : <div className="aspect-[1.58] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-200 border-dashed">Absent</div>}
                       </div>

                       <div className="space-y-2 md:col-span-2">
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Justificatif de domicile (Moins de 3 mois)</p>
                         {selectedStore.kyc_documents?.domicile_url ? (
                           <button onClick={() => { setLightboxImage(selectedStore.kyc_documents!.domicile_url!); setLightboxScale(1); }} className="block relative h-48 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group/img w-full cursor-zoom-in">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={selectedStore.kyc_documents.domicile_url} alt="Domicile" className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-500" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white font-bold text-sm flex items-center gap-2 border border-white/30 shadow-xl"><Maximize2 size={16}/> Agrandir (Lightbox)</span>
                             </div>
                           </button>
                         ) : <div className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-200 border-dashed">Absent</div>}
                       </div>
                    </div>
                 </div>
               </div>

            </div>

            {/* Actions Sticky Bottom */}
            {currentStatus === 'submitted' && (
              <div className="p-6 border-t border-gray-200 bg-white shadow-[0_-15px_40px_rgba(0,0,0,0.06)] shrink-0 flex flex-col gap-5 z-20">
                 
                 {/* Ligne 1 : Date expiration & Soft Reject */}
                 <div className="flex flex-col sm:flex-row gap-4">
                   <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-200/60 shadow-inner">
                     <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar size={14} className="text-[#0F7A60]"/> Date d'expiration KYC</label>
                     <input 
                       type="date"
                       title="Date d'expiration"
                       className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none cursor-pointer"
                       value={expirationDate}
                       onChange={e => setExpirationDate(e.target.value)}
                     />
                   </div>
                   <div className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-200/60 shadow-inner flex flex-col justify-center">
                     <label className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MessageCircle size={14}/> Demander correction</label>
                     <button 
                       onClick={() => handleAction('correction')}
                       className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl text-xs font-bold transition-colors border border-amber-300/50 shadow-sm"
                     >
                       Soft Reject (WhatsApp)
                     </button>
                   </div>
                 </div>

                 {/* Ligne 2 : Rejet total & Validation */}
                 <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100/50">
                   <label className="text-xs font-black text-red-500 uppercase tracking-widest mb-2 flex">Motif de rejet strict (Optionnel pour Validation)</label>
                   <textarea
                     className="w-full bg-white border border-red-200 shadow-inner rounded-xl p-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none transition-all placeholder:text-gray-400"
                     placeholder="Ex: Faux document avéré, usurpation..."
                     rows={2}
                     value={rejectionReason}
                     onChange={e => setRejectionReason(e.target.value)}
                   />
                 </div>

                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleAction('reject')}
                      className="w-1/3 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-red-500/20 flex flex-col items-center justify-center gap-1"
                    >
                      <ShieldX size={20}/> Rejeter
                    </button>
                    <button 
                      onClick={() => handleAction('approve')}
                      className="w-2/3 py-4 bg-gradient-to-r from-[#0F7A60] to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl font-bold text-base transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                      <ShieldCheck size={22}/> Valider le Dossier
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIGHTBOX (VISIONNEUSE D'IMAGE) ── */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          
          <button title="Fermer" onClick={() => setLightboxImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-red-500/80 text-white rounded-full transition-all border border-white/20 hover:scale-110 z-50">
            <XCircle size={32} />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 z-50 shadow-2xl">
            <button title="Dézoomer" onClick={() => setLightboxScale(s => Math.max(0.5, s - 0.25))} className="p-2.5 text-white hover:bg-white/20 rounded-full transition-colors"><ZoomOut size={24}/></button>
            <span className="text-white font-mono font-bold w-12 text-center text-sm">{Math.round(lightboxScale * 100)}%</span>
            <button title="Zoomer" onClick={() => setLightboxScale(s => Math.min(3, s + 0.25))} className="p-2.5 text-white hover:bg-white/20 rounded-full transition-colors"><ZoomIn size={24}/></button>
          </div>

          <div className="w-full h-full p-12 flex items-center justify-center overflow-auto cursor-zoom-out" onClick={() => setLightboxImage(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={lightboxImage} 
              alt="KYC Document Zoom" 
              className="max-w-full max-h-full object-contain transition-transform duration-300 shadow-2xl"
              ref={el => { if (el) el.style.transform = `scale(${lightboxScale})` }}
              onClick={(e) => e.stopPropagation()} // Prevent close on image click
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
