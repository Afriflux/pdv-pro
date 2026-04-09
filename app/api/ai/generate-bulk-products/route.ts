import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/router'

interface GenerateBulkBody {
  prompt: string
  count: number
  category?: string
  market?: string
}

export interface GeneratedBulkProduct {
  name: string
  description: string
  price: number
  type: 'physical' | 'digital' | 'coaching'
  category: string
  stock: number | null
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

  // Rate limit : 10 bulk generations / hour
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count: genCount } = await supabase
    .from('AIGenerationLog')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'bulk_product')
    .gte('created_at', oneHourAgo)

  if ((genCount ?? 0) >= 10) {
    return NextResponse.json(
      { error: 'Limite atteinte (10/h). Réessayez plus tard.' },
      { status: 429 }
    )
  }

  await supabase.from('AIGenerationLog').insert({ user_id: user.id, type: 'bulk_product' })

  let body: GenerateBulkBody
  try {
    body = (await req.json()) as GenerateBulkBody
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { prompt, count = 5, category = 'Général', market = 'Sénégal' } = body
  const numProducts = Math.min(Math.max(count, 1), 20) // Cap entre 1 et 20 produits

  const systemPrompt = `Tu es un expert en e-commerce sur le marché africain francophone (notamment ${market}).
Ta tâche est de générer un tableau JSON contenant exactement ${numProducts} fiches produits prêtes à être importées dans une boutique.
Les produits doivent être ultra-persuasifs, pertinents, et répondre au besoin exprimé par le vendeur.

Chaque objet du tableau DOIT contenir les champs suivants :
- "name": Nom du produit (très accrocheur, max 60 caractères)
- "description": Description qui donne envie d'acheter (max 200 caractères)
- "price": Le prix suggéré en FCFA (nombre entier)
- "type": "physical", "digital" ou "coaching" (en minuscules obligatoirement)
- "category": La catégorie du produit (ex: "Cosmétiques", "Mode", etc.)
- "stock": Un nombre entier pour le stock initial suggéré (par exemple 10, 50), ou null si digital/coaching

Exemple de réponse attendue (Renvoie UNIQUEMENT LE TABLEAU JSON) :
[
  {
    "name": "Parfum Oud Royal 50ml",
    "description": "Un parfum majestueux aux notes orientales. Tenue 24h garantie pour marquer les esprits à chaque passage.",
    "price": 25000,
    "type": "physical",
    "category": "Parfumerie",
    "stock": 15
  }
]`

  const userPrompt = `Génère ${numProducts} produits.
Secteur/Catégorie cible : ${category}
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

    // Nettoyage markdown éventuel
    rawText = rawText.trim()
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    try {
      const parsed = JSON.parse(rawText) as GeneratedBulkProduct[]
      if (Array.isArray(parsed)) {
        return NextResponse.json({ products: parsed }, { status: 200 })
      }
      throw new Error("Structure JSON array invalide")
    } catch (e) {
      console.error('[AI/GenerateBulk] JSON parse error:', e, 'Raw JSON:', rawText.slice(0, 150))
      return NextResponse.json({ error: "La réponse de l'IA est invalide." }, { status: 502 })
    }

  } catch (error) {
    console.error('[AI/GenerateBulk] Fetch Error or Timeout:', error)
    return NextResponse.json({ error: 'Timeout ou erreur serveur.' }, { status: 500 })
  }
}
