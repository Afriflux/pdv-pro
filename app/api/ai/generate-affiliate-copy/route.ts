import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Rate limit Optionnel (pour éviter l'abus de tokens)
    const { productName, productDescription, link, platform } = await req.json()
    
    if (!productName || !link || !platform) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: config } = await supabaseAdmin
      .from('PlatformConfig')
      .select('value')
      .eq('key', 'ANTHROPIC_API_KEY')
      .single<{ value: string }>()

    const apiKey = config?.value || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Configuration API d'Intelligence Artificielle manquante." },
        { status: 503 }
      )
    }

    const client = new Anthropic({ apiKey })

    // Prompt paramétré selon la plateforme choisie
    let platformInstructions = ''
    switch (platform) {
      case 'tiktok':
         platformInstructions = "Script vidéo court (Reels/TikTok). Structure : Accroche choc dynamique (les 3 premières secondes), Présentation rapide du problème et de la solution, Call to action clair enjoignant de 'cliquer sur le lien'. N'écris que le texte parlé et des indications visuelles [entre crochets]."
         break
      case 'facebook':
         platformInstructions = "Post Facebook / Instagram de vente. Utiliser la méthode AIDA courte. Emojis pertinents, texte aéré. Call to action direct avec le lien intégré."
         break
      case 'whatsapp':
         platformInstructions = "Message WhatsApp percutant, très court et direct, formaté avec du gras (*texte*), facile à transférer ou envoyer dans un groupe."
         break
      default:
         platformInstructions = "Texte publicitaire générique, concis et persuasif."
    }

    const systemPrompt = `Tu es un Copywriter Masterclass spécialisé dans le marché du e-commerce africain (Sénégal, Côte d'Ivoire, etc.). 
Ton but est d'écrire un texte ou un script de promotion d'affiliation ULTRA-CONVERTISSEUR qui génère de la FOMO (peur de rater) et de l'urgence, tout en restant naturel.
Règles strictes:
1. Tu dois respecter le format : ${platformInstructions}
2. Tu dois OBLIGATOIREMENT insérer le lien de l'affilié à la fin du texte ou à l'endroit le plus pertinent : ${link}
3. Ne mets pas d'introduction ou de conclusion (ex: "Voici le texte :"), donne UNIQUEMENT le texte utilisable directement par copier-coller.
4. Parle le langage local discrètement si pertinent (un ton très familier, direct, tutoiement chaleureux) ou un vouvoiement très respectueux pour du Facebook.
`

    const userPrompt = `Produit : "${productName}"
Description éventuelle : "${productDescription || 'Pas de description supplémentaire fournie.'}"
Lien à insérer : "${link}"
Plateforme ciblée : ${platform}`

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    })

    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Réponse Claude invalide')
    }

    return NextResponse.json({ result: textContent.text.trim() })

  } catch (err: unknown) {
    console.error('[generate-affiliate-copy]', err)
    return NextResponse.json({ error: 'Une erreur est survenue avec le service IA. Veuillez réessayer.' }, { status: 500 })
  }
}
