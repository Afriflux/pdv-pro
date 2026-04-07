'use client'

import { Settings, Lock, Activity } from 'lucide-react'

interface MaintenanceScreenProps {
  message?: string
}

export default function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 selection:bg-[#0F7A60]/20">
      <div className="max-w-md w-full relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>

        <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.05)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-[#0F7A60] to-emerald-400"></div>
          
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-2xl mb-6 shadow-inner border border-emerald-100">
            <Settings className="w-10 h-10 text-[#0F7A60] animate-[spin_4s_linear_infinite]" />
            <div className="absolute -bottom-2 -right-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
              <Lock className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3 font-display">
             Maintenance en cours
          </h1>
          
          <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
            {message || "Notre équipe technique effectue actuellement une mise à jour importante de la plateforme pour améliorer votre expérience. Nous serons de retour dans quelques instants."}
          </p>

          <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 flex items-center justify-center gap-3">
             <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
             <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
               Système verrouillé temporairement
             </span>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs font-bold text-gray-400">© {new Date().getFullYear()} Yayyam. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  )
}
