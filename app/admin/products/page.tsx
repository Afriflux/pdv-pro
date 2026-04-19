import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Package, Search, Filter, ExternalLink, Tag, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    page?: string
  }>
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = createAdminClient()

  const query = params.q ?? ''
  const currentPage = Number(params.page) || 1
  const pageSize = 25
  const offset = (currentPage - 1) * pageSize

  // Récupérer les produits globaux
  let productQuery = supabase
    .from('Product')
    .select('id, name, price, type, active, created_at, images, store:Store(id, name, slug)', { count: 'exact' })

  if (query) {
    productQuery = productQuery.ilike('name', `%${query}%`)
  }

  const { data: products, count, error } = await productQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('[AdminProducts] Error:', error.message)
  }

  // KPIs
  const { count: physicalCount } = await supabase.from('Product').select('id', { count: 'exact', head: true }).eq('type', 'physical')
  const { count: digitalCount } = await supabase.from('Product').select('id', { count: 'exact', head: true }).eq('type', 'digital')
  const { count: coachingCount } = await supabase.from('Product').select('id', { count: 'exact', head: true }).eq('type', 'coaching')

  const totalProducts = count ?? 0

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      
      {/* ── HEADER ── */}
      <header className="w-full bg-gradient-to-r from-[#012928] via-[#0A4138] to-[#04332A] pt-6 pb-16 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <Package className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Catalogue Global</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                {totalProducts} produits référencés sur Yayyam.
              </p>
            </div>
          </div>

          <form action="/admin/products" method="GET" className="relative group max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-emerald-100/50 group-focus-within:text-emerald-300 transition-colors" />
            </div>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Chercher un produit..."
              className="w-full pl-11 pr-4 py-3 bg-white/10 border-white/20 text-white placeholder-emerald-100/50 rounded-2xl focus:bg-white/20 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 transition-all font-medium text-sm"
            />
          </form>
        </div>

        {/* ── KPIs ── */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
            <span className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Total Produits</span>
            <span className="text-xl font-black text-white">{totalProducts}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
            <span className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Physiques</span>
            <span className="text-xl font-black text-blue-300">{physicalCount || 0}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
            <span className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Digitaux</span>
            <span className="text-xl font-black text-purple-300">{digitalCount || 0}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
            <span className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Coaching</span>
            <span className="text-xl font-black text-amber-300">{coachingCount || 0}</span>
          </div>
        </div>
      </header>

      {/* ── TABLE ── */}
      <div className="flex flex-col gap-6 w-full relative z-20 px-6 lg:px-10 -mt-8 pb-20 items-start">
        <div className="w-full bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100/80">
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400">Pdt & Boutique</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400">Prix</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400">Statut</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(products ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-3">
                         <Package className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">Aucun produit trouvé.</p>
                    </td>
                  </tr>
                ) : (
                  (products ?? []).map((product: any) => {
                    const store = Array.isArray(product.store) ? product.store[0] : product.store
                    let firstImage = null
                    if (Array.isArray(product.images) && product.images.length > 0) {
                      firstImage = product.images[0]
                    } else if (typeof product.images === 'string' && product.images.startsWith('[')) {
                      try { firstImage = JSON.parse(product.images)[0] } catch {}
                    }

                    return (
                      <tr key={product.id} className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative border border-gray-100">
                                {firstImage ? (
                                   // eslint-disable-next-line @next/next/no-img-element
                                   <img src={firstImage} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center font-black text-gray-300 bg-gray-50">
                                     {product.name.charAt(0)}
                                   </div>
                                )}
                             </div>
                             <div>
                               <p className="font-bold text-gray-900 truncate max-w-[200px]" title={product.name}>{product.name}</p>
                               {store && (
                                 <Link href={`/admin/vendeurs/${store.id}`} className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1 mt-0.5">
                                    🏪 {store.name}
                                 </Link>
                               )}
                             </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-black text-gray-900">{product.price.toLocaleString('fr-FR')}</span>
                          <span className="text-xs text-gray-400 font-medium ml-1">XOF</span>
                        </td>
                        <td className="px-4 py-4">
                           <span className={`inline-flex px-2 py-1 gap-1 text-[10px] font-black uppercase tracking-wider rounded border ${
                             product.type === 'digital' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                             product.type === 'coaching' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                             'bg-emerald-50 text-emerald-600 border-emerald-100'
                           }`}>
                             <Tag size={12} /> {product.type}
                           </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${product.active ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                            <span className="text-xs font-bold text-gray-600">{product.active ? 'Visible' : 'Désactivé'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                           <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                             <Calendar size={13} />
                             {new Date(product.created_at).toLocaleDateString()}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <a href={`/pay/${product.id}`} target="_blank" rel="noreferrer" title="Voir le produit" className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all">
                              <ExternalLink size={16} />
                           </a>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
