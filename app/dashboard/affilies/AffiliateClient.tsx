'use client'

import { useState } from 'react'
import { Users, Info, Settings, CheckCircle, XCircle, ExternalLink, MessageCircle, TrendingUp, MousePointer2, BadgeDollarSign } from 'lucide-react'
import { updateStoreAffiliateSettings, approveAffiliate, rejectAffiliate } from '@/lib/affiliates/affiliateActions'

import { toast } from 'sonner'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pdvpro.com'

export interface AffiliateData {
  id:             string
  code:           string
  status:         string
  clicks:         number
  total_sales:    number
  total_earnings: number
  created_at:     string
  user: {
    id:    string
    name:  string | null
    email: string
    phone: string | null
  } | null
}

interface AffiliateClientProps {
  storeId: string

  initialActive: boolean
  initialMargin: number
  affiliates: AffiliateData[]
}

export default function AffiliateClient({ storeId, initialActive, initialMargin, affiliates: initialAffiliates }: AffiliateClientProps) {
  const [isActive, setIsActive] = useState(initialActive)
  const [margin, setMargin] = useState(initialMargin * 100) // stocké en décimal, affiché en %
  const [affiliates, setAffiliates] = useState<AffiliateData[]>(initialAffiliates)
  const [isSaving, setIsSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleSaveSettings = async () => {
    setIsSaving(true)
    await updateStoreAffiliateSettings(storeId, isActive, margin / 100)
    setIsSaving(false)
    toast.success('Paramètres sauvegardés avec succès')
  }

  const handleApprove = async (aff: AffiliateData) => {
    setActionLoading(aff.id)
    
    const res = await approveAffiliate(aff.id)
    
    if (res.success) {
      // Message via WA
      const waMsg = `Bonjour ! Votre code affilié PDV Pro est : ${aff.code}`
      const phone = aff.user?.phone?.replace(/\D/g, '') ?? ''

      if (phone) {
        const encodedMessage = encodeURIComponent(waMsg)
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')
      } else {
        toast.info("L'affilié a été approuvé, mais aucun numéro WhatsApp n'est enregistré pour l'envoi du message.")
      }

      setAffiliates(prev => prev.map(a => a.id === aff.id ? { ...a, status: 'active' } : a))
      toast.success('Affilié accepté')
    } else {
      toast.error('Une erreur est survenue')
    }
    setActionLoading(null)
  }

  const handleReject = async (affiliateId: string) => {
    if (!confirm("Voulez-vous vraiment refuser cet affilié ?")) return
    setActionLoading(affiliateId)
    const res = await rejectAffiliate(affiliateId)
    if (res.success) {
      setAffiliates(prev => prev.map(a => a.id === affiliateId ? { ...a, status: 'rejected' } : a))
      toast.success('Affilié refusé')
    } else {
      toast.error('Une erreur est survenue')
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* CONFIGURATION ET STATUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panneau de contrôle */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-line p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald/10 rounded-2xl flex items-center justify-center text-emerald">
                <Settings size={24} />
              </div>
              <div>
                <h2 className="text-xl font-display font-black text-ink">Configuration</h2>
                <p className="text-xs text-dust font-bold uppercase tracking-widest">Gérez votre réseau de vente</p>
              </div>
            </div>

            <div 
              onClick={() => setIsActive(!isActive)}
              className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${isActive ? 'bg-gold' : 'bg-line'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isActive ? 'left-7' : 'left-1'}`} />
            </div>
          </div>

          <div className={`space-y-6 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
            <div className="flex flex-col sm:flex-row items-end gap-6">
              <div className="flex-1 w-full">
                <label className="block text-xs font-black text-dust uppercase tracking-widest mb-3 pl-1">
                  Commission reversée aux affiliés
                </label>
                <div className="relative">
                  <input 
                    aria-label="Commission reversée"
                    title="Commission reversée"
                    type="number" min="1" max="90"
                    value={margin}
                    onChange={e => setMargin(Number(e.target.value))}
                    className="w-full bg-cream border border-line rounded-2xl py-4 px-6 pr-12 focus:outline-none focus:ring-4 focus:ring-gold/5 focus:border-gold font-display font-black text-xl text-ink transition-all"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-dust font-black text-xl">%</span>
                </div>
              </div>
              
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full sm:w-auto bg-ink hover:bg-slate text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-ink/10 flex items-center justify-center gap-2"
              >
                {isSaving ? '...' : 'Appliquer'}
              </button>
            </div>

            <div className="bg-gold/5 rounded-2xl p-4 border border-gold/10 flex gap-4 items-start">
              <Info size={18} className="text-gold flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink/70 leading-relaxed">
                <span className="font-black text-ink uppercase tracking-tighter mr-1 text-[10px]">Note importante :</span> 
                Le pourcentage est calculé sur le <strong>prix de vente final</strong>. 
                PDV Pro prélève d&apos;abord ses 7% ou 5%, le reste est partagé entre vous et votre affilié selon le taux ci-dessus.
              </p>
            </div>
          </div>
        </div>

        {/* Aide / Explication */}
        <div className="bg-gradient-to-br from-ink to-slate rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <TrendingUp className="absolute -right-4 -bottom-4 text-white/5 w-40 h-40 transform -rotate-12" />
          <h3 className="text-xl font-display font-black mb-4">Conseil PDV Pro</h3>
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            Recruter des affiliés est le meilleur moyen de scaler sans dépenser un centime en publicité. 
            <strong> 15% à 20%</strong> est le taux standard pour motiver vos ambassadeurs.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-bold bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <CheckCircle size={16} className="text-emerald" />
              <span>Zéro risque financier</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <CheckCircle size={16} className="text-emerald" />
              <span>Paiement après vente uniquement</span>
            </div>
          </div>
        </div>
      </div>

      {/* LISTE DES AFFILIÉS */}
      {isActive && (
        <div className="bg-white rounded-3xl border border-line shadow-sm overflow-hidden overflow-x-auto">
          <div className="p-8 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-xl font-display font-black text-ink">Votre réseau</h3>
              <p className="text-xs text-dust font-bold uppercase tracking-widest mt-1">Vos ambassadeurs actifs</p>
            </div>
            <div className="bg-cream px-4 py-2 rounded-xl text-xs font-bold text-dust">
              {affiliates.length} total
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream/50 text-dust text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-6">Ambassadeur</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-right">Performances</th>
                <th className="p-6 text-right">Total Gains</th>
                <th className="p-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {affiliates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users size={32} className="text-dust" />
                    </div>
                    <p className="text-dust text-sm font-medium">Aucun affilié pour le moment.</p>
                  </td>
                </tr>
              ) : (
                affiliates.map(aff => (
                  <tr key={aff.id} className="hover:bg-cream/30 transition group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cream overflow-hidden flex-shrink-0 border border-line">
                          <div className="w-full h-full flex items-center justify-center text-xl font-bold text-dust">
                            {aff.user?.name ? aff.user.name.charAt(0) : '?'}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-display font-black text-ink truncate">{aff.user?.name || 'Inconnu'}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-[11px] text-dust font-mono">{aff.user?.phone || '...'}</p>
                             <button 
                               aria-label="Contacter sur WhatsApp"
                               title="Contacter sur WhatsApp"
                               onClick={() => {
                                 const phone = aff.user?.phone?.replace(/\D/g, '') ?? ''
                                 if (!phone) { toast.error('Numéro WhatsApp non renseigné'); return }
                                 window.open(`https://wa.me/${phone}`, '_blank')
                               }}
                               className="text-emerald hover:scale-110 transition opacity-0 group-hover:opacity-100"
                             >
                               <MessageCircle size={14} />
                             </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      {aff.status === 'active' && (
                        <span className="bg-emerald/10 text-emerald px-3 py-1.5 rounded-full text-[10px] font-black uppercase ring-1 ring-emerald/20">Actif</span>
                      )}
                      {aff.status === 'pending' && (
                        <span className="bg-gold/10 text-gold px-3 py-1.5 rounded-full text-[10px] font-black uppercase ring-1 ring-gold/20">En attente</span>
                      )}
                      {aff.status === 'rejected' && (
                        <span className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ring-1 ring-red-500/20">Refusé</span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-6 text-dust">
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase mb-0.5">Clics</p>
                          <p className="text-ink font-mono font-bold flex items-center justify-end gap-1">
                            <MousePointer2 size={10} /> {aff.clicks || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase mb-0.5">Ventes</p>
                          <p className="text-ink font-mono font-bold flex items-center justify-end gap-1">
                            <TrendingUp size={10} /> {aff.total_sales || 0}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex flex-col items-end">
                        <p className="text-lg font-display font-black text-emerald">
                          {(aff.total_earnings || 0).toLocaleString('fr-FR')} <span className="text-[10px] font-sans font-normal text-dust">FCFA</span>
                        </p>
                        <p className="text-[9px] text-dust font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1">
                          <BadgeDollarSign size={8} /> Gains générés
                        </p>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      {aff.status === 'pending' && (
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => handleApprove(aff)}
                            disabled={actionLoading === aff.id}
                            className="bg-emerald-deep hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-black transition disabled:opacity-50 flex items-center gap-1.5"
                            title="Accepter l'affilié"
                          >
                            <CheckCircle size={14} /> Accepter
                          </button>
                          <button 
                            onClick={() => handleReject(aff.id)}
                            disabled={actionLoading === aff.id}
                            className="bg-cream hover:bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-black transition disabled:opacity-50 flex items-center gap-1.5"
                            title="Refuser"
                          >
                            <XCircle size={14} /> Refuser
                          </button>
                        </div>
                      )}
                      {aff.status === 'active' && (
                        <div className="flex flex-col items-center gap-1">
                           <span className="text-[10px] text-dust font-mono bg-cream px-2 py-1 rounded">REF: {aff.code}</span>
                           <button 
                             onClick={async () => {
                               const link = `${appUrl}/register?ref=${aff.code}`
                               await navigator.clipboard.writeText(link)
                               toast.success('Lien copié !')
                             }}
                             className="text-[10px] text-emerald font-black hover:underline flex items-center gap-1"
                           >
                             <ExternalLink size={10} /> Voir lien
                           </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
