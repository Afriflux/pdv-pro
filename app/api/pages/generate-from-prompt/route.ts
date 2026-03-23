import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GeneratePromptBody {
  prompt: string
  store_id: string
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>
}

export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count: genCount } = await supabase
    .from('AIGenerationLog')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'prompt_generation')
    .gte('created_at', oneHourAgo)

  if ((genCount ?? 0) >= 50) {
    return NextResponse.json({ error: 'Limite atteinte (50 créations/h). Réessayez.' }, { status: 429 })
  }

  await supabase.from('AIGenerationLog').insert({ user_id: user.id, type: 'prompt_generation' })

  let body: GeneratePromptBody
  try {
    body = (await req.json()) as GeneratePromptBody
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { prompt, store_id } = body
  if (!prompt || !store_id) {
    return NextResponse.json({ error: 'Prompt manquant' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API Claude non configurée.' }, { status: 503 })
  }

  const systemPrompt = `Tu es un expert mondial en "Funnel Building" et Copywriting e-commerce. Ta cible principale est l'Afrique francophone.
L'utilisateur te décrit un produit/service. Tu dois Rédiger une page de vente intégrale et l'exporter STRICTEMENT au format JSON.

Structure OBLIGATOIRE du JSON:
{
  "title": "Titre interne de la page",
  "slug": "url-optimisee",
  "template": "ecommerce", // choisir parmi: beauty, ebook, formation, food, fashion, services, coaching, ecommerce, music, event
  "sections": [
    { "type": "hero", "title": "Promesse principale puissante", "subtitle": "Explication claire et bénéfice", "cta": "Bouton d'action" },
    { "type": "benefits", "items": ["Avantage 1", "Avantage 2", "Avantage 3"] },
    { "type": "text", "text": "Texte persuasif qui adresse la douleur du client et présente la solution." },
    { "type": "testimonials", "items": [{ "name": "Prénom Local", "text": "Avis très enthousiaste", "rating": 5 }] },
    { "type": "faq", "items": [{ "q": "Question 1", "a": "Réponse" }, {"q": "Question 2", "a": "Réponse"}] },
    { "type": "cta", "cta": "Bouton d'achat final (urgence)" },
    { "type": "countdown", "title": "Offre éclair", "subtitle": "expire bientôt" },
    { "type": "comparison", "title": "Pourquoi nous ?", "items": [{"name": "Nous", "text": "Rapide, Pas cher"}, {"name": "Les concurrents", "text": "Lent, Cher"}] },
    { "type": "video", "title": "Témoignages", "items": ["","",""] },
    { "type": "theme", "color": "orange", "font": "sans" } // couleur au choix: orange, blue, emerald, rose, ink
  ]
}
RÈGLE ABSOLUE: NE RENVOYER QUE LE JSON BRUT. AUCUN TEXTE AUTOUR, AUCUNE BALISE.`

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Mon produit : ${prompt.substring(0, 500)}` }],
        temperature: 0.7
      }),
    })

    if (!aiRes.ok) {
      return NextResponse.json({ error: 'Erreur IA' }, { status: 502 })
    }

    const aiData = (await aiRes.json()) as AnthropicResponse
    let rawJson = aiData.content.find(c => c.type === 'text')?.text || ''
    rawJson = rawJson.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim()

    let pageData
    try {
      pageData = JSON.parse(rawJson)
    } catch {
      return NextResponse.json({ error: 'L IA a généré un JSON invalide.' }, { status: 500 })
    }

    const pageId = crypto.randomUUID()
    const { error: insertErr } = await supabase
      .from('SalePage')
      .insert({
        id: pageId,
        store_id,
        title: pageData.title || 'Nouvelle Page',
        slug: pageData.slug || `page-generatrice-${Date.now()}`,
        template: pageData.template || 'ecommerce',
        sections: pageData.sections || [],
        product_ids: [],
        active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (insertErr) {
      return NextResponse.json({ error: 'Erreur DB insert' }, { status: 500 })
    }

    return NextResponse.json({ pageId }, { status: 200 })

  } catch (error) {
    console.error('[GeneratePrompt] Process Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
