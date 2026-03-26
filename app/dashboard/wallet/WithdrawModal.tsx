'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import WithdrawForm from './WithdrawForm'

interface WithdrawModalProps {
  balance: number
  withdrawalMethod: string
  withdrawalNumber: string
  withdrawalName: string
  storeId: string
  hasWithdrawalAccount: boolean
  canWithdraw: boolean
}

export function WithdrawModal({
  balance,
  withdrawalMethod,
  withdrawalNumber,
  withdrawalName,
  storeId,
  hasWithdrawalAccount,
  canWithdraw
}: WithdrawModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatAmount = (val: number) => new Intl.NumberFormat('fr-FR').format(val)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative overflow-hidden w-full sm:w-auto px-6 py-3.5 bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] text-white rounded-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3 group ring-4 ring-[#1A1A1A]/10 hover:ring-[#1A1A1A]/30 shadow-[0_8px_30px_rgba(26,26,26,0.2)]"
      >
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
        
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all shadow-inner backdrop-blur-md relative z-10">
          <span className="text-base">💸</span>
        </div>
        
        <div className="flex flex-col items-start text-left relative z-10">
          <span className="text-sm font-black leading-none mb-1">Demander un retrait</span>
          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
            Reçu instantanément
          </span>
        </div>
      </button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between shrink-0">
                <h3 className="text-xl font-display font-black text-[#1A1A1A]">Retirer mes fonds</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-[#1A1A1A] transition text-2xl">×</button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2 pb-2">
                {canWithdraw ? (
                  <WithdrawForm
                    balance={balance}
                    withdrawalMethod={withdrawalMethod || 'wave'}
                    withdrawalNumber={withdrawalNumber || ''}
                    withdrawalName={withdrawalName || ''}
                    storeId={storeId}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="bg-[#FAFAF7] rounded-2xl p-5 text-center border border-gray-50 mt-4">
                      {!hasWithdrawalAccount ? (
                        <div className="space-y-3">
                          <span className="text-3xl">⚙️</span>
                          <p className="text-sm font-bold text-gray-600">Configuration requise</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                            Ajoutez un moyen de retrait pour pouvoir transférer vos fonds.
                          </p>
                          <Link href="/dashboard/settings#retrait" onClick={() => setIsOpen(false)} className="inline-flex items-center justify-center mt-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm">
                            Paramètres →
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2 py-3">
                          <span className="text-3xl">🔒</span>
                          <p className="text-sm font-bold text-gray-600">Solde insuffisant</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            Il vous manque <strong className="text-gray-600 font-bold">{formatAmount(5000 - balance)} FCFA</strong> pour atteindre le seuil de retrait.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
