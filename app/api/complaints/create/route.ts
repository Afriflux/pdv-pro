import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── POST /api/complaints/create ─────────────────────────────────────────────
// Crée un signalement (plainte) dans la table Complaint.
// Auth optionnelle : si connecté, reporter_id = user.id.
//
// Body :
//   store_id?      string
//   product_id?    string
//   type           'plagiat' | 'fraude' | 'contenu_inapproprie' | 'autre'
//   description    string (obligatoire)
//   evidence_url?  string
// ─────────────────────────────────────────────────────────────────────────────

const VALID_TYPES = new Set(['plagiat', 'fraude', 'contenu_inapproprie', 'autre'])

interface ComplaintBody {
  store_id?:    string
  product_id?:  string
  type:         string
  description:  string
  evidence_url?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ComplaintBody
    const { store_id, product_id, type, description, evidence_url } = body

    // Validation : type et description obligatoires
    if (!type || !VALID_TYPES.has(type)) {
      return NextResponse.json(
        { error: `Type invalide. Valeurs acceptées : plagiat, fraude, contenu_inapproprie, autre.` },
        { status: 400 }
      )
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: 'La description est obligatoire.' }, { status: 400 })
    }

    // Auth optionnelle — reporter_id si connecté
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const reporterId = user?.id ?? null

    const supabaseAdmin = createAdminClient()
    const now = new Date().toISOString()

    // Insérer dans la table Complaint
    const { data: complaint, error: insertError } = await supabaseAdmin
      .from('Complaint')
      .insert({
        store_id:    store_id   ?? null,
        product_id:  product_id ?? null,
        reporter_id: reporterId,
        type,
        description: description.trim(),
        evidence_url: evidence_url?.trim() || null,
        status:      'pending',
        created_at:  now,
        updated_at:  now,
      })
      .select('id')
      .single<{ id: string }>()

    if (insertError) throw insertError

    // Notification Telegram au super_admin (si configuré dans PlatformConfig)
    const { data: botConfig } = await supabaseAdmin
      .from('PlatformConfig')
      .select('value')
      .eq('key', 'TELEGRAM_BOT_TOKEN')
      .single<{ value: string }>()

    const { data: chatConfig } = await supabaseAdmin
      .from('PlatformConfig')
      .select('value')
      .eq('key', 'TELEGRAM_ADMIN_CHAT_ID')
      .single<{ value: string }>()

    if (botConfig?.value && chatConfig?.value) {
      const message = [
        `🚨 *Nouveau signalement PDV Pro*`,
        `Type : \`${type}\``,
        `${store_id   ? `Boutique : \`${store_id}\`` : ''}`,
        `${product_id ? `Produit : \`${product_id}\`` : ''}`,
        `Description : ${description.trim().slice(0, 200)}${description.trim().length > 200 ? '...' : ''}`,
        ``,
        `→ Voir : https://pdvpro.com/admin/complaints/${complaint?.id ?? ''}`,
      ].filter(Boolean).join('\n')

      // Fire and forget — ne pas bloquer la réponse si Telegram échoue
      fetch(`https://api.telegram.org/bot${botConfig.value}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id:    chatConfig.value,
          text:       message,
          parse_mode: 'Markdown',
        }),
      }).catch(() => {
        // Notification Telegram non critique — on ignore l'erreur
      })
    }

    return NextResponse.json({ success: true, id: complaint?.id })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Complaints Create] Erreur:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
