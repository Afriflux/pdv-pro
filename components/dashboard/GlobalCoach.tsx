'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, X, Loader2, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function GlobalCoach() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Salut ! Je suis ton Coach E-commerce Global. Je connais par coeur toutes les stratégies et tutoriels de l'Académie Yayyam. Que veux-tu apprendre aujourd'hui ?` }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPinging, setIsPinging] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsPinging(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

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
        // If the AI learned something new, tell the user!
        if (data.learned) {
           setTimeout(() => {
             setMessages(prev => [...prev, { role: 'assistant', content: `✨ *(J'ai mémorisé cette nouvelle stratégie dans la base de données Yayyam pour aider les prochains vendeurs ! Merci pour ta question.)*` }])
           }, 800)
        }
      }
    } catch (_error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Le signal avec ton coach est faible. Réessaie plus tard !' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-[85px] left-3 lg:bottom-6 lg:left-auto lg:right-6 lg:z-[200] z-[100]">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir le Coach Global IA"
            title="Ouvrir le Coach Global IA"
            className="group relative flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-emerald-600 to-[#0F7A60] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <Bot size={28} className="motion-safe:animate-pulse" />
            <div className="absolute -top-1 -right-1 flex h-4 w-4">
              {isPinging && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </div>
          </button>
        ) : (
          <div className="w-[90vw] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 origin-bottom-left lg:origin-bottom-right">
            {/* Header */}
            <div className="bg-[#0A0A0A] p-4 text-white flex justify-between items-center shrink-0 rounded-t-3xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Bot size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Le Coach Yayyam</h3>
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Arme Ultime en ligne
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Fermer le Coach" title="Fermer" className="text-gray-400 hover:text-white transition relative z-10 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
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
                    <span className="text-xs text-gray-500 font-medium">Réflexion intense...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ex. Comment faire un prix psychologique ?"
                className="flex-1 bg-gray-50 text-sm p-3.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium placeholder:font-normal"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3.5 bg-ink text-white rounded-xl hover:bg-[#0F7A60] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                aria-label="Envoyer la question"
                title="Poser la question"
              >
                <Send size={18} />
              </button>
            </div>
            
            <div className="text-center pb-2 bg-white">
               <span className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                 <Sparkles size={10} className="text-gold" /> Powered by Claude 3.5 Haiku
               </span>
            </div>
            
          </div>
        )}
      </div>
    </>
  )
}
