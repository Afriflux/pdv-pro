import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createEmailCampaign } from '@/lib/brevo/brevo-service'

function getYayyamHtmlTemplate(subject: string, htmlContent: string) {
  // Simple conversion of basic text linebreaks to <br> if no html tags are detected,
  // but generally assume user inputs simple text or basic html
  const formattedContent = htmlContent.replace(/\n/g, '<br/>')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#FAFAF7; font-family:sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAFAF7;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF; border-radius:24px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.05); max-width: 100%;">
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #012928; color: white;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Yayyam<span style="color:#0F7A60">.</span></h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px; color: #1F2937; font-size: 16px; line-height: 1.6;">
                  ${formattedContent}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 30px; text-align: center; background-color: #F8F9FA; color: #9CA3AF; font-size: 12px; border-top: 1px solid #F3F4F6;">
                  <p style="margin: 0;">© ${new Date().getFullYear()} Yayyam. Tous droits réservés.</p>
                  <p style="margin: 5px 0 0 0;"><a href="{{ unsubscribe }}" style="color: #0F7A60; text-decoration: none; font-weight: bold;">Se désabonner</a></p>
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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, subject, htmlContent, targetLists } = await req.json()
    
    if (!name || !subject || !htmlContent) {
      return NextResponse.json({ error: 'Le nom de campagne, le sujet et le contenu sont requis.' }, { status: 400 })
    }

    const finalHtml = getYayyamHtmlTemplate(subject, htmlContent)

    const payload: any = {
      name: name.substring(0, 50),
      subject: subject,
      htmlContent: finalHtml,
      sender: { name: 'Yayyam', email: 'noreply@yayyam.com' }
    }

    if (targetLists && Array.isArray(targetLists) && targetLists.length > 0) {
      payload.recipients = { listIds: targetLists.map(v => Number(v)) }
    }

    const campaignId = await createEmailCampaign(payload)

    if (!campaignId) {
       throw new Error("Erreur lors de la création de la campagne sur Brevo.")
    }

    return NextResponse.json({ 
       success: true, 
       campaignId, 
       message: 'Campagne (brouillon) créée avec succès sur Brevo !' 
    })

  } catch (error: unknown) {
    console.error('[API Create Manual Email] Erreur:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
