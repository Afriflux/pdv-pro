'use client'

import { useState, useEffect } from 'react'
import { X, HelpCircle, Store, Briefcase, Zap, Phone } from 'lucide-react'

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

export function WhatsAppFloatingButton({ defaultPhone = '221776581741', dynamicAgents }: { defaultPhone?: string, dynamicAgents?: Record<string, string>[] }) {
  const agentsToDisplay = dynamicAgents && dynamicAgents.length > 0 ? dynamicAgents : DEFAULT_AGENTS
  const [isVisible, setIsVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

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

  if (!isVisible) return null

  const handleOpenWhatsApp = (phone: string, prefixText: string) => {
    const targetPhone = phone || defaultPhone
    const text = encodeURIComponent(prefixText)
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank')
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans">
      
      {/* Menu Multi-Agents */}
      {isOpen && (
        <div className="w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-[#0F7A60] px-6 py-5 flex items-center justify-between shrink-0 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div>
              <h3 className="text-white font-black text-lg">Contacter Yayyam</h3>
              <p className="text-white/80 text-xs font-medium mt-0.5">Choisissez le service adapté à votre besoin.</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors relative z-10" 
              title="Fermer le menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-2 space-y-1 bg-[#FAFAF7] max-h-[400px] overflow-y-auto">
            {agentsToDisplay.map(agent => {
              const IconComp = agent.iconName === 'store' ? Store : agent.iconName === 'briefcase' ? Briefcase : agent.iconName === 'zap' ? Zap : agent.iconName === 'phone' ? Phone : HelpCircle
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
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* Footer ultra minimaliste */}
          <div className="px-4 py-3 bg-white border-t border-gray-100 text-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Temps de réponse ~5 min</span>
          </div>
        </div>
      )}

      {/* Tooltip (only when menu is closed) */}
      {!isOpen && showTooltip && (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-[220px] relative">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
            title="Fermer"
          >
            <X size={12} className="text-gray-500" />
          </button>
          <p className="text-sm font-bold text-gray-800 mb-1">Besoin d&apos;aide ? 💬</p>
          <p className="text-xs text-gray-500 leading-tight">Nos experts vous accompagnent.</p>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowTooltip(false) }}
        aria-label="Contacter Yayyam"
        className={`group relative w-16 h-16 ${isOpen ? 'bg-gray-800' : 'bg-[#25D366]'} hover:opacity-90 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95`}
      >
        {/* Pulse ring */}
        {!isOpen && <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />}

        {isOpen ? (
          <X size={24} className="text-white relative z-10" />
        ) : (
           <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 relative z-10 drop-shadow-sm">
             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
           </svg>
        )}
      </button>
    </div>
  )
}
