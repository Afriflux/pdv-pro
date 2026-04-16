'use client'

import { useState, useEffect } from 'react'
import { Bot, Send, X, Loader2, Sparkles, HelpCircle, Store, Briefcase, Zap, Phone, ExternalLink } from 'lucide-react'
import { usePathname } from 'next/navigation'

// Configuration des Agents WhatsApp
const DEFAULT_AGENTS = [
  { 
    id: 'support', 
    name: 'Support Clients', 
    desc: 'Assistance, commandes & plaintes.', 
    iconName: 'help', 
    phone: '221776581741',
    color: 'bg-[#0F7A60]/10 text-[#0F7A60]', 
    prefix: 'Bonjour Yayyam 👋 J\'ai besoin d\'aide avec une commande.' 
  },
  { 
    id: 'vendors', 
    name: 'Service Vendeurs', 
    desc: 'Ouvrir ou paramétrer une boutique.', 
    iconName: 'store', 
    phone: '221776581741',
    color: 'bg-indigo-50 text-indigo-600', 
    prefix: 'Bonjour Yayyam 👋 Je souhaite des informations pour vendre sur la plateforme.' 
  },
  { 
    id: 'admin', 
    name: 'Direction & Admin', 
    desc: 'Partenariats, B2B et réclamations expertes.', 
    iconName: 'briefcase', 
    phone: '221776581741',
    color: 'bg-amber-50 text-amber-600', 
    prefix: 'Bonjour Yayyam 👋 Je vous contacte pour un sujet administratif/partenariat.' 
  },
]

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function UnifiedHelpWidget({ dynamicAgents }: { dynamicAgents?: Record<string, string>[] }) {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard')
  
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'coach'>(isDashboard ? 'coach' : 'whatsapp')
  const [isVisible, setIsVisible] = useState(false)
  const [isPinging, setIsPinging] = useState(true)

  // Coach AI state
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Salut ! Je suis ton Coach E-commerce Global. Je connais par coeur toutes les stratégies de l'Académie Yayyam. Que veux-tu apprendre aujourd'hui ?` }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const agentsToDisplay = dynamicAgents && dynamicAgents.length > 0 ? dynamicAgents : DEFAULT_AGENTS

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000)
    const pingTimer = setTimeout(() => setIsPinging(false), 5000)
    return () => {
      clearTimeout(timer)
      clearTimeout(pingTimer)
    }
  }, [])

  // Force l'onglet WhatsApp et masque le coach si on quitte le dashboard
  useEffect(() => {
    if (!isDashboard) {
      setActiveTab('whatsapp')
    }
  }, [isDashboard])

  if (!isVisible) return null

  const handleOpenWhatsApp = (phone: string, prefixText: string) => {
    const targetPhone = phone || '221776581741'
    const text = encodeURIComponent(prefixText)
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank')
    setIsOpen(false)
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setIsLoading(true)

    try {
      const historyForAPI = messages.slice(1).map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: userMsg,
          history: historyForAPI
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data.error || 'Erreur réseau.'}` }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
        if (data.learned) {
           setTimeout(() => {
             setMessages(prev => [...prev, { role: 'assistant', content: `✨ *(J'ai mémorisé cette nouvelle stratégie pour aider les prochains vendeurs ! Merci.)*` }])
           }, 800)
        }
      }
    } catch (_error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Le signal est faible. Réessaie plus tard !' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-[85px] right-3 lg:bottom-6 lg:right-6 z-[100] font-sans flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
          
          {/* Header unifié */}
          <div className="bg-[#0A0A0A] p-4 text-white flex flex-col shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex justify-between items-start relative z-10 w-full mb-4">
              <div>
                <h3 className="font-black text-lg leading-none">Centre d'aide Yayyam</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Comment pouvons-nous vous aider ?</p>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Fermer" className="text-gray-400 hover:text-white transition p-1 bg-white/5 rounded-full">
                <X size={18} />
              </button>
            </div>

            {/* Onglets (Affichés uniquement dans le Dashboard) */}
            {isDashboard && (
              <div className="flex p-1 bg-white/10 rounded-xl relative z-10">
                <button
                  onClick={() => setActiveTab('coach')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'coach' ? 'bg-[#0F7A60] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  <Bot size={14} /> Coach IA
                </button>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'whatsapp' ? 'bg-[#25D366] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  <Phone size={14} /> WhatsApp
                </button>
              </div>
            )}
           </div>

          {/* Contenu dynamique */}
          <div className="flex flex-col h-[400px] sm:h-[450px] bg-[#FAFAF7] w-full">
            {/* Vue WhatsApp */}
            {(activeTab === 'whatsapp' || !isDashboard) && (
               <div className="flex-1 overflow-y-auto p-3 space-y-2 w-full">
                 {agentsToDisplay.map(agent => {
                    const IconComp = agent.iconName === 'store' ? Store : agent.iconName === 'briefcase' ? Briefcase : agent.iconName === 'zap' ? Zap : HelpCircle
                    return (
                      <button
                        key={agent.id}
                        onClick={() => handleOpenWhatsApp(agent.phone, agent.prefix)}
                        className="w-full bg-white hover:bg-gray-50 flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent hover:border-gray-100 shadow-sm hover:shadow-md group text-left"
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${agent.color}`}>
                          <IconComp size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-gray-900 group-hover:text-[#0F7A60] transition-colors">{agent.name}</h4>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed mt-0.5">{agent.desc}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                           <ExternalLink size={14} />
                        </div>
                      </button>
                    )
                 })}
                 <div className="pt-4 pb-2 text-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Temps de réponse ~5 min</span>
                 </div>
               </div>
            )}

            {/* Vue Coach IA */}
            {activeTab === 'coach' && isDashboard && (
              <div className="flex-1 flex flex-col bg-white w-full overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto w-full custom-scrollbar flex flex-col gap-4 bg-gray-50/50">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      <div 
                        className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                          ${msg.role === 'user' 
                            ? 'bg-[#0F7A60] text-white rounded-br-sm' 
                            : 'bg-white border border-gray-100 text-ink rounded-bl-sm'}
                        `}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-4 rounded-2xl bg-white border border-gray-100 rounded-bl-sm shadow-sm flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-emerald-600" />
                        <span className="text-xs text-gray-500 font-medium">Analyse en cours...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Posez votre question..."
                    className="flex-1 bg-gray-50 text-sm p-3 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium placeholder:font-normal"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    aria-label="Envoyer le message"
                    title="Envoyer le message"
                    className="p-3 bg-ink text-white rounded-xl hover:bg-[#0F7A60] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bouton Trigger Unifié */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ouvrir le centre d'aide"
        title="Besoin d'aide ?"
        className={`group relative flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ${
          isOpen ? 'bg-gray-800' : isDashboard ? 'bg-[#0F7A60]' : 'bg-[#25D366]'
        }`}
      >
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
        {isOpen ? (
           <X size={24} className="text-white" />
        ) : (
           isDashboard ? (
             <>
               <Bot size={28} className="text-white motion-safe:animate-pulse" />
               <div className="absolute -top-1 -right-1 flex h-4 w-4">
                 {isPinging && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                 <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
               </div>
             </>
           ) : (
             <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 relative z-10 drop-shadow-sm">
               <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
             </svg>
           )
        )}
      </button>
    </div>
  )
}
