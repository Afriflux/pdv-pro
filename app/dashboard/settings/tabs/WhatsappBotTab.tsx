'use client'

import React, { useState, useEffect } from 'react'
import { Phone, MessageSquare, Bot, AlertCircle, Loader2 } from 'lucide-react'

export function WhatsappBotTab({ store }: { store: Record<string, unknown> & { id: string; slug: string; whatsapp_bot?: { active: boolean; welcome_message: string; auto_reply: boolean; ai_enabled: boolean; phone_number?: string } } }) {
  const [saving, setSaving] = useState(false)

  const [active, setActive] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState("Bienvenue ! Tapez *catalogue* pour voir nos produits ou *aide* pour les commandes disponibles.")
  const [autoReply, setAutoReply] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")

  useEffect(() => {
    if (store?.whatsapp_bot) {
      setActive(store.whatsapp_bot.active)
      setWelcomeMessage(store.whatsapp_bot.welcome_message)
      setAutoReply(store.whatsapp_bot.auto_reply)
      setAiEnabled(store.whatsapp_bot.ai_enabled)
      setPhoneNumber(store.whatsapp_bot.phone_number || "")
    }
  }, [store])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const res = await fetch('/api/vendor/settings/whatsapp-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: store.id,
          active,
          welcome_message: welcomeMessage,
          auto_reply: autoReply,
          ai_enabled: aiEnabled,
          phone_number: phoneNumber
        })
      })

      if (!res.ok) throw new Error('Erreur de sauvegarde')
      
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <Phone className="w-8 h-8 text-[#0F7A60]" />
          WhatsApp Auto-Vendeur
        </h1>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          Configurez votre bot conversationnel. Il répondra automatiquement à vos clients, présentera votre catalogue et prendra les commandes 24/7.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-blue-900">Comment tester le bot ?</h3>
          <p className="text-xs text-blue-800 mt-1">
            Envoyez un message sur WhatsApp au <strong className="font-black">+14155238886</strong> avec le texte :<br/>
            <code>join {store.slug}</code> (fonctionnalité sandbox).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* STATUT DU BOT */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-gray-500" /> État du Bot
              </h3>
              <p className="text-sm text-gray-500 mt-1">Activer ou désactiver les réponses automatiques sur ce canal.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" title="Activer le bot" aria-label="Activer le bot" className="sr-only peer" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0F7A60]"></div>
            </label>
          </div>
        </div>

        {/* CONFIGURATION */}
        <div className={`space-y-6 transition-opacity ${!active ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <label htmlFor="welcome_message" className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" /> Message d&apos;accueil
              </label>
              <textarea
                id="welcome_message"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                placeholder="Ex: Bienvenue sur ma boutique..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0F7A60] focus:border-transparent outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-2">Ce message s&apos;affiche à la première interaction du client.</p>
            </div>

            <hr className="border-gray-100" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Réponses Automatiques</h4>
                <p className="text-xs text-gray-500 mt-1">Le bot traitera les commandes "catalogue", "prix", et "commander".</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" title="Réponses Automatiques" aria-label="Activer les réponses automatiques" className="sr-only peer" checked={autoReply} onChange={(e) => setAutoReply(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F7A60]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">Intelligence Artificielle <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Bêta</span></h4>
                <p className="text-xs text-gray-500 mt-1">Utilise Claude 3.5 pour répondre aux questions complexes.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" title="Intelligence Artificielle" aria-label="Activer Claude 3.5" className="sr-only peer" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F7A60]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#0F7A60] text-white px-8 py-3.5 rounded-2xl font-bold text-[15px] hover:bg-[#0D6A53] transition-all hover:shadow-[0_8px_20px_rgba(15,122,96,0.2)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none flex items-center gap-2"
          >
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</> : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>
    </div>
  )
}
