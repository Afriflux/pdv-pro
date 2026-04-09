import Link from 'next/link'
import { Calculator, PieChart, Wallet, TrendingUp, ChevronRight, CheckCircle2, ShieldCheck, Box } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AdminERPPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAFAF7] pb-20">
      {/* HEADER */}
      <header className="w-full bg-gradient-to-br from-[#0F7A60] via-[#094A3A] to-slate-900 pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shadow-lg shrink-0">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-[1900px] mx-auto w-full">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10 flex items-center justify-center shrink-0">
              <Box className="w-8 h-8" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Espace ERP Nativ</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1 max-w-lg leading-relaxed">
                Le poste de commandement de Yayyam pour la comptabilité, l'actionnariat et les flux de trésorerie.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="relative z-20 px-6 lg:px-10 -mt-10 max-w-[1900px] mx-auto w-full flex flex-col gap-10 animate-in slide-in-from-bottom-2 duration-300">
        
        {/* NATIVE ERP APPS */}
        <div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/accounting" className="bg-white border border-gray-100/80 hover:border-[#0F7A60]/50 hover:shadow-xl p-6 rounded-[2rem] group transition-all duration-300 relative overflow-hidden flex flex-col shadow-sm">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F7A60]/10 to-[#0F7A60]/5 text-[#0F7A60] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                   <Calculator size={26} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 leading-tight">Comptabilité P&L</h3>
                 <p className="text-sm font-medium text-gray-500 mt-2">Registre des charges opérationnelles et calcul automatisé du Résultat Net de Yayyam.</p>
                 <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between text-[#0F7A60] text-xs font-black">
                   <span className="flex items-center gap-1.5 uppercase tracking-widest text-[#0F7A60]/70">Lancer Fonction</span>
                   <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </div>
              </Link>
              
              <Link href="/admin/equity" className="bg-white border border-gray-100/80 hover:border-amber-500/50 hover:shadow-xl p-6 rounded-[2rem] group transition-all duration-300 relative overflow-hidden flex flex-col shadow-sm">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                   <PieChart size={26} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 leading-tight">Actionnariat</h3>
                 <p className="text-sm font-medium text-gray-500 mt-2">Répartition des parts du Board et distribution planifiée des dividendes.</p>
                 <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between text-amber-600 text-xs font-black">
                   <span className="flex items-center gap-1.5 uppercase tracking-widest text-amber-600/70">Lancer Fonction</span>
                   <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </div>
              </Link>

              <Link href="/admin/finances-config" className="bg-white border border-gray-100/80 hover:border-blue-500/50 hover:shadow-xl p-6 rounded-[2rem] group transition-all duration-300 relative overflow-hidden flex flex-col shadow-sm">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                   <Wallet size={26} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 leading-tight">Trésorerie globale</h3>
                 <p className="text-sm font-medium text-gray-500 mt-2">Visibilité des frais logistiques et gestion de la balance du portefeuille des vendeurs.</p>
                 <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between text-blue-600 text-xs font-black">
                   <span className="flex items-center gap-1.5 uppercase tracking-widest text-blue-600/70">Lancer Fonction</span>
                   <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </div>
              </Link>

              <Link href="/admin/retraits" className="bg-white border border-gray-100/80 hover:border-red-500/50 hover:shadow-xl p-6 rounded-[2rem] group transition-all duration-300 relative overflow-hidden flex flex-col shadow-sm">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                   <TrendingUp size={26} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 leading-tight">Décaissements</h3>
                 <p className="text-sm font-medium text-gray-500 mt-2">Approbation des retraits Orange Money/Wave et exécution des paiements externes.</p>
                 <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between text-red-600 text-xs font-black">
                   <span className="flex items-center gap-1.5 uppercase tracking-widest text-red-600/70">Lancer Fonction</span>
                   <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </div>
              </Link>
           </div>
        </div>
      </main>
    </div>
  )
}
