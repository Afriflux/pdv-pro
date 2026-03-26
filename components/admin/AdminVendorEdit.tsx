'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, X, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface AdminVendorEditProps {
  storeId: string
  userId: string
  initialData: {
    role: string
    email: string
    whatsapp: string | null
    onboarding_completed: boolean
    kyc_status: string | null
  }
}

export default function AdminVendorEdit({ storeId, userId, initialData }: AdminVendorEditProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState(initialData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/vendeurs/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_info',
          userId,
          updates: formData
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de la mise à jour')
      }

      toast.success('Informations mises à jour avec succès')
      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 flex items-center gap-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-sm"
      >
        <Settings className="w-4 h-4 text-gray-400" />
        Éditer les infos
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#0A2E22]/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#FAFAF7]/50">
              <div>
                <h3 className="text-lg font-black text-[#1A1A1A]">Édition Administrative</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Modification manuelle des données système.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              <div className="space-y-4">
                {/* Rôle */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Rôle Utilisateur</label>
                  <select
                    title="Rôle de l'utilisateur"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all"
                  >
                    <option value="vendeur">Vendeur (Standard)</option>
                    <option value="gestionnaire">Gestionnaire (Staff)</option>
                    <option value="support">Support (Staff)</option>
                    <option value="super_admin">Super Admin (Privilégié)</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Adresse Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all"
                  />
                  <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-medium">⚠️ Modifier l'email changera les identifiants de connexion du vendeur.</p>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">WhatsApp Contact</label>
                  <input
                    type="text"
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+221..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  {/* Onboarding */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Statut Onboarding</label>
                    <select
                      title="Statut de l'onboarding"
                      value={formData.onboarding_completed ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, onboarding_completed: e.target.value === 'true' })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all"
                    >
                      <option value="true">✅ Complété</option>
                      <option value="false">⏳ Incomplet</option>
                    </select>
                  </div>

                  {/* KYC Forcé */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Statut KYC (Force)</label>
                    <select
                      title="Forcer le statut KYC"
                      value={formData.kyc_status || 'pending'}
                      onChange={(e) => setFormData({ ...formData, kyc_status: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all"
                    >
                      <option value="pending">En attente (Non soumis)</option>
                      <option value="submitted">Soumis (En révision)</option>
                      <option value="verified">Vérifié ✅</option>
                      <option value="rejected">Rejeté ❌</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0F7A60] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_15px_rgba(15,122,96,0.2)]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Sauvegarder
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}
