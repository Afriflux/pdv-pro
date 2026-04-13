'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, User, Package, BookOpen, Clock } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGES: Message[] = [
  { 
    id: 'msg_1', 
    role: 'assistant', 
    content: 'Bonjour ! Je suis votre Concierge IA Yayyam. 🌟\nJe connais tout votre historique d\'achat. Je peux localiser vos colis physiques, vous redonner l\'accès à une formation bloquée ou vous conseiller sur vos futurs achats.\n\nQue puis-je faire pour vous aujourd\'hui ?' 
  }
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text }
    const currentHistory = [...messages]
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          history: (currentHistory || []).map(m => ({ role: m.role, content: m.content }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur API')
      }

      const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.answer }
      setMessages(prev => [...prev, aiMessage])
      
    } catch (err: any) {
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: `Désolé, une erreur technique m'empêche de vous répondre. (${err.message})` }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickReply = (text: string) => {
    handleSend(text)
  }

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)] pb-12 flex flex-col">
      {/* 🌟 MESH BACKGROUND DYNAMIQUE */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#FAFAF7]">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#0F7A60]/10 blur-[130px] pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#C9A84C]/5 blur-[100px] pointer-events-none mix-blend-multiply" />
      </div>

      <div className="p-4 md:p-8 w-full max-w-[1200px] mx-auto z-10 relative animate-in fade-in duration-700 flex flex-col flex-1 h-[calc(100vh-40px)]">
        
        {/* === HEADER === */}
        <header className="bg-gradient-to-tr from-[#1A1A1A] via-[#2A2A2A] to-black border border-white/10 rounded-t-[2rem] px-6 py-6 shadow-xl w-full relative z-20 shrink-0 flex items-center justify-between gap-4">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F7A60]/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-[#0F7A60]/20 backdrop-blur-xl rounded-xl text-emerald-400 border border-[#0F7A60]/30 shadow-[0_0_15px_rgba(15,122,96,0.3)]">
               <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Yayyam Concierge <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs uppercase tracking-wider font-bold border border-emerald-500/30">Beta</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">Votre assistant shopping personnel intelligent.</p>
            </div>
          </div>
        </header>

        {/* === CHAT AREA === */}
        <div className="flex-1 bg-white/80 backdrop-blur-2xl border-x border-gray-200/60 shadow-lg overflow-hidden flex flex-col relative">
          
          {/* Section d'affichage des bulles */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
            {(messages || []).map((msg) => {
              const isAI = msg.role === 'assistant'
              return (
                <div key={msg.id} className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                    
                    {/* Avatar */}
                    <div className="shrink-0 mt-1">
                      {isAI ? (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#0F7A60] to-[#0A4A3A] flex items-center justify-center text-white shadow-md border border-[#0F7A60]/20">
                          <Sparkles size={16} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200 shadow-sm">
                          <User size={16} />
                        </div>
                      )}
                    </div>

                    {/* Bulle textuelle */}
                    <div className={`p-4 md:p-5 text-[14px] md:text-[15px] leading-relaxed shadow-sm ${
                      isAI 
                      ? 'bg-white border border-gray-100 text-gray-800 rounded-3xl rounded-tl-sm' 
                      : 'bg-[#1A1A1A] text-white rounded-3xl rounded-tr-sm'
                    }`}>
                      {((msg?.content || '').split('\n') || []).map((line, i) => (
                        <span key={i}>
                          {line.replace(/[*#]/g, '') /* Simple format strip pour le moment */}
                          {i !== msg.content.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>
              )
            })}
            
            {isTyping && (
              <div className="flex w-full justify-start animate-in fade-in">
                <div className="flex gap-3 max-w-[85%] flex-row">
                  <div className="shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F7A60] to-[#0A4A3A] flex items-center justify-center text-white shadow-md">
                      <Sparkles size={16} />
                    </div>
                  </div>
                  <div className="p-5 bg-white border border-gray-100 rounded-3xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[#0F7A60]/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#0F7A60]/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#0F7A60]/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && !isTyping && (
            <div className="absolute bottom-[90px] left-0 right-0 px-4 md:px-8 py-4 flex flex-wrap gap-2 animate-in slide-in-from-bottom-8 duration-700 bg-gradient-to-t from-white/80 to-transparent">
               <button onClick={() => handleQuickReply("Où est mon dernier colis ?")} className="bg-white hover:bg-gray-50 border border-gray-200 text-xs md:text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 text-gray-700 transition-colors shadow-sm">
                 <Package size={14} className="text-[#0F7A60]"/> Où est mon dernier colis ?
               </button>
               <button onClick={() => handleQuickReply("Affiche ma bibliothèque digitale")} className="bg-white hover:bg-gray-50 border border-gray-200 text-xs md:text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 text-gray-700 transition-colors shadow-sm">
                 <BookOpen size={14} className="text-purple-500"/> Affiche ma bibliothèque
               </button>
               <button onClick={() => handleQuickReply("J'ai une commande en retard")} className="bg-white hover:bg-gray-50 border border-gray-200 text-xs md:text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 text-gray-700 transition-colors shadow-sm">
                 <Clock size={14} className="text-amber-500"/> Retard de livraison
               </button>
            </div>
          )}

        </div>

        {/* === INPUT AREA === */}
        <div className="bg-white border-x border-b border-gray-200/60 rounded-b-[2rem] p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0 z-20">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input) }}
            className="flex items-center gap-3 bg-gray-50/80 border border-gray-200 rounded-[1.5rem] p-2 focus-within:ring-2 focus-within:ring-[#0F7A60]/20 focus-within:border-[#0F7A60]/50 transition-all shadow-inner"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question à l'IA..."
              className="flex-1 bg-transparent px-4 py-3 outline-none text-[15px] font-medium text-gray-700 placeholder:text-gray-400"
              disabled={isTyping}
            />
            <button 
              type="submit" 
              title="Envoyer"
              aria-label="Envoyer"
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 shrink-0 bg-[#1A1A1A] hover:bg-[#0F7A60] text-white rounded-[1.2rem] flex items-center justify-center transition-all disabled:opacity-50 shadow-md group"
            >
              <Send size={18} className="translate-x-[-1px] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
          <div className="text-center mt-3">
             <span className="text-xs text-gray-400 font-medium">Yayyam Concierge IA peut faire des erreurs. Vérifiez toujours dans "Mes Achats".</span>
          </div>
        </div>

      </div>
    </div>
  )
}
