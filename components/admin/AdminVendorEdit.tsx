'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, X, Loader2, Save, KeyRound, AlertTriangle } from 'lucide-react'
import { toast } from '@/lib/toast'

interface AdminVendorEditProps {
  storeId: string
  userId: string
  initialData: {
    name: string
    email: string
    phone: string | null
    role: string
    store_name: string
    slug: string
    description: string | null
    whatsapp: string | null
    onboarding_completed: boolean
    kyc_status: string | null
  }
}

export default function AdminVendorEdit({ storeId, userId, initialData }: AdminVendorEditProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
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

      toast.success('✅ Informations mises à jour avec succès')
      setIsOpen(false)
      router.refresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Envoyer un lien de réinitialisation du mot de passe à ${formData.email} ?`)) return
    setResetLoading(true)

    try {
      const res = await fetch(`/api/admin/vendeurs/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', userId })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur')
      }

      const data = await res.json()
      toast.success(`🔑 Lien de réinitialisation envoyé à ${data.email}`)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi')
    } finally {
      setResetLoading(false)
    }
  }

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all"
  const labelCls = "block text-xs font-black uppercase tracking-widest text-gray-400 mb-2"

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
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#FAFAF7]/50 shrink-0">
              <div>
                <h3 className="text-lg font-black text-[#1A1A1A]">Édition Administrative</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Modification complète du profil et de la boutique.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulaire scrollable */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
              
              {/* ── SECTION 1 : Profil Utilisateur ── */}
              <div>
                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 bg-emerald-50 rounded-md flex items-center justify-center">👤</span>
                  Profil Utilisateur
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nom complet</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Prénom et nom"
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Email</label>
                      <input
                        type="email"
                        required
                        title="Adresse email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Téléphone</label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+221 7X XXX XX XX"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Rôle Utilisateur</label>
                    <select
                      title="Rôle de l'utilisateur"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={inputCls}
                    >
                      <option value="vendeur">Vendeur (Standard)</option>
                      <option value="acheteur">Acheteur</option>
                      <option value="affilie">Affilié</option>
                      <option value="closer">Closer</option>
                      <option value="gestionnaire">Gestionnaire (Staff)</option>
                      <option value="support">Support (Staff)</option>
                      <option value="super_admin">Super Admin (Privilégié)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-100" />

              {/* ── SECTION 2 : Boutique ── */}
              <div>
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-50 rounded-md flex items-center justify-center">🏪</span>
                  Boutique
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Nom de la boutique</label>
                      <input
                        type="text"
                        value={formData.store_name}
                        onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                        placeholder="Ma Boutique"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Slug (URL)</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                        placeholder="ma-boutique"
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description de la boutique..."
                      rows={2}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp Contact</label>
                    <input
                      type="text"
                      value={formData.whatsapp || ''}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+221..."
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-100" />

              {/* ── SECTION 3 : Système ── */}
              <div>
                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 bg-amber-50 rounded-md flex items-center justify-center">⚙️</span>
                  Système
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Onboarding</label>
                    <select
                      title="Statut de l'onboarding"
                      value={formData.onboarding_completed ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, onboarding_completed: e.target.value === 'true' })}
                      className={inputCls}
                    >
                      <option value="true">✅ Complété</option>
                      <option value="false">⏳ Incomplet</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Statut KYC (Force)</label>
                    <select
                      title="Forcer le statut KYC"
                      value={formData.kyc_status || 'pending'}
                      onChange={(e) => setFormData({ ...formData, kyc_status: e.target.value })}
                      className={inputCls}
                    >
                      <option value="pending">En attente</option>
                      <option value="submitted">Soumis</option>
                      <option value="verified">Vérifié ✅</option>
                      <option value="rejected">Rejeté ❌</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-100" />

              {/* ── SECTION 4 : Mot de passe ── */}
              <div className="bg-[#FAFAF7] border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-700 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-gray-400" />
                      Mot de passe
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Envoie un email avec un lien de réinitialisation.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {resetLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                    Envoyer le lien
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Modifier l&apos;email changera les identifiants de connexion. Modifier le slug changera l&apos;URL de la boutique.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
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
