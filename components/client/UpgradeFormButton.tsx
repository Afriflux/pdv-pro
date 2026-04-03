'use client'

import React, { useState } from 'react'

interface UpgradeFormButtonProps {
  action: () => void | Promise<void>
  children: React.ReactNode
  className?: string
  confirmationTitle: string
  confirmationText: string
  theme: 'emerald' | 'amber' | 'blue'
}

export function UpgradeFormButton({
  action,
  children,
  className,
  confirmationTitle,
  confirmationText,
  theme
}: UpgradeFormButtonProps) {
  const [showModal, setShowModal] = useState(false)

  const themeClasses = {
    emerald: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20',
    amber: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20',
    blue: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
  }

  return (
    <>
      <button 
        type="button" 
        onClick={() => setShowModal(true)} 
        className={className}
      >
        {children}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white text-center mb-2">{confirmationTitle}</h3>
            <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">
              {confirmationText}
            </p>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm border border-white/10"
              >
                Annuler
              </button>
              <form action={action} className="flex-1">
                <button
                  type="submit"
                  className={`w-full py-3 text-white text-center font-bold rounded-xl transition-all text-sm shadow-lg ${themeClasses[theme]}`}
                >
                  Confirmer
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
