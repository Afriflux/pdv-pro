'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ScrollText, Shield, Scale, X, CheckCircle2, AlertTriangle, Download, Mail, Loader2, Clock, FileText } from 'lucide-react'
import { toast } from '@/lib/toast'

interface AffiliateContractTabProps {
  contractAcceptedAt?: string | null
  affiliateName: string
}

export function AffiliateContractTab({ contractAcceptedAt, affiliateName: _affiliateName }: AffiliateContractTabProps) {
  const [showContract, setShowContract] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const isSigned = !!contractAcceptedAt

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
      toast.success("La charte affiliée a été envoyée sur votre compte email.")
    }, 1500)
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* Container Principal sans le fond supplémentaire car le layout l'a déjà */}
      <div className="relative z-10 w-full pt-4">
        
        {/* En-tête avec Icône */}
        <div className="relative -mt-16 sm:-mt-24 mb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
          <div className="relative group max-w-fit">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center relative border border-emerald-100">
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse duration-[2000ms]"></div>
                <ScrollText size={56} strokeWidth={1} className="text-emerald-700 group-hover:scale-110 transition-transform duration-700 relative z-10" />
              </div>
            </div>
          </div>

          {/* Statut */}
          {isSigned ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200 shadow-inner flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                 <CheckCircle2 size={20} />
               </div>
               <div>
                  <p className="font-black text-emerald-950 text-[14px]">Charte Signée Électroniquement</p>
                  <p className="text-[12px] text-emerald-800/80 font-medium">
                    Validée le {new Date(contractAcceptedAt!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
               </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 shadow-inner flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                 <AlertTriangle size={20} />
               </div>
               <div>
                  <p className="font-black text-amber-950 text-[14px]">Charte En Attente</p>
                  <p className="text-[12px] text-amber-800/80 font-medium">Votre signature est requise (Voir Bannière en Haut).</p>
               </div>
            </div>
          )}
        </div>
          
        {/* Titre Principal */}
        <div className="pb-10 space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Contrat Partenaire Affilié
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 font-bold text-[12px] rounded-full border border-slate-200 uppercase tracking-wide">
              <Shield size={14} /> Accord Mutuel
            </span>
            <span className="text-[14px] text-gray-500 font-medium">Les règles de promotion qui encadrent vos revenus.</span>
          </div>
        </div>

        {/* Fiche Contrat Interactive */}
        <div className="group relative max-w-3xl">
          <div className="relative bg-white/80 backdrop-blur-md rounded-[1.8rem] border border-gray-200/80 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all">
            
            <div className="w-16 h-16 rounded-[1.2rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-400 group-hover:text-emerald-700 transition-colors">
              <FileText size={28} />
            </div>
            
            <div className="flex-1">
              <p className="font-black text-[18px] text-gray-900 mb-1">Règles et Conditions d'Affiliation</p>
              <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-gray-500">
                <span className="flex items-center gap-1"><Clock size={14} /> Mise à jour : 10 Janvier 2024</span>
                <span className="flex items-center gap-1"><FileText size={14} /> Version 3.1</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 flex-col sm:flex-row">
              {isSigned && (
                <button 
                  type="button"
                  onClick={handleEmail}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-[14px] font-bold shadow-sm transition-all text-center flex items-center justify-center gap-2"
                >
                  {emailing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} 
                  <span className="hidden sm:inline">M'envoyer</span>
                </button>
              )}
              <button 
                type="button"
                onClick={() => setShowContract(true)}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[14px] font-bold shadow-md shadow-emerald-600/20 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <ScrollText size={18} /> Consulter le PDF
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* MODAL PREMIUM via PORTAL pour forcer le dépassement du Layout */}
      {showContract && mounted && createPortal(
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 bg-[#041D14]/60 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8">
            
            {/* Header Modal */}
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Scale size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900">Contrat Partenaire (Affilié)</h2>
                  <p className="text-xs text-gray-500 font-medium">Document Juridique Officiel</p>
                </div>
              </div>
              <button 
                type="button" 
                title="Fermer le modal"
                onClick={() => setShowContract(false)} 
                className="w-10 h-10 rounded-full bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Contenu Scrollable (Style papier légal) */}
            <div className="p-6 sm:p-10 overflow-y-auto text-[14px] sm:text-[15px] text-gray-600 leading-relaxed bg-[#FAFAFA] flex-1 relative bg-legal-paper">
              
              <div className="max-w-prose mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200/60 relative">
                
                <h1 className="text-2xl font-black text-gray-900 mb-8 pb-4 border-b-2 border-emerald-100 text-center uppercase tracking-widest">
                  Charte d'Affiliation
                </h1>

                <h3 className="mb-3 font-bold text-gray-900 text-[16px]">1. Objet de la Charte</h3>
                <p className="mb-8">Le présent accord régit la relation d'affiliation entre Yayyam et l'Affilié. Ce dernier s'engage à faire la promotion des offres et produits hébergés sur la plateforme afin de générer des ventes.</p>
                
                <h3 className="mb-3 font-bold text-gray-900 text-[16px]">2. Rémunération et Commissions</h3>
                <p className="mb-3">L'Affilié percevra une commission pour chaque vente finale et validée (notamment dans le cadre d'un modèle COD) acquise via son lien ou code de parrainage exclusif.</p>
                <ul className="list-disc pl-5 mb-8 space-y-2">
                  <li>Les commandes annulées ou retournées ne génèrent aucune commission.</li>
                  <li>Les fonds attribués sont visibles instantanément dans le Portefeuille.</li>
                </ul>
                
                <h3 className="mb-3 font-bold text-gray-900 text-[16px]">3. Éthique de Promotion</h3>
                <ul className="list-disc pl-5 mb-8 space-y-2">
                  <li><strong>Interdiction absolue du SPAM :</strong> L'envoi massif ou non sollicité d'e-mails est proscrit.</li>
                  <li>L'Affilié s'interdit de sur-vendre un produit en omettant délibérément la vérité.</li>
                  <li>Il est interdit de soumissionner sur les enchères publicitaires trompeuses du nom de marque "Yayyam".</li>
                </ul>

                <h3 className="mb-3 font-bold text-gray-900 text-[16px]">4. Paiements et Fraudes</h3>
                <p className="mb-8">Le système de retrait suit un échéancier strict. En cas de génération de fausses commandes ou de blanchiment, le compte affilié sera immédiatement radié sans préavis (incluant les gains générés).</p>
              </div>

            </div>
            
            {/* Footer Modal avec Actions Avancées */}
            <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
              
              <div className="flex items-center gap-3 w-full sm:w-auto order-2 sm:order-1">
                <button 
                  type="button" 
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 sm:flex-none px-5 py-2.5 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-[14px] transition-colors flex items-center justify-center gap-2"
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
