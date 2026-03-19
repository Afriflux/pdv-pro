// ─── app/api/brevo/campaign/route.ts ────────────────────────────────────────
// Route API gestion des campagnes email Brevo
// GET  → lister les campagnes (auth vendeur requis)
// POST → créer une nouvelle campagne (auth vendeur requis)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listEmailCampaigns, createEmailCampaign } from '@/lib/brevo/brevo-service'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreateCampaignBody {
  subject:      string
  htmlContent:  string
  listId:       number
  scheduledAt?: string
}

// ─── Helper : récupérer l'utilisateur authentifié ─────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase: null, user: null }
  }

  return { supabase, user }
}

// ─── GET /api/brevo/campaign ─────────────────────────────────────────────────
// Liste toutes les campagnes Brevo du compte
// Requiert : utilisateur connecté (vendeur)

export async function GET(): Promise<NextResponse> {
  try {
    // 1. Vérifier l'authentification
    const { user } = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Récupérer les campagnes depuis Brevo
    const campaigns = await listEmailCampaigns()

    return NextResponse.json(
      { success: true, campaigns },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[Brevo /campaign GET] Erreur:', message)

    return NextResponse.json(
      { success: false, error: message, campaigns: [] },
      { status: 500 }
    )
  }
}

// ─── POST /api/brevo/campaign ────────────────────────────────────────────────
// Crée une nouvelle campagne email Brevo
// Requiert : utilisateur connecté (vendeur)
// body : { subject, htmlContent, listId, scheduledAt? }

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Vérifier l'authentification
    const { supabase, user } = await getAuthenticatedUser()

    if (!user || !supabase) {
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

    const { subject, htmlContent, listId, scheduledAt } = body as CreateCampaignBody

    // 3. Valider les champs obligatoires
    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le sujet est obligatoire' },
        { status: 400 }
      )
    }

    if (!htmlContent || !htmlContent.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le contenu HTML est obligatoire' },
        { status: 400 }
      )
    }

    if (!listId || typeof listId !== 'number' || listId <= 0) {
      return NextResponse.json(
        { success: false, error: 'listId doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Valider scheduledAt si fourni (doit être dans le futur)
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt)
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'scheduledAt est une date invalide' },
          { status: 400 }
        )
      }
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { success: false, error: 'scheduledAt doit être dans le futur' },
          { status: 400 }
        )
      }
    }

    // 4. Récupérer les informations de la boutique du vendeur connecté
    const { data: store } = await supabase
      .from('Store')
      .select('name, slug')
      .eq('user_id', user.id)
      .single()

    // 5. Construire le nom de la campagne et les infos sender
    const sender = {
      name:  store?.name ?? 'PDV Pro',
      email: 'noreply@pdvpro.com',
    }

    const campaignName = `[${store?.name ?? 'PDV Pro'}] ${subject.trim()} — ${new Date().toLocaleDateString('fr-FR')}`

    // 6. Créer la campagne dans Brevo
    const campaignId = await createEmailCampaign({
      name:        campaignName,
      subject:     subject.trim(),
      htmlContent: htmlContent.trim(),
      sender,
      recipients:  { listIds: [listId] },
      ...(scheduledAt ? { scheduledAt } : {}),
    })

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Échec de la création de la campagne dans Brevo' },
        { status: 503 }
      )
    }

    console.log(
      `[Brevo /campaign POST] Campagne créée : id=${campaignId} store=${store?.name} listId=${listId}`
    )

    return NextResponse.json(
      {
        success:    true,
        campaignId: String(campaignId),
        name:       campaignName,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[Brevo /campaign POST] Erreur:', message)

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
