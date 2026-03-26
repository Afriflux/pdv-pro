'use client'

import React, { useState } from 'react'
import { Disc, ShoppingBag, Layers, CheckCircle2, Box, PackageOpen, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function VendorTypeTab({ store }: { store: any }) {
  const router = useRouter()
  const [vendorType, setVendorType] = useState(store?.vendor_type || 'digital')
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Calcule du blocage
  const lastUpdateStr = store?.vendor_type_updated_at;
  let isBlocked = false;
  let daysRemaining = 0;
  if (lastUpdateStr) {
    const lastDate = new Date(lastUpdateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      isBlocked = true;
      daysRemaining = 30 - diffDays;
      if (daysRemaining < 1) daysRemaining = 1;
    }
  }

  const hasChanged = vendorType !== store?.vendor_type;

  const handleSaveField = async () => {
    if (isBlocked || !hasChanged) return;

    setLoading(true)
    try {
      const res = await fetch('/api/settings/update-field', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'vendor_type', value: vendorType }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur sauvegarde')
      }
      
      toast.success('Modèle économique mis à jour avec succès')
      setShowConfirmModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
      setVendorType(store?.vendor_type || 'digital') // revert
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER (Indigo Profond) === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#022C22] overflow-hidden">
          {/* Gradients Flous Complexes Héroïques */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#0F766E] opacity-90"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[10000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center relative border border-emerald-100">
                  <Box size={56} strokeWidth={1} className="text-emerald-600 group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-8 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              Modèle Économique
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[12px] rounded-full border border-emerald-100 uppercase tracking-wide">
                <PackageOpen size={14} /> Structure de la Boutique
              </span>
              {isBlocked ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 font-bold text-[12px] rounded-full border border-red-200 uppercase tracking-wide">
                  Changement bloqué ({daysRemaining} jours restants)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 font-bold text-[12px] rounded-full border border-gray-200 uppercase tracking-wide">
                  <CheckCircle2 size={14} className="text-gray-500" /> Confirmation Requise
                </span>
              )}
            </div>
            <p className="text-[14px] text-gray-500 font-medium max-w-2xl">Définissez la nature de vos produits pour adapter le tableau de bord (Stock, Facturation, Livraison...). {isBlocked ? "Vous devez attendre 30 jours entre chaque changement." : "Une confirmation sera demandée."}</p>
          </div>

          {/* === LES 3 CARTES MASSIVES === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Produit Digital */}
            <label 
              className={`relative flex flex-col items-center text-center p-8 sm:p-10 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer group'} ${
              vendorType === 'digital' 
                ? 'border-teal-500 bg-white/60 shadow-[0_0_40px_rgba(20,184,166,0.15)] ring-4 ring-teal-50' 
                : isBlocked ? 'border-gray-200 bg-gray-50 opacity-40' : 'border-white bg-white/40 hover:bg-white/60 hover:border-teal-200/50 hover:shadow-lg'
            }`}>
              {/* Effet Glow au Focus/Checked */}
              <div className={`absolute inset-0 bg-gradient-to-b from-teal-500/10 to-transparent transition-opacity duration-500 ${vendorType === 'digital' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
              
              <input type="radio" name="vendor_type" className="sr-only" checked={vendorType === 'digital'} onChange={() => setVendorType('digital')} disabled={loading || isBlocked} />
              
              {vendorType === 'digital' && (
                <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-sm animate-in zoom-in duration-300">
                  <CheckCircle2 size={24} className="text-teal-600 fill-teal-100" />
                </div>
              )}
              
              <div className={`relative p-5 rounded-3xl mb-6 transition-all duration-500 shadow-sm ${vendorType === 'digital' ? 'bg-teal-600 text-white scale-110 shadow-teal-500/30' : 'bg-gray-50 text-gray-500 border border-gray-100 group-hover:scale-110'}`}>
                <Disc size={36} strokeWidth={1.5} />
              </div>
              
              <h3 className="font-black text-gray-900 text-[18px] relative z-10 tracking-tight">Biens Digitaux</h3>
              <p className="text-[13px] text-gray-500 mt-2 font-medium leading-relaxed relative z-10">
                E-books, Logiciels, Formations vidéos, Modèles... Livraison immédiate avec accès sécurisé.
              </p>
            </label>

            {/* Produit Physique */}
            <label 
              className={`relative flex flex-col items-center text-center p-8 sm:p-10 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer group'} ${
              vendorType === 'physical' 
                ? 'border-amber-500 bg-white/60 shadow-[0_0_40px_rgba(245,158,11,0.15)] ring-4 ring-amber-50' 
                : isBlocked ? 'border-gray-200 bg-gray-50 opacity-40' : 'border-white bg-white/40 hover:bg-white/60 hover:border-amber-200/50 hover:shadow-lg'
            }`}>
              <div className={`absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent transition-opacity duration-500 ${vendorType === 'physical' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
              
              <input type="radio" name="vendor_type" className="sr-only" checked={vendorType === 'physical'} onChange={() => setVendorType('physical')} disabled={loading || isBlocked} />
              
              {vendorType === 'physical' && (
                <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-sm animate-in zoom-in duration-300">
                  <CheckCircle2 size={24} className="text-amber-500 fill-amber-100" />
                </div>
              )}
              
              <div className={`relative p-5 rounded-3xl mb-6 transition-all duration-500 shadow-sm ${vendorType === 'physical' ? 'bg-amber-500 text-white scale-110 shadow-amber-500/30' : 'bg-gray-50 text-gray-500 border border-gray-100 group-hover:scale-110'}`}>
                <ShoppingBag size={36} strokeWidth={1.5} />
              </div>
              
              <h3 className="font-black text-gray-900 text-[18px] relative z-10 tracking-tight">Biens Physiques</h3>
              <p className="text-[13px] text-gray-500 mt-2 font-medium leading-relaxed relative z-10">
                Cosmétiques, Vêtements, Électronique... Gère le paiement à la livraison (COD) et l'expédition.
              </p>
            </label>

            {/* Hybride */}
            <label 
              className={`relative flex flex-col items-center text-center p-8 sm:p-10 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer group'} ${
              vendorType === 'hybrid' 
                ? 'border-emerald-500 bg-white/60 shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-4 ring-emerald-50' 
                : isBlocked ? 'border-gray-200 bg-gray-50 opacity-40' : 'border-white bg-white/40 hover:bg-white/60 hover:border-emerald-200/50 hover:shadow-lg'
            }`}>
              <div className={`absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent transition-opacity duration-500 ${vendorType === 'hybrid' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
              
              <input type="radio" name="vendor_type" className="sr-only" checked={vendorType === 'hybrid'} onChange={() => setVendorType('hybrid')} disabled={loading || isBlocked} />
              
              {vendorType === 'hybrid' && (
                <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-sm animate-in zoom-in duration-300">
                  <CheckCircle2 size={24} className="text-emerald-500 fill-emerald-100" />
               </div>
              )}
              
              <div className={`relative p-5 rounded-3xl mb-6 transition-all duration-500 shadow-sm ${vendorType === 'hybrid' ? 'bg-emerald-600 text-white scale-110 shadow-emerald-500/30' : 'bg-gray-50 text-gray-500 border border-gray-100 group-hover:scale-110'}`}>
                <Layers size={36} strokeWidth={1.5} />
              </div>
              
              <h3 className="font-black text-gray-900 text-[18px] relative z-10 tracking-tight">Hybride (Mixte)</h3>
              <p className="text-[13px] text-gray-500 mt-2 font-medium leading-relaxed relative z-10">
                La puissance des deux réunis. Proposez des téléchargements automatiques et des colis normaux.
              </p>
            </label>

          </div>

          {/* Bouton de confirmation inférieur (toujours affiché pour meilleure UX) */}
          <div className="mt-8 flex justify-end border-t border-gray-200/50 pt-8">
            <button 
              onClick={() => setShowConfirmModal(true)}
              disabled={loading || isBlocked || !hasChanged}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <CheckCircle2 size={18} />}
              {hasChanged ? "Confirmer le nouveau modèle" : "Aucun changement"}
            </button>
          </div>

        </div>
      </div>

      {/* Modal de Confirmation Premium */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !loading && setShowConfirmModal(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 sm:p-8 flex items-start gap-5 border-b border-amber-100/60">
              <div className="bg-white text-amber-500 p-3 rounded-2xl shrink-0 shadow-sm border border-amber-100">
                <AlertTriangle size={28} strokeWidth={2.5} />
              </div>
              <div className="pt-1">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Confirmer la modification ?</h3>
                <p className="text-[14px] text-amber-800/80 font-medium mt-1 leading-snug">
                  Attention, ce choix est soumis à une période de blocage sécuritaire.
                </p>
              </div>
              <button 
                title="Fermer"
                onClick={() => !loading && setShowConfirmModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-white/50 hover:bg-white rounded-full p-2 transition-all"
              >
                <X size={20} className="stroke-[2.5px]" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 sm:p-8">
              <div className="bg-gray-50/80 border border-gray-200/60 rounded-2xl p-5 mb-8">
                <p className="text-[15px] text-gray-600 font-medium leading-relaxed text-center">
                  En validant ce nouveau modèle économique, vous ne pourrez plus le modifier pendant <strong className="text-gray-900 font-black">30 jours complets (1 mois)</strong>.
                  <br className="mb-2" />
                  Êtes-vous certain(e) de votre choix ?
                </p>
              </div>
              
              {/* Footer / Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-3.5 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[1.2rem] font-bold text-[14px] transition-all disabled:opacity-50 w-full sm:w-auto"
                >
                  Annuler
                </button>
                <button 
                  type="button"
                  onClick={handleSaveField}
                  disabled={loading}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.2rem] font-bold text-[14px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                  {loading ? <span className="w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin"></span> : <CheckCircle2 size={18} />}
                  Oui, je confirme
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
