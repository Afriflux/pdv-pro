import React from 'react'
import { Lock } from 'lucide-react'

interface Props {
  className?: string
  showLock?: boolean
}

export default function LocalPaymentBadges({ className = '', showLock = true }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Logos array */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* WAVE */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1CBEF0]/10 border border-[#1CBEF0]/20 rounded-lg">
          <div className="w-5 h-5 rounded-full bg-[#1CBEF0] flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black">W</span>
          </div>
          <span className="text-[#1CBEF0] text-xs font-black tracking-tight">Wave</span>
        </div>

        {/* ORANGE MONEY */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF7900]/10 border border-[#FF7900]/20 rounded-lg">
          <div className="w-5 h-5 rounded bg-[#FF7900] flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 border-2 border-white rounded-sm" />
          </div>
          <span className="text-[#FF7900] text-xs font-black tracking-tight">Orange <span className="font-semibold">Money</span></span>
        </div>

        {/* MTN MoMo */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFCC00]/10 border border-[#FFCC00]/20 rounded-lg">
          <div className="w-5 h-5 rounded-full bg-[#FFCC00] flex items-center justify-center shrink-0">
            <span className="text-[#004A7F] text-[9px] font-black tracking-tighter">MTN</span>
          </div>
          <span className="text-[#004A7F] text-xs font-black tracking-tight">MoMo</span>
        </div>

        {/* FREE MONEY */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E60000]/10 border border-[#E60000]/20 rounded-lg">
          <div className="w-5 h-5 rounded-full bg-[#E60000] flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black">Free</span>
          </div>
          <span className="text-[#E60000] text-xs font-black tracking-tight">Money</span>
        </div>
      </div>

      {showLock && (
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 cursor-default mt-1">
          <Lock className="w-3.5 h-3.5 text-[#0F7A60]" />
          Paiement 100% Sécurisé
        </p>
      )}
    </div>
  )
}
