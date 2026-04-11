import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PayLinkClient from './PayLinkClient'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const link = await prisma.paymentLink.findUnique({
    where: { id: params.id },
    include: { store: true }
  })
  
  if (!link || !link.is_active) return { title: 'Lien invalide | Yayyam' }
  
  return {
    title: `Paiement : ${link.title} - ${link.store.name}`,
    description: link.description || `Effectuez un paiement de ${link.amount} FCFA vers ${link.store.name}.`,
  }
}

export default async function PayLinkPage({ params }: { params: { id: string } }) {
  const link = await prisma.paymentLink.findUnique({
    where: { id: params.id },
    include: { store: true }
  })

  if (!link || !link.is_active || !link.store) {
    notFound()
  }

  const accent = link.store.primary_color || '#0F7A60'

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Glow effect en arrière-plan */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none" {...{ style: { backgroundColor: accent } }} />
      
      <div className="w-full max-w-md relative z-10">
        {/* Card principale avec glassmorphisme */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/[0.06] overflow-hidden border border-gray-100/50">
          
          {/* Bande de couleur accent */}
          <div className="h-1.5 w-full" {...{ style: { background: `linear-gradient(90deg, ${accent}, ${accent}80)` } }} />
          
          {/* En-tête Store */}
          <div className="px-8 pt-8 pb-6 flex flex-col items-center justify-center gap-3">
            {link.store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={link.store.logo_url} alt={link.store.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100 bg-white shadow-sm" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl font-black text-white shadow-sm" {...{ style: { backgroundColor: accent } }}>
                {link.store.name[0]}
              </div>
            )}
            <h2 className="font-black text-gray-900 text-center text-sm">{link.store.name}</h2>
          </div>

          {/* Séparateur */}
          <div className="mx-8 h-[1px] bg-gray-100" />

          {/* Contenu */}
          <div className="px-8 py-8 text-center">
             <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">{link.title}</h1>
             {link.description && <p className="text-sm text-gray-500 mb-6 leading-relaxed">{link.description}</p>}
             
             <div className="py-6 my-2 rounded-2xl border border-dashed" {...{ style: { borderColor: accent + '30', backgroundColor: accent + '08' } }}>
                <span className="block text-[10px] uppercase tracking-[0.2em] font-black mb-2" {...{ style: { color: accent } }}>Montant à Payer</span>
                <p className="text-4xl font-black text-gray-900 tracking-tight">
                  {link.amount.toLocaleString('fr-FR')} <span className="text-base text-gray-400 font-bold">{link.currency}</span>
                </p>
             </div>
          </div>

          {/* Formulaire et Paiement géré côté Client */}
          <PayLinkClient link={link} storeColor={accent} />
        </div>
        
        {/* Badges de confiance sous la card */}
        <div className="mt-6 flex items-center justify-center gap-6 text-gray-400">
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Sécurisé
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Protégé
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Yayyam
          </span>
        </div>
      </div>
    </div>
  )
}
