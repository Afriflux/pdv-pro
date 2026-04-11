/**
 * /app/api/telegram/link/route.ts
 * Gestion de la liaison et déliaison des comptes Telegram.
 * Permet de générer des tokens temporaires et de réinitialiser la connexion.
 * 
 * Sécurité : Authentification via Supabase Auth.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialisation du client Supabase Admin
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- Helpers ---

/**
 * Génère un token cryptographiquement sécurisé de X caractères (Alphanumérique MAJ).
 */
function generateToken(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(bytes[i] % chars.length)
  }
  return result
}

// --- Handler POST (Génération de Token) ---

export async function POST() {
  try {
    // 1. Authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Récupération de la boutique (Store)
    const { data: store, error: storeError } = await supabaseAdmin
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    const now = new Date()

    // 3. Nettoyage des tokens expirés pour ce store
    await supabaseAdmin
      .from('telegram_link_tokens')
      .delete()
      .eq('store_id', store.id)
      .lt('expires_at', now.toISOString())

    // 4. Génération d'un nouveau token unique
    let token = generateToken()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 5) {
      const { data: existing } = await supabaseAdmin
        .from('telegram_link_tokens')
        .select('id')
        .eq('token', token)
        .single()
      
      if (!existing) {
        isUnique = true
      } else {
        token = generateToken()
        attempts++
      }
    }

    // 5. Enregistrement du token (Valable 15 minutes)
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000)
    
    const { error: insertError } = await supabaseAdmin
      .from('telegram_link_tokens')
      .insert({
        store_id: store.id,
        token: token,
        expires_at: expiresAt.toISOString(),
        used_at: null
      })

    if (insertError) {
      console.error('[Telegram Link] Erreur insertion token:', insertError)
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    // 6. Retour des infos
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'Yayyam_bot'
    const botUrl = `https://t.me/${botUsername}?start=${token}`

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      botUrl
    })

  } catch (error) {
    console.error('[Telegram Link] Erreur POST:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}

// --- Handler DELETE (Déliaison) ---

export async function DELETE() {
  try {
    // 1. Authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Récupération de la boutique
    const { data: store, error: storeError } = await supabaseAdmin
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    // 3. Suppression du chat_id Telegram
    const { error: updateError } = await supabaseAdmin
      .from('Store')
      .update({ telegram_chat_id: null })
      .eq('id', store.id)

    if (updateError) {
      console.error('[Telegram Link] Erreur déliaison:', updateError)
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Telegram Link] Erreur DELETE:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
