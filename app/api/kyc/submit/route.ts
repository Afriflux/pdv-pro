// ─── app/api/kyc/submit/route.ts ─────────────────────────────────────────────
// Route POST — Soumission du dossier KYC par un vendeur
// Met à jour kyc_status = 'submitted' et notifie l'admin via Telegram

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────────────────────

interface KYCSubmitBody {
  documentType:    string
  fullName:        string
  idCardUrl:       string
  documentBackUrl?: string
  domicileUrl?:    string
}

// ─── POST /api/kyc/submit ─────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentification vendeur
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Parser le body JSON
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body JSON invalide' },
        { status: 400 }
      )
    }

    const { documentType, fullName, idCardUrl, documentBackUrl, domicileUrl }
      = body as KYCSubmitBody

    // 3. Valider les champs obligatoires
    if (!documentType?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le type de document est obligatoire' },
        { status: 400 }
      )
    }
    if (!fullName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le nom complet est obligatoire' },
        { status: 400 }
      )
    }
    if (!idCardUrl?.trim()) {
      return NextResponse.json(
        { success: false, error: "L'URL du document (recto) est obligatoire" },
        { status: 400 }
      )
    }

    // 4. Récupérer le store du vendeur connecté
    const { data: store, error: storeError } = await supabase
      .from('Store')
      .select('id, name')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { success: false, error: 'Boutique introuvable' },
        { status: 404 }
      )
    }

    // 5. Construire le JSON kyc_documents
    const kycDocuments = {
      full_name:        fullName.trim(),
      id_card_url:      idCardUrl.trim(),
      id_card_back_url: documentBackUrl?.trim() ?? null,
      domicile_url:     domicileUrl?.trim()     ?? null,
      submitted_at:     new Date().toISOString(),
    }

    // 6. UPDATE Store — kyc_status = 'submitted'
    const { error: updateError } = await supabase
      .from('Store')
      .update({
        kyc_status:        'submitted',
        kyc_document_type: documentType.trim(),
        id_card_url:       idCardUrl.trim(),
        kyc_documents:     kycDocuments,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', store.id)

    if (updateError) {
      console.error('[KYC /submit] Erreur mise à jour Store:', updateError.message)
      return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    // 7. Notifier le super_admin via Telegram (fire-and-forget)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId        = process.env.TELEGRAM_ADMIN_CHAT_ID

    if (telegramToken && chatId) {
      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id:    chatId,
          text:       `🛡️ *Nouveau dossier KYC soumis*\n\n` +
                      `🏪 Boutique : ${store.name}\n` +
                      `📄 Document : ${documentType}\n` +
                      `👤 Nom : ${fullName.trim()}\n` +
                      `🔗 Valider : https://yayyam.com/admin/kyc`,
          parse_mode: 'Markdown',
        }),
      }).catch(() => {
        // Silencieux — Telegram ne doit jamais bloquer la soumission KYC
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: unknown) {

    console.error('[KYC /submit] Erreur non gérée:', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
