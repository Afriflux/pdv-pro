'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, CreditCard, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/lib/toast'

interface PlatformCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  productDetails: {
    id: string
    type: 'MASTERCLASS' | 'APP' | 'SMS' | 'AI' | 'TEMPLATE' | 'WORKFLOW'
    title: string
    price: number
    emoji?: string
    color?: string
  }
  wallet: {
    balance: number
    total_earned: number
  }
  onPurchaseViaWallet: () => Promise<{ success: boolean; error?: string; details?: string }>
}

export function PlatformCheckoutModal({ isOpen, onClose, productDetails, wallet, onPurchaseViaWallet }: PlatformCheckoutModalProps) {
  const router = useRouter()
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null)
  
  if (!isOpen) return null

  const isDebtAllowed = wallet.total_earned >= 100000;
  const missingAmount = Math.max(0, productDetails.price - wallet.balance);
  const potentialDebt = wallet.balance - productDetails.price;
  const isDebtRefused = potentialDebt < -10000;
  const canUseWallet = wallet.balance >= productDetails.price || (isDebtAllowed && !isDebtRefused);

  const handleExternalCheckout = async (method: string) => {
    setLoadingMethod(method)
    try {
      // Intégration future avec /api/billing/recharge-and-buy
      const res = await fetch('/api/billing/recharge-and-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: productDetails.id,
          assetType: productDetails.type,
          assetName: productDetails.title,
          amount: productDetails.price,
          method: method
        })
      });
      const data = await res.json();
      if (data.checkoutUrl) {
         window.location.href = data.checkoutUrl;
      } else {
         toast.error(data.error || "Erreur de génération de lien.")
      }
    } catch (err) {
      toast.error('Une erreur est survenue.')
    } finally {
      setLoadingMethod(null)
    }
  }

  const handleWalletSubmit = async () => {
    setLoadingMethod('wallet');
    const res = await onPurchaseViaWallet();
    if (res.success) {
      toast.success("Achat validé avec succès !");
      router.refresh();
      onClose();
    } else {
      toast.error(res.details || res.error || 'Erreur lors du paiement avec portefeuille.');
    }
    setLoadingMethod(null);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X size={16} className="text-gray-500" />
        </button>
        
        <div className="text-center mb-6 mt-2">
          {productDetails.emoji && (
            <div className={`w-16 h-16 ${productDetails.color || 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm`}>
              {productDetails.emoji}
            </div>
          )}
          <h3 className="text-2xl font-black text-ink">Checkout</h3>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">Facturation pour <strong className="text-ink">{productDetails.title}</strong></p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between font-black text-lg">
            <span className="text-gray-500">Montant total</span>
            <span className="text-ink">{productDetails.price.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">Modes de paiement</p>

          {/* 1. PORTEFEUILLE */}
          <button
            onClick={handleWalletSubmit}
            disabled={loadingMethod !== null || !canUseWallet}
            className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden group flex items-center justify-between
              ${canUseWallet ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100' : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-emerald-600">
                 {loadingMethod === 'wallet' ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
              </div>
              <div>
                <h4 className="font-black text-ink">Mon Portefeuille</h4>
                <p className="text-xs text-emerald-700/80 font-medium mt-0.5">Solde: {wallet.balance.toLocaleString()} FCFA</p>
              </div>
            </div>
            {canUseWallet && <ChevronRight size={18} className="text-emerald-500" />}
          </button>

          {/* MESSAGE PAY LATER */}
          {!canUseWallet && missingAmount > 0 && wallet.total_earned < 100000 && (
            <div className="text-[11px] text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 flex gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Solde insuffisant. Il vous manque {missingAmount.toLocaleString()} FCFA. Atteignez 100k FCFA de CA Global pour débloquer le paiement à découvert.</span>
            </div>
          )}
          {isDebtAllowed && missingAmount > 0 && isDebtRefused && (
            <div className="text-[11px] text-red-700 bg-red-50 px-3 py-2 rounded-xl border border-red-100 flex gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Plafond de découvert (-10 000 FCFA) dépassé par cet achat. Veuillez payer via Wave ou Carte.</span>
            </div>
          )}
          {isDebtAllowed && missingAmount > 0 && !isDebtRefused && (
            <div className="text-[11px] text-[#0F7A60] bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 flex gap-2 font-medium">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Vous achetez à l'aide de votre ligne de crédit Premium (Découvert).</span>
            </div>
          )}

          {/* 2. WAVE */}
          <button
            onClick={() => handleExternalCheckout('wave')}
            disabled={loadingMethod !== null}
            className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-between bg-white shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center p-1">
                 {loadingMethod === 'wave' ? <Loader2 className="animate-spin text-blue-500" size={20} /> : <img src="/wave.svg" alt="Wave" className="w-full h-full object-contain" />}
              </div>
              <div>
                <h4 className="font-black text-ink">Payer avec Wave</h4>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Sans frais additionnels</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          {/* 3. BICTORYS / CARTES */}
          <button
            onClick={() => handleExternalCheckout('bictorys')}
            disabled={loadingMethod !== null}
            className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center justify-between bg-white shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center p-1">
                 {loadingMethod === 'bictorys' ? <Loader2 className="animate-spin text-purple-500" size={20} /> : <img src="/bictorys.png" alt="Card" className="w-full h-full object-contain" />}
              </div>
              <div>
                <h4 className="font-black text-ink">CinetPay / Cartes</h4>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Visa, Mastercard, Orange Money</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

        </div>
        
        <p className="text-center text-[10px] text-gray-400 mt-6 font-medium">Paiements sécurisés par l'infrastructure Yayyam.</p>
      </div>
    </div>
  )
}
