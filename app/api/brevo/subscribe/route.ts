// ─── app/api/brevo/subscribe/route.ts ───────────────────────────────────────
// Route API d'inscription à la newsletter d'une boutique
// POST body : { email, storeName, storeId, listId? }
// 1. Valider email
// 2. Créer/mettre à jour le contact Brevo avec attribution boutique
// 3. Envoyer un email de confirmation d'abonnement
// 4. Retourner { success: true }

import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateContact, sendTransactionalEmail } from '@/lib/brevo/brevo-service'

// ─── ID liste Brevo par défaut pour les newsletters boutiques ─────────────────
// Liste 1 = acheteurs, Liste 2 = vendeurs, Liste 3 = newsletters boutiques
const DEFAULT_NEWSLETTER_LIST_ID = 3

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubscribeBody {
  email:     string
  storeName: string
  storeId:   string
  listId?:   number
}

// ─── Template HTML de confirmation d'abonnement ───────────────────────────────

function buildConfirmationEmail(storeName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Yayyam</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAF7;font-family:Arial,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#FAFAF7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#0F7A60;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:26px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px;">Yayyam</h1>
              <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;">Plateforme de vente africaine</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 32px;text-align:center;">
              <p style="font-size:40px;margin:0 0 16px;">🎉</p>
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#0F7A60;">Abonnement confirmé !</h2>
              <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
                Vous êtes désormais abonné(e) aux offres et nouveautés de<br/>
                <strong style="color:#0F7A60;font-size:17px;">« ${storeName} »</strong>
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#666666;line-height:1.6;">
                Vous recevrez en avant-première les promotions, nouveaux produits et offres exclusives de cette boutique.
              </p>

              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background-color:#0F7A60;">
                    <a href="${appUrl}/boutiques" target="_blank"
                      style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:8px;font-family:Arial,sans-serif;">
                      Découvrir d'autres boutiques
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#F4F4F0;padding:20px 32px;text-align:center;border-top:1px solid #E8E8E4;">
              <p style="margin:0;font-size:12px;color:#888888;">© Yayyam · Tous droits réservés</p>
              <p style="margin:6px 0 0;font-size:11px;color:#AAAAAA;">
                <a href="${appUrl}/unsubscribe" style="color:#0F7A60;text-decoration:underline;">Se désabonner</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── POST /api/brevo/subscribe ────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parser le body JSON
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body JSON invalide' },
        { status: 400 }
      )
    }

    const { email, storeName, storeId, listId } = body as SubscribeBody

    // 2. Valider les champs obligatoires
    if (!email || !storeName || !storeId) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants : email, storeName, storeId' },
        { status: 400 }
      )
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    // 3. Résoudre l'ID de liste cible
    // Priorité : listId fourni dans le body → fallback liste par défaut (3)
    const targetListId =
      typeof listId === 'number' && listId > 0
        ? listId
        : DEFAULT_NEWSLETTER_LIST_ID

    // 4. Créer / mettre à jour le contact Brevo avec attribution boutique
    const contactAttributes: Record<string, string | number | boolean> = {
      BOUTIQUE:    storeName,
      STORE_ID:    storeId,
      SOURCE:      'newsletter_boutique',
    }

    // Exécuter contact + email de confirmation en parallèle
    const [contactResult, emailResult] = await Promise.allSettled([
      createOrUpdateContact(
        email.trim(),
        contactAttributes,
        [targetListId]
      ),
      sendTransactionalEmail({
        to:          [{ email: email.trim() }],
        subject:     `Vous êtes abonné(e) aux offres de ${storeName} ! 🎉`,
        htmlContent: buildConfirmationEmail(storeName),
        sender:      { name: `${storeName} via Yayyam`, email: 'noreply@yayyam.com' },
      }),
    ])

    // 5. Logging sans bloquer
    if (contactResult.status === 'rejected') {
      console.error('[Brevo /subscribe] Échec création contact:', contactResult.reason)
    }
    if (emailResult.status === 'rejected') {
      console.error('[Brevo /subscribe] Échec email confirmation:', emailResult.reason)
    }

    const contactOk = contactResult.status === 'fulfilled' && contactResult.value === true
    const emailOk   = emailResult.status === 'fulfilled' && emailResult.value === true

    // 6. Si le contact n'a pas pu être créé → retourner une erreur significative
    if (!contactOk) {
      return NextResponse.json(
        { success: false, error: 'Impossible de créer le contact. Vérifiez la clé API Brevo.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: true, contactCreated: contactOk, emailSent: emailOk },
      { status: 200 }
    )
  } catch (error: unknown) {

    console.error('[Brevo /subscribe] Erreur non gérée:', error)

    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
