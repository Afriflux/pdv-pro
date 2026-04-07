import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createEmailCampaign } from '@/lib/brevo/brevo-service'

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

    const { prompt, targetLists } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt manquant (aucune consigne renseignée)' }, { status: 400 })
    }

    // Récupération de la clé API Anthropic
    const integrationRecord = await prisma.integrationKey.findUnique({
      where: { key: 'ANTHROPIC_API_KEY' }
    })
    const apiKey = integrationRecord?.value || process.env.ANTHROPIC_API_KEY

    // En environnement local ou sans réseau test, on autorise exceptionnellement le placeholder si pas de clé
    // Mais en production, il faut une vraie clé
    if (!apiKey) {
       // Au lieu d'échouer, on peut soit bloquer soit générer du contenu mock si debug mock
       return NextResponse.json({ error: "La clé API Claude (ANTHROPIC_API_KEY) n'est pas configurée dans /admin/integrations." }, { status: 403 })
    }

    const client = new Anthropic({ apiKey })

    const systemPrompt = `Tu es un expert mondial en copywriting d'emails marketing (façon Apple ou Nike).
Ta mission est de générer un e-mail attractif en fonction de la demande de l'utilisateur.
Règles strictes de sortie :
1. Tu dois retourner UNIQUEMENT un objet JSON valide. AUNCUN TEXTE AVANT NI APRÈS.
2. Le JSON doit avoir la structure exacte suivante :
{
  "subject": "L'objet de l'email, ultra accrocheur",
  "htmlContent": "<div style='font-family:sans-serif; ...'>Le corps en HTML complet avec styles en ligne, beau et responsive</div>"
}
3. Le design de l'email (htmlContent) doit être très beau, aéré, utiliser des ombres subtiles, des boutons modernes avec des padding généreux. Ne montre pas d'explication, juste le JSON.`

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Demande de l'administrateur : "${prompt}" \nRenvoie uniquement le JSON attendu.` }]
    })

    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error("L'IA n'a pas renvoyé de réponse exploitable.")
    }

    // Parse AI JSON
    let aiResult
    try {
      // Nettoyage au cas où Claude ajoute des backticks markdown
      const cleanJson = textContent.text.replace(/```json/g, '').replace(/```/g, '').trim()
      aiResult = JSON.parse(cleanJson)
    } catch (e) {
      console.error("[generate-email] Erreur de parsing JSON:", textContent.text)
      throw new Error("L'IA a généré un format invalide.")
    }

    // Préparation pour Brevo
    // Name de la campagne = "IA : [Sujet]" (coupé à 30 chars pour rester propre)
    const campaignName = "IA: " + aiResult.subject.substring(0, 30)

    const payload: any = {
      name: campaignName,
      subject: aiResult.subject,
      htmlContent: aiResult.htmlContent,
      sender: { name: 'Yayyam', email: 'noreply@yayyam.com' }
    }

    // Ajout des destinataires seulement si demandé
    if (targetLists && Array.isArray(targetLists) && targetLists.length > 0) {
      payload.recipients = { listIds: targetLists.map(v => Number(v)) }
    } else {
      // Pour forcer l'état Draft totalement vierge (Avis Utilisateur) sans erreur d'API, 
      // parfois Brevo réclame soit un destinataire soit la campagne part en suspension. 
      // Mais omettre recipients génère généralement un brouillon vierge valide.
    }

    const campaignId = await createEmailCampaign(payload)

    if (!campaignId) {
       throw new Error("Erreur inattendue lors de la sauvegarde du brouillon sur Brevo.")
    }

    return NextResponse.json({ 
       success: true, 
       campaignId, 
       message: 'Campagne générée et brouillon sauvegardé avec succès !' 
    })

  } catch (error: unknown) {
    console.error('[API Generate Email] Erreur:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
