import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: stores } = await supabase.from('Store').select('slug, updated_at')
  const { data: products } = await supabase.from('Product').select('id, updated_at, store:Store(slug)')

  const storeUrls = (stores || []).map(store => ({
    url: `https://pdvpro.com/p/${store.slug}`,
    lastModified: store.updated_at ? new Date(store.updated_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const productUrls = (products || []).filter(p => {
    const s = Array.isArray(p.store) ? p.store[0] : p.store
    return s?.slug
  }).map(product => {
    const s = Array.isArray(product.store) ? product.store[0] : product.store
    return {
      url: `https://pdvpro.com/p/${s.slug}/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  return [
    {
      url: 'https://pdvpro.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://pdvpro.com/register',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://pdvpro.com/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...storeUrls,
    ...productUrls,
  ]
}
