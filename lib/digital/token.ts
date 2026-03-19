'use server'

/**
 * lib/digital/token.ts
 * Server Action : génération de tokens d'accès digital sécurisés.
 * Stocke dans la table DigitalAccess (Supabase).
 * Token = SHA-256(orderId + productId + entropy + timestamp)
 * TypeScript strict — zéro any.
 */

import { randomBytes, createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateDigitalAccessParams {
  orderId: string
  productId: string
  /** Nombre max de téléchargements. null = illimité */
  downloadsMax?: number | null
  /** Durée en jours. null = pas d'expiration */
  accessDurationDays?: number | null
}

export interface DigitalAccessResult {
  id: string
  token: string
  /** URL publique → /dl/[token] */
  downloadUrl: string
  expiresAt: Date | null
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function generateSecureToken(orderId: string, productId: string): string {
  const entropy = randomBytes(32).toString('hex')
  const raw     = `${orderId}:${productId}:${entropy}:${Date.now()}`
  return createHash('sha256').update(raw).digest('hex')
}

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * Crée un DigitalAccess avec token SHA-256 unique.
 * À appeler depuis l'IPN de paiement après confirmation.
 */
export async function createDigitalAccess(
  params: CreateDigitalAccessParams
): Promise<DigitalAccessResult> {
  const { orderId, productId, downloadsMax, accessDurationDays } = params
  const supabase = await createClient()

  const token     = generateSecureToken(orderId, productId)
  const expiresAt = accessDurationDays != null
    ? new Date(Date.now() + accessDurationDays * 86_400_000)
    : null

  const { data, error } = await supabase
    .from('DigitalAccess')
    .insert({
      order_id:       orderId,
      product_id:     productId,
      token,
      downloads_used: 0,
      downloads_max:  downloadsMax ?? null,
      expires_at:     expiresAt?.toISOString() ?? null,
      revoked:        false,
    })
    .select('id')
    .single()

  if (error) throw new Error('Erreur création DigitalAccess: ' + error.message)

  const baseUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pdvpro.com'
  const downloadUrl = `${baseUrl}/dl/${token}`

  return {
    id:          data.id as string,
    token,
    downloadUrl,
    expiresAt,
  }
}

/**
 * Révoque un accès digital (litige, remboursement...).
 */
export async function revokeDigitalAccess(accessId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('DigitalAccess')
    .update({ revoked: true })
    .eq('id', accessId)

  if (error) throw new Error('Erreur révocation: ' + error.message)
}

/**
 * Prolonge la durée d'un accès (jours supplémentaires).
 */
export async function extendDigitalAccess(
  accessId: string,
  extraDays: number
): Promise<void> {
  const supabase = await createClient()

  const { data, error: fetchErr } = await supabase
    .from('DigitalAccess')
    .select('expires_at')
    .eq('id', accessId)
    .single()

  if (fetchErr || !data) throw new Error('Accès introuvable: ' + accessId)

  const base     = data.expires_at ? new Date(data.expires_at as string) : new Date()
  const newExpiry = new Date(base.getTime() + extraDays * 86_400_000)

  const { error } = await supabase
    .from('DigitalAccess')
    .update({ expires_at: newExpiry.toISOString() })
    .eq('id', accessId)

  if (error) throw new Error('Erreur prolongation: ' + error.message)
}
