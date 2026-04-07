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
    .select('id, name, slug, meta_pixel_id, tiktok_pixel_id, google_tag_id, whatsapp, whatsapp_abandoned_cart')
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
  const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'yayyam.com'

  let links: Awaited<ReturnType<typeof getStoreLinksAnalytics>> = []
  if (storeId && storeSlug) {
    const storeUrlFormatted = `https://${domain}/${storeSlug}`
    await createShortLink(storeUrlFormatted, storeId, undefined)
    links = await getStoreLinksAnalytics(storeId)
  }

  return (
    <div className="w-full relative z-10 px-6 lg:px-10 pb-20">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-[#0F7A60] shadow-[0_8px_30px_rgb(15,122,96,0.12)] border border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Command Center</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1 max-w-2xl">Pilotez la croissance de votre boutique, configurez vos Pixels pour recibler vos visiteurs, et utilisez l'IA.</p>
            </div>
          </div>
        </header>

        <div className="w-full">
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
      </div>
    </div>
  )
}
