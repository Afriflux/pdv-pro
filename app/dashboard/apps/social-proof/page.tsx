import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Users, Zap, CheckCircle2 } from 'lucide-react'
import { SocialProofControls } from './SocialProofControls'

export default async function SocialProofAppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id }
  })
  if (!store) redirect('/login')

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)] font-sans">
      {/* 🌟 MESH BACKGROUND DYNAMIQUE COSMÉTIQUE 🌟 */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAFAFA]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-400/20 blur-[130px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:8s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/15 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:10s] [animation-delay:2s]" />
      </div>

      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 px-6 lg:px-10 pt-8">
          <div className="flex items-center gap-5">
            <Link href="/dashboard/apps" className="flex items-center justify-center w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full text-gray-500 hover:text-ink hover:bg-gray-50 transition-colors shrink-0">
               <ChevronLeft size={20} strokeWidth={2.5} />
            </Link>
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-rose-500 shadow-[0_8px_30px_rgb(244,63,94,0.12)] border border-white shrink-0">
              <Users size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Preuve Sociale</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">
                Affichez des notifications de ventes en temps réel pour booster vos conversions.
              </p>
            </div>
          </div>
          <div className="bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl text-sm font-black border border-amber-100 flex items-center gap-2 shadow-sm shrink-0">
            <Zap size={18} className="fill-amber-500" /> +15% de Conversion Ventes
          </div>
        </header>

        <div className="px-6 lg:px-10 max-w-5xl relative z-10 space-y-10 pb-24">
          
          {/* Main Control Panel */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white overflow-hidden shadow-2xl shadow-[rgba(0,0,0,0.03)]">
             <div className="p-8 md:p-10 border-b border-gray-100/50 bg-gradient-to-br from-white to-rose-50/10">
                <h2 className="text-xl font-black text-gray-900 mb-3">Activation du module</h2>
                <p className="text-[15px] text-gray-500 mb-10 max-w-2xl leading-relaxed font-medium">
                  Basculez ce paramètre pour générer automatiquement de petites notifications flottantes en bas de l'écran de votre boutique ("Moussa a acheté ceci il y a X minutes"). L'algorithme tire aléatoirement dans vos dernières commandes réelles.
                </p>
                
                <div className="max-w-2xl">
                  <SocialProofControls initialActive={store.social_proof_active} initialConfig={store.social_proof_config} />
                </div>
             </div>
             
             <div className="p-8 md:p-10 bg-gray-50/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Aperçu du widget généré</h3>
                
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-xl shadow-[rgba(0,0,0,0.08)] border border-gray-100 max-w-sm relative transform scale-[0.95] md:scale-100 transform-origin-left transition-all hover:scale-105 duration-300">
                   <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-rose-500 rounded-full border-[3px] border-white z-10 shadow-sm animate-pulse"></div>
                   <div className="w-14 h-14 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-100 overflow-hidden flex items-center justify-center">
                     <span className="text-2xl">🛍️</span>
                   </div>
                   <div className="flex flex-col justify-center w-full min-w-0 pr-2">
                      <div className="text-[13px] font-black text-gray-900 leading-tight truncate">Fatou D. (Dakar) a acheté</div>
                      <div className="text-[12px] text-gray-500 font-medium truncate mb-1">AirPods Pro - Edition Ultra</div>
                      <div className="text-[10px] font-black text-rose-500 tracking-wider uppercase">Il y a 12 minutes</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "Rassure immédiatement les nouveaux visiteurs de la boutique." },
              { text: "Créé un sentiment d'urgence avec l'effet FOMO naturel." },
              { text: "Données totalement anonymisées (RGPD friendly)." }
            ].map((ft, i) => (
              <div key={i} className="flex gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-[24px] border border-white shadow-xl shadow-[rgba(0,0,0,0.02)]">
                 <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} strokeWidth={3} />
                 </div>
                 <p className="text-[14px] font-bold text-gray-700 leading-snug pt-1">{ft.text}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
