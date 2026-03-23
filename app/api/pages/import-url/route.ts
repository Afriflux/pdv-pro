import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ImportURLBody {
  url: string
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

  // Rate limiting simple
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count: genCount } = await supabase
    .from('AIGenerationLog')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'url_import')
    .gte('created_at', oneHourAgo)

  if ((genCount ?? 0) >= 30) {
    return NextResponse.json({ error: 'Limite atteinte (30 imports/h). Réessayez plus tard.' }, { status: 429 })
  }

  // Log usage
  await supabase.from('AIGenerationLog').insert({ user_id: user.id, type: 'url_import' })

  let body: ImportURLBody
  try {
    body = (await req.json()) as ImportURLBody
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { url, store_id } = body
  if (!url || !store_id) {
    return NextResponse.json({ error: 'URL et store_id obligatoires' }, { status: 400 })
  }

  // 1. Fetch de l'URL
  let htmlText = ''
  try {
    // Timeout de 10s pour le fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    // Ajout User-Agent classique pour éviter les blocages basiques
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      return NextResponse.json({ error: `Impossible de lire l'URL (Statut: ${res.status})` }, { status: 400 })
    }
    htmlText = await res.text()
  } catch (error: unknown) {
    console.error('[ImportURL] Fetch Error:', error)
    return NextResponse.json({ error: "L'URL est inaccessible ou met trop de temps à répondre." }, { status: 400 })
  }

  // 2. Nettoyage du HTML pour extraire le texte brut
  let cleanText = htmlText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  cleanText = cleanText.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  cleanText = cleanText.replace(/<[^>]+>/g, ' ') // Retire toutes les balises
  cleanText = cleanText.replace(/\s+/g, ' ').trim() // Normalise les espaces

  // Tronque à 50 000 caractères max (soit environ 10-15k tokens) pour éviter la surcharge
  const truncatedText = cleanText.substring(0, 50000)

  // 3. Appel Anthropic Claude 3.5
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API Claude non configurée.' }, { status: 503 })
  }

  const systemPrompt = `Tu es un expert en migration de pages de vente e-commerce. L'utilisateur te fournit le texte brut extrait d'une page externe (Shopify, Charriow, Systeme.io, etc.).
Ton objectif est de recréer parfaitement cette page en la mappant dans notre format JSON strict.

Structure JSON attendue OBLIGATOIREMENT :
{
  "title": "Nom du produit ou titre interne de la page",
  "slug": "url-optimisee-sans-espaces",
  "template": "ecommerce", // choisis parmi : beauty, ebook, formation, food, fashion, services, coaching, ecommerce, music, event
  "sections": [
    { "type": "hero", "title": "Titre principal accrocheur lu sur la page", "subtitle": "Sous-titre ou promesse", "cta": "Texte du bouton principal" },
    { "type": "benefits", "items": ["Avantage ou point fort 1", "Avantage 2", "Avantage 3"] },
    { "type": "text", "text": "Un paragraphe explicatif ou persuasif extrait de la page" },
    { "type": "testimonials", "items": [{ "name": "Nom du client", "text": "Avis extrait...", "rating": 5 }] },
    { "type": "faq", "items": [{ "q": "Question extraite", "a": "Réponse extraite" }] },
    { "type": "cta", "cta": "Texte du bouton d'achat final" },
    { "type": "theme", "color": "orange", "font": "sans" } // Devine la couleur dominante (orange, blue, rose, emerald, ink) et mets ce bloc A LA FIN.
  ]
}

Instructions :
- Tu dois chercher et extraire les informations réelles de la page fournie.
- Transforme tout le contenu qualitatif en sections ordonnées logiquement.
- NE RENVOIE QUE LE JSON BRUT. Ne mets pas de backticks \`\`\`json. Rien avant, rien après.`

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
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Texte de la page source :\n\n${truncatedText}` }],
        temperature: 0.1
      }),
    })

    if (!aiRes.ok) {
      console.error('[ImportURL] Anthropic Error:', await aiRes.text())
      return NextResponse.json({ error: 'Erreur lors de la configuration IA.' }, { status: 502 })
    }

    const aiData = (await aiRes.json()) as AnthropicResponse
    let rawJson = aiData.content.find(c => c.type === 'text')?.text || ''
    
    // Nettoyage au cas où
    rawJson = rawJson.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim()

    let pageData
    try {
      pageData = JSON.parse(rawJson)
    } catch {
      console.error('[ImportURL] JSON parse error:', rawJson)
      return NextResponse.json({ error: 'L\'IA a généré un format invalide.' }, { status: 500 })
    }

    // 4. Insertion en BDD
    const pageId = crypto.randomUUID()
    const { error: insertErr } = await supabase
      .from('SalePage')
      .insert({
        id: pageId,
        store_id,
        title: pageData.title || 'Page Importée',
        slug: pageData.slug || `page-importee-${Date.now()}`,
        template: pageData.template || 'ecommerce',
        sections: pageData.sections || [],
        product_ids: [],
        active: false, // Laisser en brouillon par sécurité
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (insertErr) {
      console.error('[ImportURL] DB Insert error:', insertErr)
      return NextResponse.json({ error: 'Erreur serveur BDD' }, { status: 500 })
    }

    return NextResponse.json({ pageId }, { status: 200 })

  } catch (error) {
    console.error('[ImportURL] Process Error:', error)
    return NextResponse.json({ error: 'Erreur lors du traitement.' }, { status: 500 })
  }
}
