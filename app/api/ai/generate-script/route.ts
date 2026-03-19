// POST /api/ai/generate-script
// Body : { productName, platform, objective, duration }
// Génère via Claude API : script + 3 hooks + hashtags
// Réponse : { script, hooks: string[], hashtags: string[] }

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ScriptBody {
  productName: string
  platform:   'tiktok' | 'instagram' | 'facebook' | 'whatsapp'
  objective:  'ventes' | 'notoriete' | 'engagement'
  duration:   '15s' | '30s' | '60s'
}

interface ScriptResult {
  script:   string
  hooks:    string[]
  hashtags: string[]
}

// Labels lisibles pour le prompt
const platformLabels: Record<ScriptBody['platform'], string> = {
  tiktok:    'TikTok',
  instagram: 'Instagram Reels',
  facebook:  'Facebook',
  whatsapp:  'WhatsApp Status',
}

const objectiveLabels: Record<ScriptBody['objective'], string> = {
  ventes:     'générer des ventes directes',
  notoriete:  'augmenter la notoriété de la marque',
  engagement: 'maximiser l\'engagement et les partages',
}

export async function POST(req: Request) {
  try {
    // ── 1. Vérifier l'authentification ────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // ── 2. Rate limit : 10 générations script / heure ─────────────────────────
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
    const { count: genCount } = await supabase
      .from('AIGenerationLog')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'script')
      .gte('created_at', oneHourAgo)

    if ((genCount ?? 0) >= 10) {
      return NextResponse.json(
        { error: 'Limite atteinte (10/h). Réessayez dans 1h.' },
        { status: 429 }
      )
    }

    // Logger la génération
    await supabase.from('AIGenerationLog')
      .insert({ user_id: user.id, type: 'script' })

    // ── 3. Parser et valider le body ──────────────────────────────────────────
    const body = await req.json() as ScriptBody

    if (!body.productName?.trim()) {
      return NextResponse.json({ error: 'productName requis' }, { status: 400 })
    }

    // ── 3. Lire la clé Claude depuis PlatformConfig (fallback sur .env) ──────
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

    // ── 4. Appeler Claude ─────────────────────────────────────────────────────
    const client = new Anthropic({ apiKey })

    const systemPrompt = `Tu es un expert en marketing digital pour l'Afrique francophone (Sénégal, Côte d'Ivoire, Mali, Cameroun, Bénin).
Tu crées des scripts publicitaires percutants, adaptés aux réalités et à la culture africaine.
Tu utilises un langage simple, direct, émotionnel et authentique.
Tu connais les codes des réseaux sociaux africains : humor, storytelling, preuve sociale, urgence.
Tu réponds UNIQUEMENT en JSON valide avec la structure : { "script": string, "hooks": string[], "hashtags": string[] }`

    const userPrompt = `Crée un script publicitaire pour :
- Produit : ${body.productName}
- Plateforme : ${platformLabels[body.platform]}
- Objectif : ${objectiveLabels[body.objective]}
- Durée : ${body.duration}

Génère :
1. "script" : Le script principal complet avec [VISUEL], [VOIX OFF] ou [TEXTE] selon la plateforme. Adapté à ${body.duration}.
2. "hooks" : Un tableau de 3 accroches alternatives percutantes (premières phrases) pour capter l'attention en moins de 3 secondes.
3. "hashtags" : Un tableau de 10-15 hashtags pertinents mix : niché + local + tendance.

Réponds UNIQUEMENT avec le JSON, sans texte autour.`

    const message = await client.messages.create({
      model:      'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system:     systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    })

    // ── 5. Parser la réponse JSON ─────────────────────────────────────────────
    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Réponse Claude invalide')
    }

    // Nettoyer et parser le JSON (peut contenir des backticks)
    const rawText = textContent.text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')

    const parsed = JSON.parse(rawText) as ScriptResult

    // Validation de la structure
    if (typeof parsed.script !== 'string' || !Array.isArray(parsed.hooks) || !Array.isArray(parsed.hashtags)) {
      throw new Error('Structure de réponse invalide')
    }

    return NextResponse.json({
      script:   parsed.script,
      hooks:    parsed.hooks.slice(0, 3),
      hashtags: parsed.hashtags.slice(0, 15),
    } satisfies ScriptResult)
  } catch (err: unknown) {
    console.error('[generate-script]', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
