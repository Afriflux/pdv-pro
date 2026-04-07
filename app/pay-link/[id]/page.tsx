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

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-line relative">
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: link.store.primary_color || '#0F7A60' }}></div>
        
        {/* En-tête Store */}
        <div className="p-6 border-b border-line flex flex-col items-center justify-center gap-3 bg-gray-50/50">
          {link.store.logo_url ? (
            <img src={link.store.logo_url} alt={link.store.name} className="w-16 h-16 rounded-full object-cover border border-line bg-white" />
          ) : (
            <div className="w-16 h-16 rounded-full border border-line bg-white flex items-center justify-center text-xl" style={{ color: link.store.primary_color || '#0F7A60' }}>
              🏪
            </div>
          )}
          <h2 className="font-bold text-ink text-center">{link.store.name}</h2>
        </div>

        <div className="p-6 text-center">
           <h1 className="text-xl font-black text-ink mb-2">{link.title}</h1>
           {link.description && <p className="text-sm text-gray-500 mb-6">{link.description}</p>}
           
           <div className="py-4 my-2 border-y border-dashed border-line">
              <span className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Montant à Payer</span>
              <p className="font-display text-4xl font-black text-ink">
                {link.amount.toLocaleString('fr-FR')} <span className="text-base text-gray-500">{link.currency}</span>
              </p>
           </div>
        </div>

        {/* Formulaire et Paiement géré côté Client */}
        <PayLinkClient link={link} storeColor={link.store.primary_color || '#0F7A60'} />
      </div>
      
      <div className="mt-8 text-center text-xs text-dust flex flex-col items-center gap-2">
         <span className="font-bold flex items-center gap-1">🔒 Paiement Sécurisé</span>
         <span>Propulsé par Yayyam</span>
      </div>
    </div>
  )
}
