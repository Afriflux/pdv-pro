'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Wallet, Smartphone, Building2, Landmark, CheckCircle2, Loader2, ArrowRightLeft, ShieldCheck, CreditCard } from 'lucide-react'

export function FinanceTab({ store }: { store: any }) {
  const router = useRouter()
  const [withdrawalMethod, setWithdrawalMethod] = useState<'wave' | 'orange_money' | 'bank'>(
    (store?.withdrawal_method as 'wave' | 'orange_money' | 'bank' | null | undefined) ?? 'wave'
  )
  const [withdrawalNumber, setWithdrawalNumber] = useState(store?.withdrawal_number ?? '')
  const [withdrawalName, setWithdrawalName] = useState(store?.withdrawal_name ?? '')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawalNumber.trim()) return toast.error('Le numéro de compte est obligatoire.')
    if (!withdrawalName.trim()) return toast.error('Le nom du titulaire est obligatoire.')
    
    setLoading(true)
    try {
      const res = await fetch('/api/settings/withdrawal', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          withdrawalMethod,
          withdrawalNumber: withdrawalNumber.trim(),
          withdrawalName:   withdrawalName.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Coordonnées de retrait sauvegardées avec succès !')
        router.refresh()
      } else {
        throw new Error(data.error ?? 'Erreur lors de la sauvegarde')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur interne')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER FINANCE (Gradients Émeraude/Teal) === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#022C22] overflow-hidden">
          {/* Gradients Héroïques */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#0F766E] opacity-90"></div>
          
          {/* Motifs géométriques */}
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(45deg, #10B981 1px, transparent 1px), linear-gradient(-45deg, #10B981 1px, transparent 1px)', backgroundSize: '60px 60px', backgroundPosition: '0 0, 30px 30px' }}></div>
          
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[10000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>

          {/* Top Actions flottantes */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(16,185,129,0.15)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Sécuriser les données
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center relative border border-emerald-100">
                  <div className="absolute inset-0 bg-emerald-500/5 animate-pulse duration-1000"></div>
                  <Landmark size={56} strokeWidth={1} className="text-emerald-500 group-hover:scale-110 transition-transform duration-700 relative z-10" />
                </div>
              </div>
            </div>

            {/* Banner Explicatif Warning */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 sm:p-6 text-sm rounded-2xl border border-emerald-200/50 shadow-inner flex items-start gap-4 max-w-lg mb-2 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-teal-400"></div>
              <div className="p-3 bg-white rounded-xl shadow-[0_4px_10px_rgb(16,185,129,0.1)] text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                <ArrowRightLeft size={24} />
              </div>
              <div>
                <p className="font-black text-emerald-950 text-[15px] mb-1">Virements Automatiques</p>
                <p className="text-emerald-800/80 font-medium leading-relaxed">
                  Gérez les coordonnées où seront versés les fonds de votre portefeuille. Les transferts sont effectués sous 24h-48h ouvrées.
                </p>
              </div>
            </div>
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-10 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              Portefeuille & Retraits
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[12px] rounded-full border border-emerald-100 uppercase tracking-wide">
                <Wallet size={14} /> Options de versement
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Configurez votre fournisseur favori pour recevoir vos fonds.</span>
            </div>
          </div>

          <div className="flex flex-col gap-10">

            {/* === SÉLECTION DU FOURNISSEUR (3 Cartes Massives) === */}
            <div>
              <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-4 block">1. Choisissez un fournisseur</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Wave */}
                <button
                  type="button"
                  onClick={() => setWithdrawalMethod('wave')}
                  className={`relative p-6 text-left rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden group ${
                    withdrawalMethod === 'wave' 
                    ? 'border-[#00a2ff] bg-[#00a2ff]/[0.02] shadow-[0_8px_30px_rgb(0,162,255,0.1)]' 
                    : 'border-transparent bg-gray-50 hover:bg-[#00a2ff]/5 hover:border-[#00a2ff]/30'
                  }`}
                >
                  {withdrawalMethod === 'wave' && <div className="absolute inset-0 bg-[#00a2ff]/5 border-[3px] border-[#00a2ff] rounded-[1.5rem] pointer-events-none"></div>}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${withdrawalMethod === 'wave' ? 'bg-[#00a2ff] text-white shadow-lg' : 'bg-white text-gray-400 shadow-sm group-hover:text-[#00a2ff]'}`}>
                    <Smartphone size={28} />
                  </div>
                  <div>
                    <h3 className={`font-black text-[18px] tracking-tight mb-1 ${withdrawalMethod === 'wave' ? 'text-[#00a2ff]' : 'text-gray-900'}`}>Wave Mobile</h3>
                    <p className="text-sm font-medium text-gray-500 leading-snug">Virement rapide vers un compte Wave Sénégal / CI.</p>
                  </div>
                  {withdrawalMethod === 'wave' && (
                    <div className="absolute top-6 right-6 text-[#00a2ff] animate-in zoom-in">
                      <CheckCircle2 size={24} className="fill-[#00a2ff]/20" />
                    </div>
                  )}
                </button>

                {/* Orange Money */}
                <button
                  type="button"
                  onClick={() => setWithdrawalMethod('orange_money')}
                  className={`relative p-6 text-left rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden group ${
                    withdrawalMethod === 'orange_money' 
                    ? 'border-[#ff6600] bg-[#ff6600]/[0.02] shadow-[0_8px_30px_rgb(255,102,0,0.1)]' 
                    : 'border-transparent bg-gray-50 hover:bg-[#ff6600]/5 hover:border-[#ff6600]/30'
                  }`}
                >
                  {withdrawalMethod === 'orange_money' && <div className="absolute inset-0 bg-[#ff6600]/5 border-[3px] border-[#ff6600] rounded-[1.5rem] pointer-events-none"></div>}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${withdrawalMethod === 'orange_money' ? 'bg-[#ff6600] text-white shadow-lg' : 'bg-white text-gray-400 shadow-sm group-hover:text-[#ff6600]'}`}>
                    <Smartphone size={28} />
                  </div>
                  <div>
                    <h3 className={`font-black text-[18px] tracking-tight mb-1 ${withdrawalMethod === 'orange_money' ? 'text-[#ff6600]' : 'text-gray-900'}`}>Orange Money</h3>
                    <p className="text-sm font-medium text-gray-500 leading-snug">Virement vers un compte Orange Money actif.</p>
                  </div>
                  {withdrawalMethod === 'orange_money' && (
                    <div className="absolute top-6 right-6 text-[#ff6600] animate-in zoom-in">
                      <CheckCircle2 size={24} className="fill-[#ff6600]/20" />
                    </div>
                  )}
                </button>

                {/* Bank */}
                <button
                  type="button"
                  onClick={() => setWithdrawalMethod('bank')}
                  className={`relative p-6 text-left rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden group ${
                    withdrawalMethod === 'bank' 
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-[0_8px_30px_rgb(5,150,105,0.1)]' 
                    : 'border-transparent bg-gray-50 hover:bg-gray-100/80 hover:border-gray-300'
                  }`}
                >
                  {withdrawalMethod === 'bank' && <div className="absolute inset-0 bg-emerald-600/5 border-[3px] border-emerald-600 rounded-[1.5rem] pointer-events-none"></div>}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${withdrawalMethod === 'bank' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white text-gray-400 shadow-sm group-hover:text-emerald-600'}`}>
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h3 className={`font-black text-[18px] tracking-tight mb-1 ${withdrawalMethod === 'bank' ? 'text-gray-900' : 'text-gray-900'}`}>Virement Bancaire</h3>
                    <p className="text-sm font-medium text-gray-500 leading-snug">Transfert direct vers votre compte (UEMOA / SEPA).</p>
                  </div>
                  {withdrawalMethod === 'bank' && (
                    <div className="absolute top-6 right-6 text-gray-900 animate-in zoom-in">
                      <CheckCircle2 size={24} className="fill-gray-900/20" />
                    </div>
                  )}
                </button>

              </div>
            </div>

            {/* Séparateur */}
            <div className="h-px bg-gray-100 w-full"></div>

            {/* === INFOS DU COMPTE === */}
            <div>
              <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-4 block">2. Saisissez vos coordonnées</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                
                {/* Numéro / IBAN */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-20 transition duration-500 bg-emerald-500"></div>
                  <div className="relative bg-white/60 backdrop-blur-md rounded-[1.2rem] border border-gray-200/80 p-5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all flex flex-col gap-2">
                    <label className="text-[14px] font-black text-gray-900 tracking-tight">
                      {withdrawalMethod === 'bank' ? "IBAN / RIB Complet" : "Numéro de téléphone"}
                    </label>
                    <input 
                      type="text"
                      value={withdrawalNumber}
                      onChange={(e) => setWithdrawalNumber(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none py-2 text-[16px] font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal font-mono transition-colors"
                      placeholder={withdrawalMethod === 'bank' ? "SN..." : "Format: 77xxx / +225..."}
                    />
                  </div>
                </div>

                {/* Nom */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-20 transition duration-500 bg-emerald-500"></div>
                  <div className="relative bg-white/60 backdrop-blur-md rounded-[1.2rem] border border-gray-200/80 p-5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all flex flex-col gap-2">
                    <label className="text-[14px] font-black text-gray-900 tracking-tight">
                      Nom complet du titulaire
                    </label>
                    <input 
                      type="text"
                      value={withdrawalName}
                      onChange={(e) => setWithdrawalName(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none py-2 text-[16px] font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal transition-colors"
                      placeholder="Ex: Amadou Fall"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Bouton de sauvegarde inférieur (Fix visibilité) */}
          <div className="mt-8 flex justify-end border-t border-gray-200/50 pt-8">
            <button 
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <CreditCard size={18} />}
              Sauvegarder les paramètres
            </button>
          </div>

        </div>
      </div>
    </form>
  )
}
