import Link from 'next/link'
import { Truck } from 'lucide-react'

export const metadata = {
  title: 'Livraisons | PDV Pro',
}

export default function LivraisonsPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] font-sans pb-20">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
            Gestion des Livraisons
          </h1>
          <p className="text-sm font-medium text-gray-400 mt-2">
            Configurez vos options de livraison
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        
        {/* SECTION 1 : Zones de livraison */}
        <section className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full">
            Bientôt disponible
          </div>
          
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Truck size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-black text-[#1A1A1A] mb-3">Zones de livraison</h2>
            <p className="text-sm font-medium text-gray-400 max-w-sm">
              Vous pourrez bientôt configurer vos zones et tarifs de livraison directement ici.
            </p>
          </div>
        </section>

        {/* SECTION 2 : Paramètres COD */}
        <section className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="font-black text-[#1A1A1A]">Paramètres COD</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <h3 className="font-bold text-[#1A1A1A]">Paiement à la livraison (COD)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Permettez à vos clients de payer à la réception. Commission : <span className="font-bold">5% fixe</span>.
                </p>
              </div>
              <div className="flex-shrink-0 ml-4 relative">
                 {/* Faux Toggle Visuel */}
                 <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-not-allowed opacity-50">
                   <div className="w-4 h-4 bg-white rounded-full flex absolute top-1 left-1 shadow-sm"></div>
                 </div>
              </div>
            </div>
            
            <div className="mt-6 text-right">
              <Link href="/dashboard/settings" className="text-sm font-bold text-[#0F7A60] hover:underline">
                Aller aux paramètres complets →
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
