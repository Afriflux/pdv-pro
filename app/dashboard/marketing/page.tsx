import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarketingHubClient from './MarketingHubClient'
import { getStoreLinksAnalytics, createShortLink } from '@/lib/marketing/shortlink'

export default async function MarketingHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Charger l'espace (avec les IDs de pixels)
  const { data: store } = await supabase
    .from('Store')
    .select('id, name, slug, meta_pixel_id, tiktok_pixel_id')
    .eq('user_id', user.id)
    .single()

  const storeId   = store?.id ?? null
  const storeSlug = store?.slug ?? ''
  
  // 2. Charger les produits actifs (pour le menu déroulant de partage)
  const { data: products } = storeId ? await supabase
    .from('Product')
    .select('id, name, type, views')
    .eq('store_id', storeId)
    .eq('active', true)
    .order('name', { ascending: true }) : { data: [] }

  // 3. Forcer la création d'un ShortLink global pour l'espace si inexistant
  const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'pdvpro.com'

  let links: Awaited<ReturnType<typeof getStoreLinksAnalytics>> = []
  if (storeId && storeSlug) {
    const storeUrlFormatted = `https://${domain}/${storeSlug}`
    await createShortLink(storeUrlFormatted, storeId, undefined)
    links = await getStoreLinksAnalytics(storeId)
  }

  return (
    <main className="min-h-screen bg-[#FAFAF7] pb-12">
      {/* Header Premium */}
      <header className="bg-white border-b border-gray-100 px-6 py-8 md:px-10">
        <div className="w-full flex flex-col md:flex-row md:items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white shadow-md">
                🎯
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Command Center</h1>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium max-w-xl leading-relaxed">
              Pilotez la croissance de votre boutique. Distribuez vos liens, configurez vos Pixels pour recibler vos visiteurs, et laissez l'IA créer vos campagnes publicitaires.
            </p>
          </div>
        </div>
      </header>

      {/* Contenu principal - Tabbed Layout */}
      <div className="w-full w-full px-4 md:px-6 py-8">
        {store ? (
          <MarketingHubClient 
            store={store}
            products={products || []}
            links={links || []}
            domain={domain}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-dashed border-gray-200">
            <span className="text-4xl mb-4">🛒</span>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Aucun espace trouvé</h3>
            <p className="text-gray-500 font-medium text-center">
              Vous devez créer ou configurer votre boutique depuis le tableau de bord pour accéder au Command Center.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
