import Link from 'next/link'
import { SearchX, ArrowRight, Store } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center font-body selection:bg-emerald/20">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-xl border border-line flex flex-col items-center relative overflow-hidden">
        {/* Décoration en fond */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald via-turquoise to-emerald"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald/5 rounded-full blur-3xl"></div>

        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 text-gray-400 border border-line shadow-sm relative z-10">
          <SearchX size={40} strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-display font-black text-ink mb-3 relative z-10">
          Oups ! Cette page n'existe pas.
        </h1>
        
        <p className="text-slate text-sm mb-8 leading-relaxed relative z-10">
          La page que vous cherchez a peut-être été déplacée, supprimée, ou n'a jamais existé.
        </p>

        <div className="w-full space-y-3 relative z-10">
          <Link 
            href="/" 
            className="w-full flex items-center justify-center gap-2 bg-emerald hover:bg-emerald-rich text-white py-3.5 px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Retour à l'accueil
            <ArrowRight size={18} />
          </Link>
          
          <Link 
            href="/vendeurs" 
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-ink py-3.5 px-6 rounded-xl font-bold transition-all border border-line shadow-sm active:scale-[0.98]"
          >
            Voir les boutiques
            <Store size={18} className="opacity-50" />
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-slate/50">
        <Store size={16} />
        <span className="font-display font-black tracking-tighter text-sm">PDV<span className="text-emerald">Pro</span></span>
      </div>
    </div>
  )
}
