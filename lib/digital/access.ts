'use server'

/**
 * lib/digital/access.ts
 * Server Action : validation d'un token DigitalAccess + journalisation download.
 * Vérifie : token valide, non révoqué, non expiré, quota restant.
 * Incrémente downloads_used + crée un DownloadLog.
 * TypeScript strict — zéro any.
 */

import { headers }       from 'next/headers'
import { createClient }  from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccessStatus =
  | 'ok'
  | 'expired'
  | 'exhausted'
  | 'revoked'
  | 'not_found'

export interface DigitalFile {
  type:            'pdf' | 'audio' | 'zip' | 'link' | 'member' | 'video'
  url:             string
  filename:        string
  size:            number
  bunny_video_id?: string
}

interface RawAccess {
  id:             string
  token:          string
  downloads_used: number
  downloads_max:  number | null
  expires_at:     string | null
  revoked:        boolean
  order_id:       string
  product_id:     string
}

interface RawOrder {
  id:          string
  buyer_name:  string
  buyer_phone: string
  store_id:    string
}

interface RawStore {
  name:     string
  slug:     string
  logo_url: string | null
}

interface RawProduct {
  id:             string
  name:           string
  description:    string | null
  images:         string[]
  digital_files:  DigitalFile[] | null
  license_type:   string | null
  license_notes:  string | null
}

export interface ValidateAccessResult {
  status: AccessStatus
  access: {
    id:             string
    token:          string
    downloads_used: number
    downloads_max:  number | null
    expires_at:     string | null
    revoked:        boolean
    order:   RawOrder & { store: RawStore }
    product: RawProduct
  } | null
}

// ─── Validation token ─────────────────────────────────────────────────────────

/**
 * Valide un token DigitalAccess.
 * NE compte pas un téléchargement — appeler logDownload() pour ça.
 */
export async function validateDigitalToken(
  token: string
): Promise<ValidateAccessResult> {
  const supabase = await createClient()

  const { data: access } = await supabase
    .from('DigitalAccess')
    .select('id, token, downloads_used, downloads_max, expires_at, revoked, order_id, product_id')
    .eq('token', token)
    .single<RawAccess>()

  if (!access) return { status: 'not_found', access: null }
  if (access.revoked) return { status: 'revoked', access: null }
  if (access.expires_at && new Date() > new Date(access.expires_at)) {
    return { status: 'expired', access: null }
  }
  if (
    access.downloads_max !== null &&
    access.downloads_used >= access.downloads_max
  ) {
    return { status: 'exhausted', access: null }
  }

  // Charger commande + boutique
  const { data: orderRaw } = await supabase
    .from('Order')
    .select('id, buyer_name, buyer_phone, store_id, store:Store(name, slug, logo_url)')
    .eq('id', access.order_id)
    .single()

  // Charger produit (inclut les colonnes JSONB ajoutées par SQL)
  const { data: productRaw } = await supabase
    .from('Product')
    .select('id, name, description, images, digital_files, license_type, license_notes')
    .eq('id', access.product_id)
    .single()

  const storeRaw: RawStore = (() => {
    if (!orderRaw) return { name: '', slug: '', logo_url: null }
    const s = (orderRaw as unknown as { store: RawStore | RawStore[] }).store
    return Array.isArray(s) ? (s[0] ?? { name: '', slug: '', logo_url: null }) : s
  })()

  const order: RawOrder & { store: RawStore } = {
    id:          (orderRaw?.id ?? '') as string,
    buyer_name:  (orderRaw?.buyer_name ?? '') as string,
    buyer_phone: (orderRaw?.buyer_phone ?? '') as string,
    store_id:    (orderRaw?.store_id ?? '') as string,
    store:       storeRaw,
  }

  const product: RawProduct = {
    id:            productRaw?.id as string,
    name:          productRaw?.name as string,
    description:   (productRaw?.description as string | null) ?? null,
    images:        (productRaw?.images as string[]) ?? [],
    digital_files: (productRaw?.digital_files as DigitalFile[] | null) ?? null,
    license_type:  (productRaw?.license_type as string | null) ?? null,
    license_notes: (productRaw?.license_notes as string | null) ?? null,
  }

  return {
    status: 'ok',
    access: { ...access, order, product },
  }
}

// ─── Log téléchargement ───────────────────────────────────────────────────────

/**
 * Incrémente downloads_used et enregistre un DownloadLog.
 * Retourne false si quota atteint (race condition).
 */
export async function logDownload(
  digitalAccessId: string
): Promise<boolean> {
  const supabase    = await createClient()
  const headerStore = headers()
  const ip          = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua          = headerStore.get('user-agent') ?? null

  // Re-vérifier le quota avant d'incrémenter
  const { data: current } = await supabase
    .from('DigitalAccess')
    .select('downloads_used, downloads_max, revoked')
    .eq('id', digitalAccessId)
    .single<Pick<RawAccess, 'downloads_used' | 'downloads_max' | 'revoked'>>()

  if (!current) return false
  if (current.revoked) return false
  if (
    current.downloads_max !== null &&
    current.downloads_used >= current.downloads_max
  ) {
    return false
  }

  // Incrémenter
  const { error: incErr } = await supabase
    .from('DigitalAccess')
    .update({ downloads_used: current.downloads_used + 1 })
    .eq('id', digitalAccessId)

  if (incErr) return false

  // Log (non bloquant si ça échoue)
  await supabase.from('DownloadLog').insert({
    digital_access_id: digitalAccessId,
    ip_address:        ip,
    user_agent:        ua,
  })

  return true
}
