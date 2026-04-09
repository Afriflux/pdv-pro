'use client'

import { useState } from 'react'
import { Send, CreditCard, ChevronRight, CheckCircle2, History, MessageSquare, AlertCircle } from 'lucide-react'
import { toast } from '@/lib/toast'
import { purchaseSmsCredits, createSmsCampaign, sendSmsCampaign } from '@/app/actions/sms'

export interface SmsCampaign { id: string; name: string; status: string; created_at: string | Date; total_sent: number; [key: string]: unknown; }

interface SmsClientProps {
  storeId: string
  storeName: string
  initialData: {
    credits: number
    used: number
    campaigns: SmsCampaign[]
  }
}

export default function SmsClient({ storeId, initialData }: SmsClientProps) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)

  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [recipientPhones, setRecipientPhones] = useState('') // Just a simple comma separated for MVP UI (Import CSV in real life)

  const totalCreditsEver = data.credits + data.used
  const usagePercent = totalCreditsEver > 0 ? (data.used / totalCreditsEver) * 100 : 0

  const handlePurchase = async () => {
    setBuyLoading(true)
    const res = await purchaseSmsCredits(storeId, 100) // Dummy pack of 100
    if (res.success) {
      toast.success(res.message as string)
      setData(prev => ({ ...prev, credits: prev.credits + 100 }))
    } else {
      toast.error(res.error || 'Erreur')
    }
    setBuyLoading(false)
  }

  const handleSendCampaign = async (isDraft = false) => {
    if (!campaignName || !message || !recipientPhones) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    const phones = recipientPhones.split(',').map(p => p.trim()).filter(Boolean)
    const recipients = phones.map(p => ({ phone: p, name: '' }))

    if (phones.length > data.credits && !isDraft) {
      toast.error(`Crédits insuffisants. Il vous faut ${phones.length} envois.`)
      return
    }

    setLoading(true)
    try {
      // 1. Create campaign
      const createRes = await createSmsCampaign(storeId, campaignName, message, recipients) as { success: boolean; error?: string; campaign: SmsCampaign }
      if (!createRes.success) throw new Error(createRes.error)

      let resultMsg = "Campagne enregistrée en brouillon."

      // 2. Send if not draft
      if (!isDraft) {
        toast.loading("Envoi de la campagne en cours...")
        const sendRes = await sendSmsCampaign(createRes.campaign.id) as { success: boolean; error?: string; campaign: SmsCampaign }
        if (!sendRes.success) throw new Error(sendRes.error)
        resultMsg = "Campagne envoyée avec succès !"
        setData(prev => ({
          ...prev,
          credits: prev.credits - phones.length,
          used: prev.used + phones.length,
          campaigns: [sendRes.campaign, ...prev.campaigns]
        }))
      } else {
        setData(prev => ({ ...prev, campaigns: [createRes.campaign, ...prev.campaigns] }))
      }

      toast.success(resultMsg)
      setCampaignName('')
      setMessage('')
      setRecipientPhones('')

    } catch (err: unknown) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi de la campagne")
    } finally {
      setLoading(false)
    }
  }

  const insertVar = (variable: string) => {
    setMessage(prev => prev + variable)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: Editor & Form */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* COMPOSER CARD */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6 relative z-10">
            <MessageSquare className="text-emerald-600" />
            Campagne Rapide
          </h2>

          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nom de la campagne</label>
              <input 
                type="text" 
                placeholder="Ex: Promo Tabaski" 
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Destinataires (Numéros avec code pays, séparés par virgules)</label>
              <input 
                type="text" 
                placeholder="Ex: +221770000000, +22501020304" 
                value={recipientPhones}
                onChange={e => setRecipientPhones(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium font-mono text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-700">Message ({message.length}/160 caractères)</label>
                <div className="flex gap-2">
                   <button onClick={() => insertVar('{prenom}')} className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded">{"{prenom}"}</button>
                   <button onClick={() => insertVar('{boutique}')} className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded">{"{boutique}"}</button>
                   <button onClick={() => insertVar('{lien}')} className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded">{"{lien}"}</button>
                </div>
              </div>
              <textarea 
                placeholder="Tapez votre message ici..." 
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={160}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium min-h-[120px] resize-y"
              />
              <p className="text-xs text-gray-400 font-medium mt-2">
                Note concernant WhatsApp Meta API : Évitez de spammer et assurez-vous d'avoir l'approbation (Opt-in) de vos clients pour éviter un signalement de votre numéro par Facebook Meta.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button 
                disabled={loading}
                onClick={() => handleSendCampaign(false)}
                className="flex-[2] bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-70"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> Envoyer Maintenant</>}
              </button>
              <button 
                disabled={loading}
                onClick={() => handleSendCampaign(true)}
                className="flex-1 bg-white text-gray-700 border border-gray-200 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-70"
              >
                Brouillon
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Stats & History */}
      <div className="space-y-6">
        
        {/* CREDITS WIDGET */}
        <div className="bg-gradient-to-br from-[#1A1A1A] to-gray-900 rounded-[2rem] p-8 text-white relative shadow-xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
          
          <h3 className="font-bold text-gray-400 text-sm tracking-uppercase mb-2 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" /> Crédits Disponibles
          </h3>
          <div className="text-5xl font-black mb-4">{data.credits} <span className="text-xl text-gray-500 font-medium tracking-tight">envois restants</span></div>
          
          <div className="space-y-2 mb-8">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span>Utilisation Globale</span>
              <span>{Math.round(usagePercent)}% utilisé</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className={`bg-emerald-500 h-full rounded-full transition-all duration-1000 w-[${Math.round(usagePercent/10)*10}%]`} 
              />
            </div>
            <p className="text-[10px] text-gray-500 font-medium">Vous avez envoyé un total de {data.used} messages WhatsApp.</p>
          </div>

          <button 
            disabled={buyLoading}
            onClick={handlePurchase}
            className="w-full bg-white text-[#1A1A1A] hover:bg-emerald-50 hover:text-emerald-700 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 group"
          >
            {buyLoading ? (
               <span className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
            ) : (
              <><CreditCard size={18} /> Acheter un Pack de Crédits <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </div>

        {/* HISTORY LIST */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
          <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
             <History size={18} className="text-gray-400" /> Historique
          </h3>

          <div className="space-y-4">
            {data.campaigns.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">Aucune campagne pour le moment.</p>
              </div>
            ) : (
              data.campaigns.map(camp => (
                <div key={String(camp.id)} className="group p-4 border border-gray-100 rounded-2xl hover:border-emerald-100 hover:bg-emerald-50/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors">{camp.name}</h4>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                       camp.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                       camp.status === 'sending' ? 'bg-amber-100 text-amber-700' :
                       'bg-gray-100 text-gray-600'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                    <span>{new Date(camp.created_at).toLocaleDateString()}</span>
                    <span>{camp.total_sent || 0} livrés</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
