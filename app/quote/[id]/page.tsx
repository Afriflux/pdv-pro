import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import QuoteClient from './QuoteClient'
import Image from 'next/image'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { store: true }
  })
  
  if (!quote) return { title: 'Devis introuvable | Yayyam' }
  
  return {
    title: `Facture/Devis ${quote.store.name}`,
    description: `Devis pour ${quote.client_name} - ${quote.total_amount} FCFA`,
  }
}

export default async function QuotePage({ params }: { params: { id: string } }) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { store: true }
  })

  if (!quote || !quote.store) {
    notFound()
  }

  const items = quote.items as Array<{ description: string, quantity: number, unit_price: number }>

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      
      {/* Document "Papier" */}
      <div className="w-full max-w-4xl bg-white shadow-2xl overflow-hidden print:shadow-none print:max-w-none">
        
        {/* En-tête de Facture */}
        <div className="flex flex-col sm:flex-row justify-between items-start p-10 lg:p-14 border-b-8" {...{ style: { borderBottomColor: quote.store.primary_color || '#0F7A60' } }}>
           <div>
             {quote.store.logo_url ? (
                 <Image src={quote.store.logo_url} alt={quote.store.name} width={200} height={64} className="h-16 w-auto object-contain mb-4" />
             ) : (
                <h1 className="text-3xl font-black mb-4" {...{ style: { color: quote.store.primary_color || '#0F7A60' } }}>{quote.store.name}</h1>
             )}
             <p className="text-gray-500 font-medium">{quote.store.name}</p>
           </div>
           <div className="text-left sm:text-right mt-6 sm:mt-0">
             <h2 className="text-4xl font-black text-ink uppercase tracking-wider mb-2">
                {quote.status === 'ACCEPTED' ? 'Facture' : 'Devis'}
             </h2>
             <p className="text-gray-500 font-bold">Réf: #{quote.id.substring(0, 8).toUpperCase()}</p>
             <p className="text-gray-500 font-bold mt-1">Date: {new Date(quote.created_at).toLocaleDateString('fr-FR')}</p>
           </div>
        </div>

        {/* Détails du Client */}
        <div className="p-10 lg:px-14 py-8 bg-gray-50/50 flex flex-col sm:flex-row justify-between border-b border-line">
           <div>
             <p className="text-xs uppercase font-extrabold text-gray-400 mb-2">Facturé à</p>
             <p className="text-xl font-bold text-ink">{quote.client_name}</p>
             {quote.client_email && <p className="text-gray-600 mt-1">{quote.client_email}</p>}
           </div>
           
           <div className="mt-6 sm:mt-0 sm:text-right">
             <p className="text-xs uppercase font-extrabold text-gray-400 mb-2">Montant à Payer</p>
             <p className="text-3xl font-black text-ink">{quote.total_amount.toLocaleString('fr-FR')} <span className="text-lg text-gray-500">FCFA</span></p>
           </div>
        </div>

        {/* Tableau des prestations */}
        <div className="p-10 lg:p-14">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-ink text-sm uppercase text-ink font-black">
                  <th className="py-4">Description</th>
                  <th className="py-4 text-center">Qté</th>
                  <th className="py-4 text-right">Prix Unitaire</th>
                  <th className="py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                 {items.map((item, index) => (
                   <tr key={index}>
                     <td className="py-6 pr-4">
                       <p className="font-bold text-ink text-lg">{item.description}</p>
                     </td>
                     <td className="py-6 text-center font-medium text-gray-600">{item.quantity}</td>
                     <td className="py-6 text-right font-medium text-gray-600 whitespace-nowrap">{item.unit_price.toLocaleString('fr-FR')} FCFA</td>
                     <td className="py-6 text-right font-bold text-ink whitespace-nowrap">{(item.quantity * item.unit_price).toLocaleString('fr-FR')} FCFA</td>
                   </tr>
                 ))}
              </tbody>
           </table>

           <div className="mt-8 flex justify-end">
              <div className="w-full max-w-sm bg-gray-50 rounded-2xl p-6 border border-line space-y-4">
                 <div className="flex justify-between items-center text-gray-600 font-bold">
                    <span>Sous-total</span>
                    <span>{quote.total_amount.toLocaleString('fr-FR')} FCFA</span>
                 </div>
                 <div className="flex justify-between items-center text-gray-600 font-bold">
                    <span>Taxes</span>
                    <span>0 FCFA</span>
                 </div>
                 <div className="flex justify-between items-center text-xl font-black text-ink pt-4 border-t border-line">
                    <span>Total Net</span>
                    <span>{quote.total_amount.toLocaleString('fr-FR')} FCFA</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Zone d'action (Paiement) si non payé */}
      <div className="w-full max-w-4xl mt-8 print:hidden">
         <QuoteClient quote={quote} storeColor={quote.store.primary_color || '#0F7A60'} />
      </div>

      <div className="mt-12 text-center text-sm text-gray-400 font-medium print:hidden">
         Document généré de façon sécurisée via Yayyam
      </div>

    </div>
  )
}
