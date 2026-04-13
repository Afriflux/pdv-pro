'use client'

import React from 'react'

interface MobileSimulatorProps {
  children: React.ReactNode
  title?: string
}

export function MobileSimulator({ children, title = "Aperçu mobile" }: MobileSimulatorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Phone Frame */}
      <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl overflow-hidden ring-1 ring-gray-900/5">
        {/* Top Notch / Dynamic Island */}
        <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-2xl mx-16 z-20 flex justify-center items-center">
          <div className="w-10 h-1.5 bg-gray-900 rounded-full mt-1 opacity-50"></div>
        </div>

        {/* Content Area */}
        <div className="relative bg-white h-full w-full overflow-y-auto custom-scrollbar">
          {/* Header (Optional simulator header) */}
          {title && (
             <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 text-center py-3 pt-8 shadow-sm">
               <span className="text-xs font-black tracking-widest uppercase text-gray-500">{title}</span>
             </div>
          )}
          
          <div className="pb-10">
            {children}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 px-4 py-2 bg-[#0F7A60]/10 border border-[#0F7A60]/20 rounded-full text-[#0F7A60] animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F7A60] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F7A60]"></span>
        </div>
        <p className="text-xs font-bold tracking-tight">Synchronisation temps réel</p>
      </div>
    </div>
  )
}
