'use client'

import { useState } from 'react'
import { MapPin, CheckCircle2, Loader2, X } from 'lucide-react'

interface SaveAddressCTAProps {
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  deliveryAddress: string
}

export function SaveAddressCTA({ buyerName, buyerPhone, buyerEmail, deliveryAddress }: SaveAddressCTAProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'dismissed'>('idle')
  const [selectedLabel, setSelectedLabel] = useState<string>('Domicile')

  if (status === 'saved' || status === 'dismissed') return null

  const handleSave = async () => {
    setStatus('saving')
    try {
      // Vérifier si l'email correspond à un utilisateur
      const checkRes = await fetch(`/api/checkout/addresses?email=${encodeURIComponent(buyerEmail)}`)
      const checkData = await checkRes.json() as { addresses: { address: string }[] }
      
      // Si l'adresse existe déjà, ne pas la re-sauvegarder
      if (checkData.addresses?.some(a => a.address === deliveryAddress)) {
        setStatus('saved')
        return
      }

      // Sauvegarder via l'API (on passe par un endpoint dédié pour les non-connectés)
      const res = await fetch('/api/checkout/save-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: buyerEmail,
          name: buyerName,
          phone: buyerPhone,
          address: deliveryAddress,
          label: selectedLabel,
        })
      })
      
      if (res.ok) {
        setStatus('saved')
      } else {
        // Si l'utilisateur n'a pas de compte, on masque simplement
        setStatus('dismissed')
      }
    } catch {
      setStatus('dismissed')
    }
  }

  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5 text-left relative animate-in slide-in-from-bottom-2 duration-300">
      <button 
        onClick={() => setStatus('dismissed')} 
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 text-gray-400 hover:text-gray-600 hover:bg-white transition"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
          <MapPin size={20} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Sauvegarder cette adresse ?</h4>
          <p className="text-xs text-blue-700/80 mt-0.5">Pour pré-remplir automatiquement lors de votre prochain achat.</p>
        </div>
      </div>

      <p className="text-sm text-blue-800 font-medium mb-3 bg-white/60 p-2.5 rounded-lg border border-blue-100 italic">
        &quot;{deliveryAddress}&quot;
      </p>

      <div className="flex items-center gap-2 mb-4">
        {['Domicile', 'Bureau', 'Autre'].map(label => (
          <button
            key={label}
            type="button"
            onClick={() => setSelectedLabel(label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              selectedLabel === label
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
            }`}
          >
            {label === 'Domicile' ? '🏠' : label === 'Bureau' ? '🏢' : '📍'} {label}
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={status === 'saving'}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
      >
        {status === 'saving' ? (
          <><Loader2 size={14} className="animate-spin" /> Sauvegarde...</>
        ) : (
          <><CheckCircle2 size={14} /> Enregistrer dans mon carnet</>
        )}
      </button>
    </div>
  )
}
