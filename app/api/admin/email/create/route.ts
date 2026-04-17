import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createEmailCampaign, sendCampaignNow, getBrevoSenders } from '@/lib/brevo/brevo-service'

function getYayyamHtmlTemplate(subject: string, htmlContent: string) {
  const formattedContent = htmlContent.replace(/\n/g, '<br/>')
  const year = new Date().getFullYear()
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
    </head>
    <body style="margin:0; padding:0; background-color:#F0F2F5; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased;">
      
      <!-- Preheader (texte invisible pour aperçu boîte mail) -->
      <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
        ${subject} — Yayyam, la plateforme e-commerce #1 en Afrique francophone.
      </div>

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F0F2F5;">
        <tr>
          <td align="center" style="padding: 32px 16px;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%;">
              
              <!-- ═══════════════ HEADER PREMIUM ═══════════════ -->
              <tr>
                <td style="background: linear-gradient(135deg, #012928 0%, #0A4138 100%); border-radius: 24px 24px 0 0; padding: 40px 40px 32px; text-align: center;">
                  <!-- Logo Texte -->
                  <h1 style="margin:0; font-size:32px; font-weight:900; color:#FFFFFF; letter-spacing:-1px;">
                    Yayyam<span style="color:#34D399;">.</span>
                  </h1>
                  <p style="margin:8px 0 0; font-size:12px; color:#6EE7B7; font-weight:700; text-transform:uppercase; letter-spacing:3px;">
                    E-Commerce &middot; Afrique
                  </p>
                </td>
              </tr>

              <!-- ═══════════════ BANDEAU SUJET ═══════════════ -->
              <tr>
                <td style="background-color:#0F7A60; padding:16px 40px; text-align:center;">
                  <p style="margin:0; font-size:14px; font-weight:700; color:#FFFFFF; letter-spacing:0.5px;">
                    ${subject}
                  </p>
                </td>
              </tr>

              <!-- ═══════════════ CONTENU PRINCIPAL ═══════════════ -->
              <tr>
                <td style="background-color:#FFFFFF; padding: 44px 40px 36px; color:#1F2937; font-size:15px; line-height:1.75;">
                  ${formattedContent}
                </td>
              </tr>

              <!-- ═══════════════ SÉPARATEUR VISUEL ═══════════════ -->
              <tr>
                <td style="background-color:#FFFFFF; padding:0 40px;">
                  <div style="height:1px; background: linear-gradient(90deg, transparent, #E5E7EB, transparent);"></div>
                </td>
              </tr>

              <!-- ═══════════════ SIGNATURE ═══════════════ -->
              <tr>
                <td style="background-color:#FFFFFF; padding: 28px 40px 36px;">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <!-- Barre verte verticale -->
                      <td style="width:4px; background-color:#0F7A60; border-radius:4px;" valign="top"></td>
                      <td style="padding-left:16px;">
                        <p style="margin:0; font-size:15px; font-weight:700; color:#1F2937;">
                          L'équipe Yayyam
                        </p>
                        <p style="margin:4px 0 0; font-size:13px; color:#6B7280; font-weight:500;">
                          La plateforme e-commerce pensée pour l'Afrique 🌍
                        </p>
                        <p style="margin:10px 0 0;">
                          <a href="https://yayyam.com" style="display:inline-block; background-color:#0F7A60; color:#FFFFFF; font-size:12px; font-weight:800; text-decoration:none; padding:8px 20px; border-radius:8px; letter-spacing:0.5px;">
                            Visiter yayyam.com →
                          </a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ═══════════════ BANDE RÉSEAUX SOCIAUX ═══════════════ -->
              <tr>
                <td style="background-color:#FAFAF7; padding:24px 40px; text-align:center; border-top:1px solid #F3F4F6;">
                  <p style="margin:0 0 12px; font-size:11px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:2px;">
                    Suivez-nous
                  </p>
                  <table border="0" cellspacing="0" cellpadding="0" align="center">
                    <tr>
                      <td style="padding:0 8px;">
                        <a href="https://www.instagram.com/yayyam.sn/" style="text-decoration:none; font-size:22px;">📸</a>
                      </td>
                      <td style="padding:0 8px;">
                        <a href="https://www.tiktok.com/@yayyam.sn" style="text-decoration:none; font-size:22px;">🎵</a>
                      </td>
                      <td style="padding:0 8px;">
                        <a href="https://www.facebook.com/yayyam.sn" style="text-decoration:none; font-size:22px;">📘</a>
                      </td>
                      <td style="padding:0 8px;">
                        <a href="https://wa.me/221782057083" style="text-decoration:none; font-size:22px;">💬</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ═══════════════ FOOTER LÉGAL ═══════════════ -->
              <tr>
                <td style="background-color:#012928; padding:28px 40px; text-align:center; border-radius: 0 0 24px 24px;">
                  <p style="margin:0; font-size:12px; color:#6EE7B7; font-weight:600;">
                    © ${year} Yayyam — Tous droits réservés.
                  </p>
                  <p style="margin:6px 0 0; font-size:11px; color:#34D399;">
                    Dakar, Sénégal 🇸🇳
                  </p>
                  <p style="margin:16px 0 0;">
                    <a href="{{ unsubscribe }}" style="color:#FFFFFF; text-decoration:underline; font-size:11px; font-weight:600;">
                      Se désabonner
                    </a>
                    <span style="color:#0F7A60; margin:0 8px;">|</span>
                    <a href="https://yayyam.com/politique-confidentialite" style="color:#FFFFFF; text-decoration:underline; font-size:11px; font-weight:600;">
                      Politique de confidentialité
                    </a>
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export async function POST(req: Request) {
  try {
    console.log('[API Create Email] Début de la requête...')
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* readonly in routes */ }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { name, subject, htmlContent, targetLists } = await req.json()
    
    if (!name || !subject || !htmlContent) {
      return NextResponse.json({ error: 'Le nom, le sujet et le contenu sont requis.' }, { status: 400 })
    }

    const finalHtml = getYayyamHtmlTemplate(subject, htmlContent)

    // ── Étape 1 : Trouver un expéditeur vérifié sur Brevo ──
    const senders = await getBrevoSenders()
    const activeSender = senders.find(s => s.active) || senders[0]
    
    if (!activeSender) {
      console.error('[API Create Email] ❌ Aucun expéditeur vérifié trouvé sur Brevo')
      return NextResponse.json({ 
        error: 'Aucun expéditeur vérifié sur Brevo. Allez dans Brevo → Paramètres → Expéditeurs pour en créer un.' 
      }, { status: 400 })
    }

    console.log(`[API Create Email] Expéditeur: ${activeSender.name} <${activeSender.email}>`)

    // ── Étape 2 : Créer le brouillon sur Brevo ──
    console.log('[API Create Email] Étape 2 — Création du brouillon sur Brevo...')
    
    const payload: any = {
      name,
      subject,
      htmlContent: finalHtml,
      sender: { name: activeSender.name || 'Yayyam', email: activeSender.email }
    }

    if (targetLists && Array.isArray(targetLists) && targetLists.length > 0) {
      payload.recipients = { listIds: targetLists.map((v: number) => Number(v)) }
    }

    const campaignId = await createEmailCampaign(payload)

    if (!campaignId) {
      console.error('[API Create Email] ❌ Échec de la création du brouillon')
      return NextResponse.json({ 
        error: 'Impossible de créer la campagne sur Brevo. Vérifiez que votre clé API et l\'email expéditeur sont configurés.' 
      }, { status: 500 })
    }

    console.log(`[API Create Email] ✅ Brouillon créé — ID: ${campaignId}`)

    // ── Étape 3 : Envoyer immédiatement si des listes sont sélectionnées ──
    if (targetLists && targetLists.length > 0) {
      console.log(`[API Create Email] Étape 3 — Envoi immédiat vers ${targetLists.length} liste(s)...`)
      
      const sent = await sendCampaignNow(campaignId)
      
      if (!sent) {
        console.error(`[API Create Email] ⚠️ Brouillon créé (ID: ${campaignId}) mais envoi échoué`)
        return NextResponse.json({ 
          success: true, 
          campaignId, 
          message: `Campagne créée (ID: ${campaignId}) mais l'envoi a échoué. La campagne est sauvegardée en brouillon sur Brevo.`
        })
      }

      console.log(`[API Create Email] 🚀 Campagne ${campaignId} envoyée avec succès !`)
      return NextResponse.json({ 
        success: true, 
        campaignId, 
        message: `🚀 Campagne envoyée avec succès vers ${targetLists.length} liste(s) !`
      })
    }

    // Pas de listes = brouillon seulement
    return NextResponse.json({ 
      success: true, 
      campaignId, 
      message: `Campagne sauvegardée en brouillon (ID: ${campaignId}). Aucune liste sélectionnée, l'envoi n'a pas été déclenché.`
    })

  } catch (error: unknown) {
    console.error('[API Create Email] ❌ Erreur:', error)
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
