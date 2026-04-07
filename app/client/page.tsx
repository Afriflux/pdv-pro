import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { 
  Package, Smartphone, ArrowRight, Download, PlayCircle, 
  MapPin, Clock, CheckCircle2, FileText, Truck, Compass, BookOpen
} from 'lucide-react'

const formatCFA = (val: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(val)
}

export default async function ClientDashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()

  // Récupération Profil
  const { data: profile } = await supabaseAdmin.from('User').select('email, name').eq('id', user.id).single()
  
  // Or Condition pour récupérer par email ou id
  const orCondition = `buyer_id.eq.${user.id}` + (profile?.email ? `,buyer_email.eq.${profile.email}` : '')

  // --- REQUÊTES DES COMMANDES (SUPABASE) ---
  const { data: dbOrders } = await supabaseAdmin
    .from('Order')
    .select('*, Store(name, slug, logo_url)')
    .or(orCondition)
    .order('created_at', { ascending: false })
    .limit(10)

  const allOrders = dbOrders || []
  
  // Stats Calculs
  const { data: dbAllOrdersStats } = await supabaseAdmin
    .from('Order')
    .select('total, order_type')
    .or(orCondition)
    
  const combinedStatsOrders = dbAllOrdersStats || []
  const totalSpent = combinedStatsOrders.reduce((acc: any, o: any) => acc + (o.total || 0), 0)
  const totalDigital = combinedStatsOrders.filter((o: any) => o.order_type === 'digital' || o.order_type === 'telegram').length
  const totalPhysical = combinedStatsOrders.filter((o: any) => o.order_type === 'physical').length

  // Recherche commande en transit (shipped)
  const orderInTransit = allOrders.find(o => o.status === 'shipped' || o.status === 'processing')


  // --- REQUÊTES PRODUITS DIGITAUX (PRISMA) ---
  const dbDigitalAccesses = await prisma.digitalAccess.findMany({
    where: {
      order: { buyer_id: user.id },
      revoked: false
    },
    include: { product: true, order: true },
    orderBy: { created_at: 'desc' },
    take: 3
  })

  const digitalLibrary = (dbDigitalAccesses || []).slice(0, 3)

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)] pb-12">
      {/* 🌟 MESH BACKGROUND DYNAMIQUE COSMÉTIQUE */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAFAFA]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 blur-[130px] pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/5 blur-[120px] pointer-events-none mix-blend-multiply" />
      </div>

      <div className="p-6 md:p-10 max-w-[1400px] mx-auto z-10 relative animate-in fade-in duration-700">
        
        {/* === HEADER === */}
        <header className="mb-10 w-full relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tighter mb-2">Bonjour, {profile?.name?.split(' ')[0] || 'Acheteur'} 🎉</h1>
            <p className="text-gray-500 font-medium text-lg">Prêt à explorer vos achats et suivre vos livraisons ?</p>
          </div>
          <div className="flex gap-3">
             <Link href="/vendeurs" className="bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
               <Compass size={18} /> Découvrir
             </Link>
             <Link href="/client/orders" className="bg-[#1A1A1A] text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 transition-all">
               Voir tout l'historique
             </Link>
          </div>
        </header>

        {/* === CASHBACK BANNER (GAMIFICATION ACHETEUR) === */}
        <div className="mb-8 w-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-orange-500/20 text-white overflow-hidden relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
           <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-3xl shrink-0">
                💸
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-1">Votre Cashback Client : 1,500 FCFA</h3>
                <p className="font-medium text-white/90">Vous récupérez 1% sur chaque achat ! Utilisez ce solde pour votre prochaine formation Yayyam.</p>
              </div>
           </div>
           <button className="relative z-10 mt-6 md:mt-0 bg-white text-orange-600 px-8 py-3.5 rounded-2xl font-bold hover:bg-orange-50 hover:scale-105 transition-all shadow-lg shrink-0">
             Utiliser mon solde
           </button>
        </div>

        {/* === BENTO GRID PRINCIPAL === */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">

          {/* 🟦 BENTO 1 : VUE D'ENSEMBLE FINANCIÈRE (Col 4) */}
          <div className="md:col-span-4 bg-[#0a0a0a] rounded-[2.5rem] p-8 relative overflow-hidden group shadow-[0_8px_40px_rgba(0,0,0,0.15)] flex flex-col justify-between h-[300px]">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none opacity-50 group-hover:opacity-100 group-hover:bg-teal-500/30 transition-all duration-700"></div>
            
            <div className="relative z-10">
               <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400/80 mb-2 flex items-center gap-2">
                 <Package size={14} /> Total des achats
               </p>
               <h3 className="text-4xl lg:text-5xl font-black text-white tracking-tighter flex items-end gap-1.5 mt-2">
                 {formatCFA(totalSpent).replace('FCFA','')} <span className="text-xl text-white/50 mb-1 font-bold">F</span>
               </h3>
               <p className="text-gray-400 mt-3 text-sm font-medium">Investis dans des boutiques partenaires Yayyam.</p>
            </div>

            <div className="relative z-10 flex gap-4 mt-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex-1">
                 <p className="text-xs text-white/60 font-bold mb-1">Physiques</p>
                 <p className="text-xl font-black text-white">{totalPhysical}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex-1">
                 <p className="text-xs text-white/60 font-bold mb-1">Digitaux</p>
                 <p className="text-xl font-black text-white">{totalDigital}</p>
              </div>
            </div>
          </div>

          {/* 🟧 BENTO 2 : TRACKING EN DIRECT (Col 8) */}
          <div className="md:col-span-8 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-gray-200/60 p-8 relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-[300px] flex flex-col justify-between">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#0F7A60]/5 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             
             {orderInTransit ? (
               <div className="flex flex-col h-full z-10 relative">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-black uppercase tracking-wider mb-2 animate-pulse">
                         <Truck size={14} /> En route vers vous
                      </span>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">Commande #{orderInTransit.id.split('-')[0].toUpperCase()}</h3>
                      <p className="text-gray-500 text-sm font-medium">Chez <strong className="text-gray-700">{orderInTransit.Store?.name || 'Boutique'}</strong></p>
                    </div>
                    <Link href={`/track?ref=${orderInTransit.id}`} className="w-12 h-12 bg-[#0F7A60]/10 text-[#0F7A60] rounded-2xl flex items-center justify-center hover:bg-[#0F7A60] hover:text-white transition-colors group/btn">
                       <ArrowRight size={20} className="group-hover/btn:-rotate-45 transition-transform" />
                    </Link>
                 </div>

                 <div className="mt-auto bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                          <MapPin size={24} />
                       </div>
                       <div>
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Adresse de livraison</p>
                         <p className="font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{orderInTransit.delivery_address || 'Adresse introuvable'}</p>
                       </div>
                    </div>
                    <div className="hidden sm:block text-right">
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Montant à payer</p>
                       <p className="font-black text-[#0F7A60] text-lg">{formatCFA(orderInTransit.total)}</p>
                    </div>
                 </div>
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-center z-10 relative">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                     <CheckCircle2 size={32} />
                   </div>
                   <h3 className="text-xl font-black text-gray-900">Aucune livraison en cours</h3>
                   <p className="text-gray-500 mt-2 font-medium">Toutes vos commandes physiques ont été livrées ou vous n'en avez pas récemment passées.</p>
                </div>
             )}
          </div>

          {/* 🟪 BENTO 3 : RACCOURCI BIBLIOTHÈQUE DIGITALE (Col 12) */}
          <div className="md:col-span-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-[2.5rem] border border-indigo-100/50 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-indigo-950 flex items-center gap-2">
                    <BookOpen size={24} className="text-indigo-600" /> Accès Rapide : Bibliothèque
                  </h2>
                  <p className="text-indigo-900/60 font-medium mt-1">Reprenez la lecture de vos dernières formations ou e-books.</p>
                </div>
                <Link href="/client/library" className="hidden sm:flex px-6 py-2.5 bg-white text-indigo-600 font-bold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  Voir toute la bibliothèque
                </Link>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {digitalLibrary.length > 0 ? (
                  (digitalLibrary || []).map((access: any) => {
                    const product = access.product
                    const isVideo = product.digital_link !== null
                    return (
                      <a href={product.digital_link || product.digital_file_url || '#'} target={product.digital_link ? "_blank" : "_self"} key={access.id} className="group flex items-center gap-4 bg-white/60 hover:bg-white p-3 rounded-[1.5rem] transition-all duration-300 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
                        <div className="w-20 h-20 rounded-[1rem] bg-gray-100 overflow-hidden relative flex-shrink-0">
                          {product.images?.[0] ? (
                             <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-300"><FileText size={24}/></div>
                          )}
                        </div>
                        <div className="flex-1 pr-2">
                           <h4 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">{product.name}</h4>
                           <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-indigo-500 mt-2 tracking-wider bg-indigo-50 px-2 py-0.5 rounded-lg">
                             {isVideo ? <PlayCircle size={12}/> : <Download size={12}/>}
                             {isVideo ? 'Vidéo' : 'E-Book'}
                           </span>
                        </div>
                      </a>
                    )
                  })
                ) : (
                  <div className="col-span-full p-8 text-center bg-white/50 rounded-3xl border border-dashed border-indigo-200">
                    <p className="text-indigo-900/60 font-medium">Vous ne possédez aucun produit digital actuellement.</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* === HISTORIQUE DES COMMANDES (Vertical Timeline Style) === */}
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-black text-[#1A1A1A]">Historique Récent</h2>
            <Link href="/client/orders" className="text-[#0F7A60] hover:text-[#0B5C48] font-black text-sm bg-[#0F7A60]/5 hover:bg-[#0F7A60]/10 px-5 py-2.5 rounded-xl hidden sm:flex items-center gap-2 transition-colors">
              Gérer mes commandes <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            {allOrders && allOrders.length > 0 ? (
              <div className="divide-y divide-gray-100/60">
                {(allOrders || []).map((o: any) => {
                  const isDigital = o.order_type === 'digital' || o.order_type === 'telegram'
                  return (
                    <div key={o.id} className="p-5 sm:p-6 hover:bg-[#0F7A60]/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                      
                      {/* Left: Info */}
                      <div className="flex items-center gap-5 flex-1">
                        <div className={`w-14 h-14 shrink-0 rounded-[1.2rem] flex items-center justify-center border ${isDigital ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-gray-50 border-gray-200 text-gray-500 group-hover:bg-[#0F7A60]/10 group-hover:text-[#0F7A60] group-hover:border-[#0F7A60]/20'} transition-colors`}>
                          {isDigital ? <Smartphone size={24} /> : <Package size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">
                              {o.product_id ? 'Produit / Panier' : 'Panier multiple'}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">chez</span>
                            <span className="text-xs font-black bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                               {o.Store?.name || 'Boutique'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mt-1.5">
                            <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="font-black text-gray-900">{formatCFA(o.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 sm:gap-4 self-start sm:self-center">
                         <div className="hidden md:block">
                           {o.status === 'confirmed' ? (
                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">Confirmée</span>
                           ) : o.status === 'delivered' ? (
                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#0F7A60] border border-[#0F7A60]/30 shadow-sm">Livrée</span>
                           ) : o.status === 'shipped' || o.status === 'processing' ? (
                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">En cours</span>
                           ) : (
                             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{o.status}</span>
                           )}
                         </div>

                         <Link href={`/api/invoices/client/download?orderId=${o.id}`} target="_blank" className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-100 shadow-sm" title="Télécharger la Facture PDF">
                           <FileText size={18} />
                         </Link>

                         {isDigital ? (
                           <Link href="/client/library" className="px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-sm font-bold transition-colors border border-indigo-100 hover:border-indigo-600 shadow-sm">
                             Bibliothèque
                           </Link>
                         ) : (
                           <Link href={`/track?ref=${o.id}`} className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-[#0F7A60] text-white text-sm font-bold transition-colors shadow-sm">
                             Suivre colis
                           </Link>
                         )}
                      </div>

                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
                 <div className="w-24 h-24 bg-gradient-to-br from-[#0F7A60]/10 to-transparent rounded-full flex items-center justify-center mb-6 relative">
                   <div className="absolute inset-0 bg-[#0F7A60]/20 blur-xl rounded-full animate-pulse" />
                   <Package className="text-[#0F7A60] relative z-10 drop-shadow-md w-10 h-10" />
                 </div>
                 <h3 className="font-display font-black text-[#1A1A1A] text-xl uppercase tracking-tight mb-2">Aucune commande</h3>
                 <p className="max-w-md text-sm font-medium">Vous n'avez passé aucune commande pour le moment.<br/>Découvrez le catalogue de nos vendeurs et faites vos premiers achats !</p>
                 <Link href="/vendeurs" className="mt-6 px-6 py-3 bg-[#0F7A60] text-white font-bold rounded-xl shadow-lg shadow-[#0F7A60]/20 hover:bg-[#0c624d] transition-colors">
                    Explorer le catalogue
                 </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
