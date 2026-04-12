import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Metadata } from 'next'

import MarketplaceClient from './MarketplaceClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Marketplace Yayyam | Découvrez les meilleurs espaces',
  description: 'Explorez des centaines d&apos;espaces de vente certifiés. Mode, Cosmétiques, Électronique, Alimentation. Achetez en toute sécurité avec Wave & Orange Money.',
  openGraph: {
    title: 'Marketplace Yayyam',
    description: 'Découvrez les meilleurs espaces de vente d&apos;Afrique de l&apos;Ouest.',
    url: 'https://yayyam.com/vendeurs',
    siteName: 'Yayyam',
    images: [{ url: '/og-marketplace.png', width: 1200, height: 630 }],
    locale: 'fr_FR',
    type: 'website',
  }
}

export default async function MarketplacePage({ searchParams }: { searchParams: { sort?: string } }) {
  const supabase = await createClient()
  const sort = searchParams.sort || 'best'

  // Vérifier la session pour le bouton "Mon espace"
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session
  
  let dashboardUrl = '/login'
  if (isLoggedIn && session?.user) {
    const supabaseAdmin = createAdminClient()
    const { data: userRow } = await supabaseAdmin.from('User').select('role').eq('id', session.user.id).single()
    const role = userRow?.role
    if (role === 'acheteur' || role === 'client') dashboardUrl = '/client'
    else if (role === 'affilie') dashboardUrl = '/portal'
    else if (role === 'super_admin' || role === 'gestionnaire' || role === 'support') dashboardUrl = '/admin'
    else dashboardUrl = '/dashboard'
  }

  // On récupère les boutiques avec leurs scores et leurs infos de base.
  const { data: storesData } = await supabase
    .from('Store')
    .select(`
      id, 
      name, 
      store_name,
      slug, 
      logo_url, 
      category,
      created_at,
      products:Product(id),
      score:StoreScore(score, featured)
    `)
    .order('name', { ascending: true })
    .limit(100)
 
  // Nettoyage et typage manuel des données.
  const validatedStores = (storesData || []).map((s: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const scoreData = Array.isArray(s.score) ? s.score[0] : s.score
    
    return {
      id: s.id,
      name: s.store_name?.trim() ? s.store_name : (s.slug ? `Boutique ${s.slug}` : 'Boutique Anonyme'),
      slug: s.slug,
      logoUrl: s.logo_url,
      category: s.category || 'Vente générale',
      score: scoreData?.score || 0,
      featured: scoreData?.featured || false,
      productCount: s.products?.length || 0,
      joinedAt: new Date(s.created_at)
    }
  }).filter(Boolean) as any[]

  if (sort === 'best') validatedStores.sort((a, b) => b.score - a.score)
  else if (sort === 'products') validatedStores.sort((a, b) => b.productCount - a.productCount)
  else if (sort === 'newest') validatedStores.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())

  return <MarketplaceClient stores={validatedStores} sort={sort} isLoggedIn={isLoggedIn} dashboardUrl={dashboardUrl} />
}
