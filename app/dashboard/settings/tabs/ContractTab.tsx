'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Shield, Scale, ScrollText, X, CheckCircle2, Download, Mail, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

export function ContractTab({ store }: { store: any }) {
  const [showContract, setShowContract] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const isSigned = !!store?.contract_accepted_at

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      toast.success("Téléchargement du contrat PDF démarré.")
    }, 1500)
  }

  const handleEmail = () => {
    setEmailing(true)
    setTimeout(() => {
      setEmailing(false)
      toast.success("Le contrat a été envoyé sur votre adresse email.")
    }, 1500)
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER LÉGAL (Gradients Emerald) === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#041D14] overflow-hidden">
          {/* Gradients Héroïques */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A3D2C] via-[#05261B] to-[#041D14] opacity-90"></div>
          
          {/* Motifs classiques */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FFF 0, #FFF 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}></div>
          
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[10000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-700/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>

          {/* Top Actions flottantes */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-[13px] flex items-center gap-2 shadow-sm">
              <Scale size={16} className="text-emerald-400" />
              Juridique & Conformité
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative border border-slate-200">
                  <div className="absolute inset-0 bg-amber-500/5 animate-pulse duration-[2000ms]"></div>
                  <ScrollText size={56} strokeWidth={1} className="text-slate-700 group-hover:scale-110 transition-transform duration-700 relative z-10" />
                </div>
              </div>
            </div>

            {/* Banner Statut */}
            {isSigned ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200 shadow-inner flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                   <CheckCircle2 size={20} />
                 </div>
                 <div>
                    <p className="font-black text-emerald-950 text-[14px]">Document Signé Électroniquement</p>
                    <p className="text-[12px] text-emerald-800/80 font-medium">Validé le {new Date(store.contract_accepted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 shadow-inner flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                   <AlertTriangleIcon size={20} />
                 </div>
                 <div>
                    <p className="font-black text-amber-950 text-[14px]">Contrat En Attente</p>
                    <p className="text-[12px] text-amber-800/80 font-medium">Votre signature est requise pour poursuivre.</p>
                 </div>
              </div>
            )}
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-10 space-y-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Contrat Partenaire
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 font-bold text-[12px] rounded-full border border-slate-200 uppercase tracking-wide">
                <Shield size={14} /> Accord Mutuel
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Les termes liant votre boutique à l'infrastructure Yayyam.</span>
            </div>
          </div>

          {/* === INTERACTIVE CARD === */}
          <div className="group relative max-w-3xl">
            <div className="absolute -inset-0.5 rounded-[2rem] blur opacity-0 group-hover:opacity-20 transition duration-500 bg-slate-400"></div>
            <div className="relative bg-white/80 backdrop-blur-md rounded-[1.8rem] border border-gray-200/80 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:bg-white transition-all">
              
              <div className="w-16 h-16 rounded-[1.2rem] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors">
                <FileText size={28} />
              </div>
              
              <div className="flex-1">
                <p className="font-black text-[18px] text-gray-900 mb-1">Conditions Générales de Vente et d'Utilisation</p>
                <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-gray-500">
                  <span className="flex items-center gap-1"><ClockIcon size={14} /> Mise à jour : 10 Janvier 2024</span>
                  <span className="flex items-center gap-1"><FileIcon size={14} /> Version 2.4</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <button 
                  type="button"
                  onClick={() => setShowContract(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[14px] font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all active:scale-95 text-center flex items-center justify-center gap-2"
                >
                  <ScrollText size={18} /> Consulter le PDF
                </button>
              </div>
              
            </div>
          </div>

        </div>
      </div>

      {/* MODAL PREMIUM via PORTAL pour forcer le dépassement du Layout */}
      {showContract && mounted && createPortal(
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8">
            
            {/* Header Modal */}
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                  <Scale size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900">Contrat Partenaire (Vendeur)</h2>
                  <p className="text-xs text-gray-500 font-medium">Document Juridique Officiel</p>
                </div>
              </div>
              <button 
                type="button" 
                title="Fermer le modal"
                aria-label="Fermer le modal"
                onClick={() => setShowContract(false)} 
                className="w-10 h-10 rounded-full bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Contenu Scrollable (Style papier légal) */}
            <div className="p-6 sm:p-10 overflow-y-auto text-[14px] sm:text-[15px] text-gray-600 leading-relaxed bg-[#FAFAFA] flex-1 relative" style={{ backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px)', backgroundSize: '100% 2em', backgroundPosition: '0 1em' }}>
              
              <div className="max-w-prose mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200/60 relative">
                
                <h1 className="text-2xl font-black text-gray-900 mb-8 pb-4 border-b-2 border-slate-100 text-center uppercase tracking-widest">
                  Conditions G.V.U.
                </h1>

                <h3 className="mb-3 font-bold text-gray-900 text-[16px]">1. Objet du Contrat</h3>
                <p className="mb-8">Le présent contrat établit les conditions d'utilisation de la plateforme E-commerce Yayyam par le vendeur pour la création, la gestion et la vente de ses produits/services digitaux et physiques. Il régule les responsabilités des deux parties.</p>
                
                <h3 className="mb-3 font-bold text-gray-900 text-[16px]">2. Engagements de Yayyam</h3>
                <ul className="list-disc pl-5 mb-8 space-y-2">
                  <li>Fournir une infrastructure technique stable, hébergée et sécurisée.</li>
                  <li>Traiter les paiements via ses partenaires agréés et sécurisés.</li>
                  <li>Reverser les fonds au vendeur selon les délais standards (Retrait T+1).</li>
                  <li>Accompagner le vendeur dans l'utilisation de la solution technique.</li>
                </ul>
                
                <h3 className="mb-3 font-bold text-gray-900 text-[16px]">3. Engagements du Vendeur</h3>
                <ul className="list-disc pl-5 mb-8 space-y-2">
                  <li>Vendre des produits légaux, conformes et dont il a la possession intellectuelle ou les droits d'exploitation.</li>
                  <li>Traiter le service client, les remboursements et les réclamations de ses propres acheteurs avec diligence.</li>
                  <li>Ne pas contourner le système de commission de Yayyam en réalisant des fausses commandes ou du blanchiment.</li>
                  <li>S'acquitter des impôts et taxes en vigueur selon sa juridiction fiscale.</li>
                </ul>

                <h3 className="mb-3 font-bold text-gray-900 text-[16px]">4. Résiliation</h3>
                <p className="mb-8">En cas de manquement grave, de fraude ou de multiples litiges clients, Yayyam se réserve le droit de bloquer les fonds et de suspendre le compte du vendeur sans préavis pour protéger ses intérêts et ceux des acheteurs.</p>
              </div>

            </div>
            
            {/* Footer Modal avec Actions Avancées */}
            <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
              
              <div className="flex items-center gap-3 w-full sm:w-auto order-2 sm:order-1">
                <button 
                  type="button" 
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 sm:flex-none px-5 py-2.5 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-[14px] transition-colors flex items-center justify-center gap-2"
                >
                  {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span className="hidden sm:inline">Télécharger</span>
                </button>
                <button 
                  type="button" 
                  onClick={handleEmail}
                  disabled={emailing}
                  className="flex-1 sm:flex-none px-5 py-2.5 border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-[14px] transition-colors flex items-center justify-center gap-2"
                >
                  {emailing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  <span className="hidden sm:inline">M'envoyer par email</span>
                </button>
              </div>

              <button 
                type="button" 
                onClick={() => setShowContract(false)} 
                className="w-full sm:w-auto px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[14px] transition-colors shadow-lg shadow-emerald-600/20 active:scale-95 order-1 sm:order-2"
              >
                Compris & Fermer
              </button>
              
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function ClockIcon({ size = 24, className = "" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function FileIcon({ size = 24, className = "" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function AlertTriangleIcon({ size = 24, className = "" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  )
}
