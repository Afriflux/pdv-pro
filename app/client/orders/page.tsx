import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, FileText, Package, Smartphone, Clock, Compass } from 'lucide-react'
import { ReviewModal } from '@/components/client/ReviewModal'

// Utilitaire pour formater en FCFA
const formatCFA = (val: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(val)
}

export default async function ClientOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin.from('User').select('email, name').eq('id', user.id).single()
  
  const orCondition = `buyer_id.eq.${user.id}` + (profile?.email ? `,buyer_email.eq.${profile.email}` : '')

  const { data: dbOrders } = await supabaseAdmin
    .from('Order')
    .select('*, Store(name, slug), Review(rating, id)')
    .or(orCondition)
    .order('created_at', { ascending: false })

  const mockOrders = [
    {
      id: "mock_order_1",
      created_at: new Date().toISOString(),
      total: 25000,
      order_type: "physical",
      status: "delivered",
      Store: { name: "Boutique Mode Express", slug: "mode-express" },
      product_id: "prod_1"
    },
    {
      id: "mock_order_2",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      total: 10000,
      order_type: "digital",
      status: "confirmed",
      download_token: "mock_token_123",
      Store: { name: "Tech Academy", slug: "tech-academy" },
      product_id: "prod_2"
    },
    {
      id: "mock_order_3",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      total: 15000,
      order_type: "physical",
      status: "shipped",
      Store: { name: "Accessoires Pro", slug: "accessoires-pro" },
      product_id: "prod_3"
    }
  ]

  const orders = [...mockOrders, ...(dbOrders || [])]

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)] pb-12">
      {/* 🌟 MESH BACKGROUND DYNAMIQUE COSMÉTIQUE */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAFAFA]">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#0F7A60]/10 blur-[130px] pointer-events-none mix-blend-multiply" />
      </div>

      <div className="p-6 md:p-10 max-w-5xl mx-auto z-10 relative animate-in fade-in duration-700">
        <header className="bg-gradient-to-br from-[#0F7A60] via-[#0b5341] to-[#1A1A1A] border border-[#0F7A60]/50 rounded-[2.5rem] px-8 py-10 shadow-[0_10px_40px_rgba(15,122,96,0.3)] mb-10 w-full relative z-10 overflow-hidden text-white group flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F7A60]/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">Mes Achats</h1>
            <p className="text-gray-400 mt-2 font-medium">Toutes vos commandes, vos suivis de colis et factures.</p>
          </div>

          <div className="relative z-10 max-w-xs w-full lg:w-[300px]">
             <div className="relative group/search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-hover/search:text-white transition-colors" size={18} />
                <input type="text" placeholder="Rechercher..." className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/20 transition-all shadow-sm" disabled />
             </div>
          </div>
        </header>

        <div className="bg-white/80 backdrop-blur-3xl border border-gray-200/60 rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
          
          {orders && orders.length > 0 ? (
            <div className="divide-y divide-gray-100/60 p-2 sm:p-4">
              {(orders || []).map((o: any) => {
                const isDigital = o.order_type === 'digital' || o.order_type === 'telegram'
                return (
                  <div key={o.id} className="p-4 sm:p-6 hover:bg-[#0F7A60]/[0.02] rounded-[2rem] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-5 group">
                    
                     {/* Left: Info */}
                    <div className="flex items-center gap-5 flex-1">
                      <div className={`w-16 h-16 shrink-0 rounded-[1.2rem] flex items-center justify-center border ${isDigital ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-gray-50 border-gray-200 text-gray-500 group-hover:bg-[#0F7A60]/10 group-hover:text-[#0F7A60] group-hover:border-[#0F7A60]/20'} transition-colors shadow-sm`}>
                        {isDigital ? <Smartphone size={28} /> : <Package size={28} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-lg tracking-tight">
                            {o.product_id ? 'Achat Produit' : 'Panier multiple'}
                          </span>
                          <span className="hidden sm:inline text-xs text-gray-400 font-medium">chez</span>
                          <Link href={`/${o.Store?.slug || ''}`} target="_blank" className="text-[11px] font-black bg-gray-100/80 hover:bg-[#0F7A60]/10 hover:text-[#0F7A60] px-2.5 py-1 rounded-md text-gray-600 transition-colors self-start sm:self-center">
                             {o.Store?.name || 'Boutique'}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mt-2">
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-gray-400"/> {new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                          <span className="font-black text-[#0F7A60] bg-[#0F7A60]/10 px-2 py-0.5 rounded-md">{formatCFA(o.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 sm:gap-4 self-start sm:self-center">
                       <div className="hidden lg:block w-24">
                         {o.status === 'confirmed' ? (
                           <span className="inline-flex items-center justify-center w-full px-3 py-1.5 rounded-xl text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">Confirmée</span>
                         ) : o.status === 'delivered' ? (
                           <span className="inline-flex items-center justify-center w-full px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 text-[#0F7A60] border border-[#0F7A60]/30 shadow-sm">Livrée</span>
                         ) : o.status === 'shipped' || o.status === 'processing' ? (
                           <span className="inline-flex items-center justify-center w-full px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">En cours</span>
                         ) : (
                           <span className="inline-flex items-center justify-center w-full px-3 py-1.5 rounded-xl text-[11px] font-bold bg-gray-100 text-gray-700">{o.status}</span>
                         )}
                       </div>

                       <Link href={`/api/invoices/client/download?orderId=${o.id}`} target="_blank" className="w-11 h-11 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 flex items-center justify-center transition-all shadow-sm hover:shadow-md" title="Télécharger la Facture PDF">
                         <FileText size={18} />
                       </Link>

                       {o.status === 'delivered' && (
                         <ReviewModal 
                           orderId={o.id} 
                           storeId={o.Store?.slug || o.store_id} 
                           productId={o.product_id} 
                           buyerName={profile?.name || user.user_metadata?.name || 'Client Yayyam'} 
                           existingReview={o.Review && o.Review.length > 0 ? o.Review[0] : undefined}
                         />
                       )}

                       {isDigital ? (
                         <Link href="/client/library" className="px-5 py-3 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white text-sm font-bold transition-all border border-purple-100 hover:border-purple-600 shadow-sm hover:shadow-lg hover:shadow-purple-600/20">
                           Aller voir
                         </Link>
                       ) : (
                         <Link href={`/track?ref=${o.id}`} className="px-5 py-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-sm font-bold transition-all shadow-sm hover:shadow-lg hover:shadow-black/20">
                           Suivre colis
                         </Link>
                       )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
               <div className="w-24 h-24 bg-gradient-to-br from-[#0F7A60]/10 to-transparent rounded-full flex items-center justify-center mb-6 relative">
                 <div className="absolute inset-0 bg-[#0F7A60]/20 blur-xl rounded-full animate-pulse" />
                 <Package className="text-[#0F7A60] relative z-10 drop-shadow-md w-10 h-10" />
               </div>
               <h3 className="font-display font-black text-[#1A1A1A] text-2xl uppercase tracking-tight mb-3">Aucun achat</h3>
               <p className="max-w-md text-sm font-medium leading-relaxed">Il semblerait que vous n'ayez encore rien commandé via Yayyam.<br/>Vos futurs achats physiques et digitaux apparaîtront ici.</p>
               <Link href="/vendeurs" className="mt-8 px-8 py-3.5 bg-[#1A1A1A] text-white font-bold rounded-2xl shadow-xl shadow-black/10 hover:-translate-y-1 hover:shadow-black/20 transition-all flex items-center gap-2">
                  <Compass size={18} /> Explorer le catalogue
               </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
