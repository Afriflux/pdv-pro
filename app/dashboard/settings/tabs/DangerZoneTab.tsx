'use client'

import React, { useState } from 'react'
import { AlertTriangle, Loader2, ShieldAlert, Skull, Flame } from 'lucide-react'
import * as Actions from '@/app/actions/settings'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'

export function DangerZoneTab() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onDeleteAccount = async () => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation Requise',
      text: 'Voulez-vous vraiment supprimer votre boutique et toutes ses données (commandes, produits, etc.) ? Cette action est IMMÉDIATE et IRRÉVERSIBLE.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer définitivement',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (!result.isConfirmed) {
      return
    }
    
    setLoading(true)
    try {
      await Actions.deleteAccount()
      toast.success('Compte supprimé avec succès.')
      router.push('/')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression')
      setLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Master Container Glassmorphism (Thème Danger) 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-red-200/50 rounded-[2.5rem] shadow-[0_8px_30px_rgb(239,68,68,0.05)] overflow-hidden relative">
        
        {/* === HEADER / BANNER DANGER (Gradients Rouges Lumineux) === */}
        <div className="h-48 sm:h-72 w-full relative bg-red-600 overflow-hidden">
          {/* Gradients Héroïques */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-rose-600 opacity-90"></div>
          
          {/* Motifs "Attention" clairs */}
          <div className="absolute inset-0 opacity-[0.15] bg-[length:20px_20px] bg-[repeating-linear-gradient(45deg,#FFF_0,#FFF_10px,transparent_10px,transparent_20px)]"></div>
          
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[5000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/30 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>

          {/* Top Actions flottantes */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <div className="px-5 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full font-bold text-[13px] flex items-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.1)] uppercase tracking-widest">
              <Skull size={16} className="text-white drop-shadow-md" strokeWidth={2.5} />
              Zone Critique
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center relative border border-red-200">
                  <div className="absolute inset-0 bg-red-500/10 animate-pulse duration-[1000ms]"></div>
                  <Flame size={56} strokeWidth={1} className="text-red-600 group-hover:scale-110 transition-transform duration-700 relative z-10 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Banner Statut Danger */}
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-2xl border border-red-200 shadow-inner flex items-start gap-4 max-w-lg">
               <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                 <AlertTriangle size={20} />
               </div>
               <div>
                  <p className="font-black text-red-950 text-[14px]">Avertissement de sécurité</p>
                  <p className="text-[12px] text-red-800/80 font-medium leading-snug">Les actions effectuées dans cette zone ne peuvent pas être annulées. Veuillez procéder avec une extrême prudence.</p>
               </div>
            </div>
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-10 space-y-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Danger Zone
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 font-bold text-[12px] rounded-full border border-red-200 uppercase tracking-wide">
                <ShieldAlert size={14} /> Actions irréversibles
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Gestion de la suppression et de la désactivation de votre boutique.</span>
            </div>
          </div>

          <div className="flex flex-col gap-6">

            {/* === INTERACTIVE DANGER CARD === */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-[2rem] blur opacity-0 group-hover:opacity-30 transition duration-500 bg-red-500"></div>
              <div className="relative bg-white/80 backdrop-blur-md rounded-[1.8rem] border-2 border-red-100 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center hover:border-red-300 transition-all overflow-hidden">
                
                {/* Ligne rouge à gauche */}
                <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>

                <div className="flex-1 pl-4">
                  <h4 className="font-black text-[18px] text-red-600 mb-2 flex items-center gap-2">
                    Supprimer définitivement la boutique
                  </h4>
                  <p className="text-[14px] text-gray-600 font-medium leading-relaxed max-w-2xl">
                    Une fois que vous aurez supprimé votre boutique, vous perdrez <b>définitivement</b> l'accès à vos produits, vos commandes, vos clients, et vos statistiques. 
                    Cette action ne peut pas être annulée.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={(e) => { e.preventDefault(); onDeleteAccount(); }}
                    disabled={loading}
                    type="button"
                    className="w-full sm:w-auto px-8 py-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-[14px] font-black border border-red-200 hover:border-red-600 shadow-sm hover:shadow-[0_8px_30px_rgb(239,68,68,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Skull size={18} />}
                    SUPPRIMER LA BOUTIQUE
                  </button>
                </div>
                
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
