'use client'

import { useState } from 'react'
import { User, MapPin, Edit2, Check, X, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'

interface EditableCardProps {
  orderId: string
  buyerName: string
  buyerPhone: string | null
  buyerEmail: string | null
  deliveryAddress: string | null
}

export default function OrderBuyerEditableCard({
  orderId,
  buyerName,
  buyerPhone,
  buyerEmail,
  deliveryAddress
}: EditableCardProps) {
  const router = useRouter()
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (field: string, currentValue: string | null) => {
    setEditingField(field)
    setEditValue(currentValue || '')
  }

  const handleSave = async (field: string) => {
    try {
      setIsSaving(true)
      const res = await fetch(`/api/admin/orders/${orderId}/buyer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: field, value: editValue.trim() })
      })

      if (!res.ok) throw new Error('Erreur de mise à jour')

      toast.success('Information mise à jour avec succès')
      setEditingField(null)
      router.refresh()
    } catch (err) {
      toast.error('Impossible de mettre à jour le champ')
    } finally {
      setIsSaving(false)
    }
  }

  // Petit Helper Local pour rendre les champs text ou multiline
  const renderField = (field: string, label: string, currentValue: string | null, isMultiline = false) => {
    const isEditing = editingField === field

    if (isEditing) {
      return (
        <div className={`bg-white border-2 border-[#0F7A60]/40 rounded-xl p-2.5 shadow-sm transition-all animate-in fade-in duration-200 ${isMultiline ? 'flex-1' : ''}`}>
          <p className="text-[10px] font-bold text-[#0F7A60] uppercase tracking-widest mb-1.5">{label}</p>
          {isMultiline ? (
            <textarea
              className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F7A60]/30 min-h-[80px]"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              disabled={isSaving}
              autoFocus
            />
          ) : (
            <input
              type="text"
              className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F7A60]/30"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              disabled={isSaving}
              autoFocus
            />
          )}
          <div className="flex items-center gap-2 mt-2 justify-end">
            <button
              onClick={() => setEditingField(null)}
              disabled={isSaving}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSave(field)}
              disabled={isSaving}
              className="p-1.5 text-white bg-[#0F7A60] hover:bg-[#0A5A46] rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className={`group relative bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-[#0F7A60]/30 transition-all ${isMultiline ? 'flex-1' : ''}`}>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-sm font-bold text-[#1A1A1A] ${isMultiline ? 'whitespace-pre-wrap' : 'truncate'}`}>
          {currentValue || <span className="text-gray-400 font-medium italic">Non renseigné</span>}
        </p>
        
        <button
          onClick={() => handleEdit(field, currentValue)}
          className="absolute top-3 right-3 p-1.5 bg-white text-gray-400 hover:text-[#0F7A60] rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-gray-200"
          title="Modifier"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      {/* Carte ACHEUTEUR */}
      <section className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-base font-black text-gray-900 tracking-tight">Acheteur</h2>
          </div>
        </div>
        
        <div className="space-y-4">
          {renderField('buyer_name', 'Nom complet', buyerName)}
          <div className="flex gap-4">
            <div className="flex-1 shrink-0">
               {renderField('buyer_phone', 'Téléphone', buyerPhone)}
            </div>
          </div>
          {renderField('buyer_email', 'Email', buyerEmail)}
        </div>
      </section>

      {/* Carte LIVRAISON */}
      <section className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <MapPin className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-base font-black text-gray-900 tracking-tight">Adresse de Livraison</h2>
          </div>
        </div>
        
        {renderField('delivery_address', 'Adresse / Recommandations', deliveryAddress, true)}
      </section>
    </div>
  )
}
