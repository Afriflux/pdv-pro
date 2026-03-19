'use server'

/**
 * lib/marketing/shortlink.ts
 * Server Actions pour le Marketing Hub
 * - createShortLink : Génère un lien court (pdvpro.com/s/xxxxxx)
 * - logShortLinkClick : Enregistre un clic et l'IP/ville
 * - getStoreAnalytics : Récupère les stats pour le dashboard
 *
 * TypeScript strict — zéro any.
 */

import { createClient }   from '@/lib/supabase/server'
import { headers }        from 'next/headers'
import crypto           from 'crypto'

export interface ShortLinkData {
  id:         string
  code:       string
  target_url: string
  store_id:   string | null
  product_id: string | null
  clicks:     number
}

export interface AnalyticsData {
  clicks: number
  unique_visitors: number
  top_cities: { city: string; count: number }[]
  top_sources: { source: string; count: number }[]
}

/**
 * Génère un code alphanumérique unique de 6 caractères
 */
function generateShortCode(): string {
  return crypto.randomBytes(4).toString('base64url').slice(0, 6)
}

/**
 * Crée ou récupère un lien court pour une URL spécifique (par boutique/produit)
 * @param targetUrl L'URL de destination longue complète
 * @param storeId L'ID de la boutique
 * @param productId L'ID du produit (optionnel)
 */
export async function createShortLink(
  targetUrl: string,
  storeId?: string,
  productId?: string
): Promise<ShortLinkData | null> {
  const supabase = await createClient()

  // Chercher si ce lien exact existe déjà pour éviter les doublons
  let query = supabase
    .from('ShortLink')
    .select('*')
    .eq('target_url', targetUrl)

  if (storeId)   query = query.eq('store_id', storeId)
  if (productId) query = query.eq('product_id', productId)

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    return existing as ShortLinkData
  }

  // Création d'un nouveau code
  let code = generateShortCode()
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 5) {
    const { data: check } = await supabase
      .from('ShortLink')
      .select('id')
      .eq('code', code)
      .single()

    if (!check) {
      isUnique = true
    } else {
      code = generateShortCode()
      attempts++
    }
  }

  if (!isUnique) throw new Error('Impossible de générer un short code unique')

  const { data: newLink, error } = await supabase
    .from('ShortLink')
    .insert({
      code,
      target_url: targetUrl,
      store_id:   storeId ?? null,
      product_id: productId ?? null,
    })
    .select()
    .single()

  if (error || !newLink) {
    console.error('[createShortLink]', error)
    return null
  }

  return newLink as ShortLinkData
}

/**
 * Journalise un clic sur un lien court. Increment + Analytics.
 * Résout la géolocalisation depuis les headers Vercel.
 */
export async function logShortLinkClick(code: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('ShortLink')
    .select('id, target_url, clicks')
    .eq('code', code)
    .single()

  if (!link) return null

  // 1. Incrémenter les clics
  await supabase
    .from('ShortLink')
    .update({ clicks: link.clicks + 1 })
    .eq('id', link.id)

  // 2. Extraire les métadonnées de la requête
  const reqHeaders = headers()
  
  // Vercel Headers
  const city    = reqHeaders.get('x-vercel-ip-city')    ?? 'Inconnu'
  const country = reqHeaders.get('x-vercel-ip-country') ?? 'Inconnu'
  const referer = reqHeaders.get('referer')             ?? 'Direct'

  let source = 'Direct'
  if (referer.includes('facebook.com'))  source = 'Facebook'
  if (referer.includes('instagram.com')) source = 'Instagram'
  if (referer.includes('twitter.com') || referer.includes('t.co')) source = 'Twitter/X'
  if (referer.includes('linkedin.com'))  source = 'LinkedIn'
  if (referer.includes('tiktok.com'))    source = 'TikTok'
  if (referer.includes('whatsapp.com'))  source = 'WhatsApp'

  // 3. Enregistrer l'analytics en fire-and-forget
  await supabase.from('ClickAnalytics').insert({
    short_link_id: link.id,
    source,
    city:    decodeURIComponent(city),
    country,
  })

  return link.target_url
}

/**
 * Récupère les statistiques de clics d'une boutique.
 */
export async function getStoreLinksAnalytics(storeId: string) {
  const supabase = await createClient()

  // Récupérer les liens de cette boutique
  const { data: links } = await supabase
    .from('ShortLink')
    .select(`
      id, code, target_url, clicks, created_at,
      product:Product(name),
      analytics:ClickAnalytics(source, city, country)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  return links
}
