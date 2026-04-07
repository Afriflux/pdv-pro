"use client"

import React from 'react'
import { MessageSquare, Clock, ArrowRight } from 'lucide-react'

interface ComingSoonProps {
  title: string
  description: string
  icon: React.ReactNode
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  const handleNotify = () => {
    const message = encodeURIComponent(`Bonjour Yayyam ! Je souhaite être informé dès que la fonctionnalité "${title}" est disponible.`)
    window.open(`https://wa.me/221770000000?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-cream/30 rounded-3xl border border-line/50">
      <div className="w-24 h-24 bg-emerald/10 rounded-3xl flex items-center justify-center mb-8 animate-pulse text-emerald">
        {React.cloneElement(icon as React.ReactElement, { size: 48 })}
      </div>
      
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 text-gold rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-gold/20">
        <Clock size={14} /> Bientôt disponible
      </div>

      <h1 className="text-4xl font-display font-black text-ink mb-4 text-center">{title}</h1>
      <p className="text-slate text-center max-w-md mb-12 text-lg font-light leading-relaxed">
        {description}
      </p>

      <button 
        onClick={handleNotify}
        className="group flex items-center gap-3 px-8 py-4 bg-emerald text-white rounded-2xl font-bold hover:bg-emerald-rich transition-all shadow-xl shadow-emerald/20 hover:scale-[1.02]"
      >
        <MessageSquare size={20} />
        M'avertir quand c'est prêt
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="mt-16 grid grid-cols-3 gap-8 opacity-20 filter grayscale">
        <div className="h-1 w-24 bg-emerald rounded-full"></div>
        <div className="h-1 w-24 bg-emerald rounded-full"></div>
        <div className="h-1 w-24 bg-emerald rounded-full"></div>
      </div>
    </div>
  )
}
