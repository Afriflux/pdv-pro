// POST /api/ai/generate-script
// Body : { productName, platform, objective, duration }
// Génère via Claude API : script + 3 hooks + hashtags
// Réponse : { script, hooks: string[], hashtags: string[] }

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/router'
import { prisma } from '@/lib/prisma'

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

    // ── SÉCURISATION MONÉTISATION : VÉRIFICATION DES TOKENS IA ───────────────
    // Au lieu du vieux rate-limiting gratuit, on exige que le Vendeur paie.
    const store = await prisma.store.findUnique({
      where: { user_id: user.id },
      select: { id: true, ai_credits: true }
    })

    if (!store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    if (store.ai_credits <= 0) {
      return NextResponse.json(
        { error: 'Vos crédits IA sont épuisés. Obtenez un Pack IA ou passez en illimité sur votre tableau de bord.' },
        { status: 402 } // Payment Required
      )
    }

    // Déduit un crédit (Péage SaaS)
    await prisma.store.update({
      where: { id: store.id },
      data: { ai_credits: { decrement: 1 } }
    })

    // On log aussi historiquement
    await supabase.from('AIGenerationLog').insert({ user_id: user.id, type: 'script' })

    // ── 3. Parser et valider le body ──────────────────────────────────────────
    const body = await req.json() as ScriptBody

    if (!body.productName?.trim()) {
      return NextResponse.json({ error: 'productName requis' }, { status: 400 })
    }

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

    const response = await generateAIResponse({
      taskType: 'creative',
      systemPrompt: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7
    })

    // Nettoyer et parser le JSON (peut contenir des backticks)
    const rawText = response.content.trim()
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

    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
