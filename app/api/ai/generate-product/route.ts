import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateProductBody {
  productName: string
  category?: string
  targetAudience?: string
  keyBenefits?: string
  price?: number
  tone?: 'persuasif' | 'luxe' | 'urgence' | 'economique' | 'probleme_solution'
}

export interface GeneratedProduct {
  title: string
  description: string
  benefits: string[]
  faq: Array<{ question: string; answer: string }>
  callToAction: string
  marketingAngles: string[]
  seoTitle: string
  metaDescription: string
}

// Réponse brute de l'API Anthropic
interface AnthropicResponse {
  content: Array<{ type: string; text: string }>
}

// ─── POST /api/ai/generate-product ───────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  // 1. Vérifier l'authentification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // 2. Rate limit : 20 générations produit / heure
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count: genCount } = await supabase
    .from('AIGenerationLog')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'product')
    .gte('created_at', oneHourAgo)

  if ((genCount ?? 0) >= 20) {
    return NextResponse.json(
      { error: 'Limite atteinte (20/h). Réessayez dans 1h.' },
      { status: 429 }
    )
  }

  // Logger la génération
  await supabase.from('AIGenerationLog')
    .insert({ user_id: user.id, type: 'product' })

  // 3. Parser et valider le body
  let body: GenerateProductBody
  try {
    body = (await req.json()) as GenerateProductBody
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  if (!body.productName?.trim()) {
    return NextResponse.json(
      { error: 'Le nom du produit est obligatoire.' },
      { status: 400 }
    )
  }

  const {
    productName,
    category      = 'Non spécifiée',
    targetAudience = 'Grand public africain',
    keyBenefits   = 'À déterminer',
    price,
    tone          = 'persuasif',
  } = body

  // 3. Lire la clé Claude depuis PlatformConfig (fallback sur .env)
  const supabaseAdmin = createAdminClient()
  const { data: config } = await supabaseAdmin
    .from('PlatformConfig')
    .select('value')
    .eq('key', 'ANTHROPIC_API_KEY')
    .single<{ value: string }>()

  const apiKey = config?.value || process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API Claude non configurée. Configurez-la dans /admin/integrations.' },
      { status: 503 }
    )
  }

  // 4. Construire les prompts
  const systemPrompt = `Tu es un expert en copywriting e-commerce pour le marché africain francophone (Sénégal, Côte d'Ivoire, Mali, etc.).
Tu crées des fiches produits ultra-persuasives adaptées à la culture et aux codes du e-commerce africain.
Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.`

  const userPrompt = `Génère une fiche produit complète pour :
- Produit : ${productName}
- Catégorie : ${category}
- Cible : ${targetAudience}
- Bénéfices : ${keyBenefits}
- Prix : ${price ? price + ' FCFA' : 'Non spécifié'}
- Ton : ${tone}

Réponds avec ce JSON exact :
{
  "title": "...",
  "description": "...",
  "benefits": ["...", "...", "...", "...", "..."],
  "faq": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ],
  "callToAction": "...",
  "marketingAngles": ["...", "...", "..."],
  "seoTitle": "...",
  "metaDescription": "..."
}`

  try {
    // 5. Appeler l'API Claude (Anthropic)
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[AI/GenerateProduct] Erreur Anthropic:', errText)
      return NextResponse.json(
        { error: 'Erreur lors de l\'appel à l\'IA. Réessayez.' },
        { status: 502 }
      )
    }

    const anthropicData = (await anthropicRes.json()) as AnthropicResponse

    // 5. Extraire le texte de la réponse
    const rawText = anthropicData.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('')
      .trim()

    // 6. Parser la réponse JSON de Claude
    let generated: GeneratedProduct
    try {
      generated = JSON.parse(rawText) as GeneratedProduct
    } catch {
      console.error('[AI/GenerateProduct] JSON invalide reçu de Claude:', rawText.slice(0, 300))
      return NextResponse.json(
        { error: 'La réponse de l\'IA est invalide. Réessayez.' },
        { status: 502 }
      )
    }

    // 7. Retourner la fiche générée
    return NextResponse.json({ product: generated }, { status: 200 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[AI/GenerateProduct] ❌', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
