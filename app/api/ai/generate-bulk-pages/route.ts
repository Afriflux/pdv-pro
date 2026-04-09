import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/router'

interface GenerateBulkBody {
  prompt: string
  count: number
  market?: string
}

export interface GeneratedBulkPage {
  title: string
  slug: string
  template: string
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
    .eq('type', 'bulk_page')
    .gte('created_at', oneHourAgo)

  if ((genCount ?? 0) >= 10) {
    return NextResponse.json({ error: 'Limite atteinte (10/h). Réessayez plus tard.' }, { status: 429 })
  }

  await supabase.from('AIGenerationLog').insert({ user_id: user.id, type: 'bulk_page' })

  let body: GenerateBulkBody
  try {
    body = (await req.json()) as GenerateBulkBody
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { prompt, count = 5, market = 'Sénégal' } = body
  const numPages = Math.min(Math.max(count, 1), 20)

  const systemPrompt = `Tu es un expert en e-commerce et création de landing pages sur le marché africain francophone (notamment ${market}).
Ta tâche est de générer un tableau JSON contenant exactement ${numPages} concepts de pages de vente prêtes à être générées.
Les pages doivent être ultra-persuasives, pertinentes et répondre au besoin exprimé par le vendeur.

Chaque objet du tableau DOIT contenir les champs suivants :
- "title": Titre accrocheur de la page (max 60 caractères)
- "slug": L'URL simplifiée pour la page (ex: "ma-super-formation", "parfum-royal-oud"). Doit être unique, en minuscules, sans espaces ni accents, séparés par des tirets.
- "template": Le type de page idéal parmi cette liste stricte : "beauty", "ebook", "formation", "food", "fashion", "services", "coaching", "ecommerce", "music", "event".

Exemple de réponse attendue (Renvoie UNIQUEMENT LE TABLEAU JSON) :
[
  {
    "title": "Formation Affiliation PRO",
    "slug": "formation-affiliation-pro",
    "template": "formation"
  }
]`

  const userPrompt = `Génère ${numPages} concepts de pages de vente.
Demande spécifique du vendeur : ${prompt}

Renvoie uniquement le tableau JSON valide, sans backticks ni texte additionnel.`

  try {
    const response = await generateAIResponse({
      taskType: 'creative',
      systemPrompt: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7
    })

    let rawText = response.content || ''

    rawText = rawText.trim()
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    try {
      const parsed = JSON.parse(rawText) as GeneratedBulkPage[]
      if (Array.isArray(parsed)) {
        return NextResponse.json({ pages: parsed }, { status: 200 })
      }
      throw new Error("Structure JSON array invalide")
    } catch (e) {
      console.error('[AI/GenerateBulkPages] JSON parse error:', e, 'Raw JSON:', rawText.slice(0, 150))
      return NextResponse.json({ error: "La réponse de l'IA est invalide." }, { status: 502 })
    }

  } catch (error) {
    console.error('[AI/GenerateBulkPages] Fetch Error or Timeout:', error)
    return NextResponse.json({ error: 'Timeout ou erreur serveur.' }, { status: 500 })
  }
}
