import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MarketplaceControls from './MarketplaceControls'
import { Globe, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function AdminMarketplace() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  // Récupérer la config
  const { data: configs } = await supabase
    .from('PlatformConfig')
    .select('key, value')
    
  const configMap: Record<string, string> = {}
  for (const c of configs ?? []) {
    configMap[c.key] = c.value || ''
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      
      {/* ── HEADER FULL-BLEED (COVER PREMIUM) ── */}
      <header className="w-full bg-gradient-to-r from-[#0D5C4A] via-[#0F7A60] to-teal-700 pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg z-10">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-900/40 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-[1900px] mx-auto w-full">
          
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10 shrink-0">
              <Globe className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div className="pb-1">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Marketplace Centrale</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1 max-w-lg">
                Gérez l'exposition publique de l'écosystème. Ajustez l'algorithme d'affichage et la visibilité.
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-auto flex justify-start md:justify-end pb-1">
             <Link 
               href="/vendeurs"
               target="_blank"
               className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#0D5C4A] hover:bg-emerald-50 font-black text-sm tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
             >
               Voir en live
               <ArrowRight className="w-4 h-4" />
             </Link>
          </div>
        </div>
      </header>

      {/* ── ZONE PRINCIPALE (CONTROLES) ── */}
      <div className="w-full relative z-20 px-6 lg:px-10 -mt-16 pb-20 max-w-[1900px] mx-auto">
        <div className="max-w-5xl">
          <MarketplaceControls initialConfig={configMap} />
        </div>
      </div>
      
    </div>
  )
}
