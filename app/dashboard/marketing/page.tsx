import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarketingClient from './MarketingClient'
import ScriptsIA from './ScriptsIA'
import EmailMarketing from './EmailMarketing'
import MarketingStats from './MarketingStats'
import SocialKit from './SocialKit'
import { getStoreLinksAnalytics, createShortLink } from '@/lib/marketing/shortlink'

export default async function MarketingHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Charger l'espace
  const { data: store } = await supabase
    .from('Store')
    .select('id, name, slug')
    .eq('user_id', user.id)
    .single()

  const storeId   = store?.id ?? null
  const storeSlug = store?.slug ?? ''
  const storeName = store?.name ?? ''

  // 2. Charger les produits actifs (pour le menu déroulant de partage)
  const { data: products } = storeId ? await supabase
    .from('Product')
    .select('id, name, type, views')
    .eq('store_id', storeId)
    .eq('active', true)
    .order('name', { ascending: true }) : { data: [] }

  // 3. Forcer la création d'un ShortLink global pour l'espace si inexistant
  const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'pdvpro.com'
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pdvpro.com'
  const storeUrl = `${appUrl}/${storeSlug}`

  let links: Awaited<ReturnType<typeof getStoreLinksAnalytics>> = []
  if (storeId && storeSlug) {
    const storeUrlFormatted = `https://${domain}/${storeSlug}`
    await createShortLink(storeUrlFormatted, storeId, undefined)
    links = await getStoreLinksAnalytics(storeId)
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 md:px-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Marketing Hub 🎯</h1>
          <p className="text-sm text-gray-400 mt-1">
            Partage express, QR Codes, scripts pub IA et performances de vos liens
          </p>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="w-full p-6 space-y-8 bg-[#FAFAF7] min-h-screen">
        {store ? (
          <>
            {/* 1. KPIs Marketing */}
            <MarketingStats storeId={storeId} links={links || []} />

            {/* 2. Outils de Partage (Grille 2 colonnes) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Liens courts & QR (Existant) */}
              <div className="flex flex-col h-full h-[600px] xl:h-auto">
                <MarketingClient
                  store={store}
                  products={products || []}
                  links={links || []}
                  domain={domain}
                />
              </div>

              {/* Kit Réseaux Sociaux (Nouveau) */}
              <div className="flex flex-col h-[600px] xl:h-auto">
                <SocialKit storeName={storeName} storeUrl={storeUrl} />
              </div>
            </div>

            {/* 3. Section Scripts Pub IA */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                ✨ Scripts Pub IA
              </h2>
              <ScriptsIA />
            </div>

            {/* 4. Section Email Marketing */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                📧 Email Marketing
              </h2>
              <EmailMarketing />
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">
              Aucun espace trouvé. Créez votre espace depuis le tableau de bord.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
