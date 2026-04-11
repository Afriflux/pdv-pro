'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  time: string
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Bienvenue sur Yayyam ! 👋\nComment puis-je vous aider ?',
    sender: 'bot',
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
]

const QUICK_REPLIES = [
  'Comment ouvrir ma boutique ?',
  'Quels sont vos tarifs ?',
  'Comment retirer mon argent ?',
  'Je veux devenir affilié',
]

export function WhatsAppFloatingButton({ phone = '221776581741' }: { phone?: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000)
    const tooltipTimer = setTimeout(() => setShowTooltip(true), 5000)
    const hideTooltip = setTimeout(() => setShowTooltip(false), 12000)
    return () => {
      clearTimeout(timer)
      clearTimeout(tooltipTimer)
      clearTimeout(hideTooltip)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isVisible) return null

  const handleSend = (text?: string) => {
    const msg = text || input.trim()
    if (!msg) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: msg,
      sender: 'user',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Bot auto-reply after 1s
    setTimeout(() => {
      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotReply(msg),
        sender: 'bot',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, botReply])
    }, 1000)
  }

  const handleWhatsAppTransfer = () => {
    const lastUserMsg = messages.filter(m => m.sender === 'user').pop()
    const text = lastUserMsg 
      ? encodeURIComponent(`Bonjour Yayyam 👋\n${lastUserMsg.text}`)
      : encodeURIComponent("Bonjour Yayyam 👋 J'ai une question.")
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      
      {/* Chat Panel */}
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-[#075E54] px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm">Yayyam Support</h3>
              <p className="text-white/70 text-xs">En ligne — répond en ~5 min</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition p-1" title="Fermer le chat" aria-label="Fermer le chat">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#ECE5DD] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23d5cec4%22%20fill-opacity%3D%220.2%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-md' 
                    : 'bg-white text-gray-800 rounded-tl-md'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-right text-gray-500' : 'text-gray-400'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide">
              {QUICK_REPLIES.map(reply => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply)}
                  className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-bold border border-emerald-100 hover:bg-emerald-100 transition whitespace-nowrap shrink-0"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Transfer to WhatsApp */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <button
              onClick={handleWhatsAppTransfer}
              className="w-full text-xs text-center text-[#075E54] font-bold hover:underline transition py-1"
            >
              💬 Continuer sur WhatsApp pour un suivi en direct →
            </button>
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Tapez votre message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full py-2.5 px-4 text-sm outline-none focus:border-[#075E54] focus:ring-2 focus:ring-[#075E54]/10 transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              title="Envoyer le message"
              aria-label="Envoyer le message"
              className="w-10 h-10 bg-[#075E54] hover:bg-[#064E46] disabled:bg-gray-300 rounded-full flex items-center justify-center text-white transition shadow-md"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Tooltip (only when chat is closed) */}
      {!isOpen && showTooltip && (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-[220px] relative">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
            title="Fermer"
            aria-label="Fermer l'info-bulle"
          >
            <X size={12} className="text-gray-500" />
          </button>
          <p className="text-sm font-bold text-gray-800 mb-1">Besoin d&apos;aide ? 💬</p>
          <p className="text-xs text-gray-500">Notre équipe vous répond en moins de 5 minutes</p>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowTooltip(false) }}
        aria-label="Ouvrir le chat"
        title="Chat Yayyam"
        className={`group relative w-16 h-16 ${isOpen ? 'bg-gray-700' : 'bg-[#25D366]'} hover:opacity-90 rounded-full flex items-center justify-center shadow-2xl ${isOpen ? 'shadow-gray-700/30' : 'shadow-[#25D366]/30'} transition-all duration-300 hover:scale-110 active:scale-95`}
      >
        {/* Pulse ring (only when closed) */}
        {!isOpen && <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />}

        {isOpen ? (
          <X size={24} className="text-white relative z-10" />
        ) : (
          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 relative z-10 drop-shadow-sm">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )}

        {/* Online indicator */}
        {!isOpen && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-300 border-2 border-white rounded-full" />}
      </button>
    </div>
  )
}

/** Simple rule-based bot for common questions */
function getBotReply(message: string): string {
  const msg = message.toLowerCase()
  
  if (msg.includes('boutique') || msg.includes('ouvrir') || msg.includes('créer')) {
    return "🏪 Pour ouvrir votre boutique :\n\n1. Cliquez sur \"Ouvrir ma boutique\" en haut de la page\n2. Inscrivez-vous avec Google ou votre numéro\n3. Configurez votre boutique (nom, logo, catégorie)\n4. Ajoutez vos premiers produits\n\nC'est gratuit et ça prend 2 minutes ! 🚀"
  }
  
  if (msg.includes('tarif') || msg.includes('prix') || msg.includes('commission') || msg.includes('combien')) {
    return "💰 Nos tarifs sont simples :\n\n• Premier mois : 8% de commission\n• La commission baisse avec votre CA !\n• COD (livraison) : 5% fixe\n• Pas d'abonnement, pas de frais cachés\n\nPlus vous vendez, moins vous payez 📉"
  }
  
  if (msg.includes('retir') || msg.includes('argent') || msg.includes('paiement') || msg.includes('wave')) {
    return "💸 Retraits disponibles via :\n\n• Wave (instantané)\n• Orange Money\n• PayTech\n\nMinimum de retrait : 5 000 FCFA\nVos gains sont disponibles dès confirmation de la commande ✅"
  }
  
  if (msg.includes('affilié') || msg.includes('affili') || msg.includes('parrain')) {
    return "🤝 Programme d'affiliation Yayyam :\n\n• Partagez votre lien unique\n• Gagnez une commission sur chaque vente générée\n• Tableau de bord dédié pour suivre vos gains\n\nContactez-nous pour activer votre compte affilié !"
  }
  
  if (msg.includes('merci') || msg.includes('super') || msg.includes('ok')) {
    return "Avec plaisir ! 😊\n\nN'hésitez pas si vous avez d'autres questions.\nBonne vente sur Yayyam ! 🎉"
  }
  
  return "Merci pour votre message ! 🙏\n\nNotre équipe va vous répondre rapidement.\n\nEn attendant, vous pouvez aussi nous contacter directement via le lien WhatsApp ci-dessous pour un suivi en temps réel."
}
