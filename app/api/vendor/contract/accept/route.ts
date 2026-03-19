// ─── app/api/vendor/contract/accept/route.ts ─────────────────────────────────
// Route POST — Accepter le contrat partenaire vendeur PDV Pro
// Body : { storeId: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/brevo/brevo-service'

// ─── HTML email de confirmation ───────────────────────────────────────────────

function buildContractConfirmationEmail(params: {
  vendorName: string
  storeName:  string
  signedAt:   string
}): string {
  const { vendorName, storeName, signedAt } = params
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    : 'https://pdvpro.com/dashboard'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contrat PDV Pro signé</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header émeraude -->
          <tr>
            <td style="background:linear-gradient(135deg,#0D5C4A,#0F7A60);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                PDV Pro
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.7);font-weight:500;">
                Votre plateforme de vente en ligne
              </p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:40px;">

              <!-- Badge succès -->
              <div style="text-align:center;margin-bottom:28px;">
                <span style="font-size:48px;">✅</span>
              </div>

              <!-- Titre -->
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1A1A1A;text-align:center;">
                Félicitations ${vendorName.split(' ')[0]} !
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#6B7280;text-align:center;line-height:1.6;">
                Votre contrat partenaire PDV Pro a été signé avec succès.
              </p>

              <!-- Résumé signature -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#FAFAF7;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%">
                      <tr>
                        <td style="padding:6px 0;font-size:12px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;">
                          Boutique
                        </td>
                        <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1A1A1A;text-align:right;">
                          ${storeName}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="height:1px;background:#E5E7EB;padding:0;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;">
                          Date de signature
                        </td>
                        <td style="padding:6px 0;font-size:14px;font-weight:700;color:#0F7A60;text-align:right;">
                          ${signedAt}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="height:1px;background:#E5E7EB;padding:0;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;">
                          Statut
                        </td>
                        <td style="padding:6px 0;text-align:right;">
                          <span style="background:#D1FAE5;color:#065F46;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;">
                            Actif ✓
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Ce qui est activé -->
              <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#065F46;text-transform:uppercase;letter-spacing:0.05em;">
                  🎉 Votre espace est maintenant actif
                </p>
                <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#047857;line-height:1.8;">
                  <li>Vos clients peuvent finaliser leurs achats</li>
                  <li>Vos retraits sont disponibles (min. 5 000 FCFA)</li>
                  <li>Commissions dégressives PDV Pro appliquées automatiquement</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${dashboardUrl}"
                  style="display:inline-block;background:linear-gradient(135deg,#0D5C4A,#0F7A60);color:#ffffff;
                    text-decoration:none;font-size:15px;font-weight:800;padding:14px 32px;
                    border-radius:12px;letter-spacing:-0.2px;">
                  Accéder à mon dashboard →
                </a>
              </div>

              <!-- Note légale -->
              <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;line-height:1.6;">
                Ce contrat est archivé dans vos paramètres PDV Pro.<br/>
                En cas de question, contactez-nous à
                <a href="mailto:support@pdvpro.com" style="color:#0F7A60;">support@pdvpro.com</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                © ${new Date().getFullYear()} PDV Pro — Plateforme SaaS e-commerce pour vendeurs africains<br/>
                Dakar, Sénégal
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

// ─── Route POST ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth vendeur
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Parser le body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Body JSON invalide' }, { status: 400 })
    }

    const { storeId } = body as { storeId?: string }

    if (!storeId?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Champ requis : storeId' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 3. Vérifier que le store appartient à ce vendeur (sécurité)
    const { data: store, error: storeErr } = await supabaseAdmin
      .from('Store')
      .select('id, name, user_id, contract_accepted, contract_accepted_at')
      .eq('id', storeId)
      .single()

    type StoreRow = {
      id: string
      name: string
      user_id: string
      contract_accepted: boolean
      contract_accepted_at: string | null
    }

    if (storeErr || !store) {
      return NextResponse.json({ success: false, error: 'Boutique introuvable' }, { status: 404 })
    }

    const s = store as StoreRow

    if (s.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    // 4. Idempotent — déjà signé
    if (s.contract_accepted) {
      return NextResponse.json(
        { success: true, already_signed: true },
        { status: 200 }
      )
    }

    // 5. UPDATE Store
    const signedAt = new Date().toISOString()
    const { error: updateErr } = await supabaseAdmin
      .from('Store')
      .update({
        contract_accepted:    true,
        contract_accepted_at: signedAt,
        updated_at:           signedAt,
      })
      .eq('id', storeId)

    if (updateErr) {
      console.error('[vendor/contract/accept] Erreur UPDATE:', updateErr.message)
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
    }

    // 6. Récupérer email + nom vendeur
    const { data: userData } = await supabaseAdmin
      .from('User')
      .select('name, email')
      .eq('id', user.id)
      .single()

    type UserRow = { name: string; email: string }
    const vendor = userData as UserRow | null

    // 7. Envoyer email de confirmation (fire-and-forget)
    if (vendor?.email) {
      const signedAtFormatted = new Date(signedAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })

      void sendTransactionalEmail({
        to:          [{ email: vendor.email, name: vendor.name ?? s.name }],
        subject:     '✅ Votre contrat PDV Pro est signé !',
        htmlContent: buildContractConfirmationEmail({
          vendorName: vendor.name ?? 'Vendeur',
          storeName:  s.name,
          signedAt:   signedAtFormatted,
        }),
      })
    }

    console.log(`[vendor/contract/accept] ✅ Contrat signé — store ${storeId}`)

    return NextResponse.json(
      { success: true, already_signed: false },
      { status: 200 }
    )

  } catch (err: unknown) {
    console.error('[vendor/contract/accept]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
