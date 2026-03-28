import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Rate limit : 10 générations de coaching global par heure
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
    const { count: genCount } = await supabase
      .from('AIGenerationLog')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'coach_ia')
      .gte('created_at', oneHourAgo)

    if ((genCount ?? 0) >= 10) {
      return NextResponse.json(
        { error: 'Limite atteinte (10 questions/h). Le Coach se repose. ☕' },
        { status: 429 }
      )
    }

    const { question, history } = await req.json()
    if (!question) {
      return NextResponse.json({ error: 'Question manquante' }, { status: 400 })
    }

    // Logger la génération
    await supabase.from('AIGenerationLog')
      .insert({ user_id: user.id, type: 'coach_ia' })

    const supabaseAdmin = createAdminClient()
    const { data: config } = await supabaseAdmin
      .from('PlatformConfig')
      .select('value')
      .eq('key', 'ANTHROPIC_API_KEY')
      .single<{ value: string }>()

    const apiKey = config?.value || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Coach indisponible (Clé API non configurée).' },
        { status: 503 }
      )
    }

    const client = new Anthropic({ apiKey })

    // Construction du contexte global avec TOUTES les Masterclasses
    const [allMasterclasses, learnedKnowledge] = await Promise.all([
      prisma.masterclassArticle.findMany({
        where: { is_active: true },
        select: { title: true, intro: true, tips: true }
      }),
      prisma.aIKnowledgeBase.findMany({
        orderBy: { created_at: 'desc' },
        take: 50
      })
    ])

    const globalContext = allMasterclasses.map((m, idx) => {
      let tipsStr = ''
      try {
         const tipsArray = typeof m.tips === 'string' ? JSON.parse(m.tips) : m.tips
         if (Array.isArray(tipsArray)) {
           tipsStr = tipsArray.map((t: any) => `Étape ${t.number || idx}: ${t.title}\n${t.desc}`).join('\n\n')
         }
      } catch (e) {}

      return `--- COURS: ${m.title} ---\nINTRO: ${m.intro}\nCONTENU:\n${tipsStr}`
    }).join('\n\n==========\n\n')

    const learnedContextStr = learnedKnowledge.length > 0 
      ? learnedKnowledge.map(k => `Q: ${k.question}\nStratégie PDV Pro: ${k.answer}`).join('\n\n')
      : 'Aucune connaissance additionnelle pour le moment.'

    const systemPrompt = `Tu es l'Arme Ultime E-commerce PDV Pro, un mentor expert, bienveillant et super motivant pour les vendeurs e-commerce en Afrique.
Tu es omniscient concernant toutes les stratégies de l'Académie PDV Pro.

VOICI L'INTÉGRALITÉ DES COURS DE L'ACADÉMIE :
======================================================
${globalContext}
======================================================

VOICI TES CONNAISSANCES ACQUISES (Apprentissage continu) :
======================================================
${learnedContextStr}
======================================================

Règles impératives :
1. Recherche d'abord la réponse dans les informations ci-dessus.
2. Tutoie le vendeur. Sois chaleureux (utilise des émojis). Fais des réponses courtes, percutantes et très structurées (max 4-5 lignes ou points-clés).
3. Si une stratégie s'y prête, cite le titre du cours correspondant.
4. Si la réponse N'EST PAS dans la base de connaissances fournie ci-dessus, utilise tes capacités mondiales d'expert en e-commerce pour donner la meilleure solution. 
5. DANS CE CAS SEULEMENT (quand tu fournis une nouvelle solution qui n'est pas dans le texte fourni), tu DOIS ABSOLUMENT commencer ton message par le mot exact "[NEW_KNOWLEDGE]". 
6. Ne sors jamais de ton rôle d'expert e-commerce PDV Pro.`

    // Construct message history for Claude
    // we need to format messages as expected by Anthropic, with role 'user' or 'assistant'
    const formattedHistory = Array.isArray(history) 
      ? history.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      : []

    // Append the new question
    formattedHistory.push({ role: 'user', content: question })

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 400,
      system: systemPrompt,
      messages: formattedHistory as any,
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Réponse Claude invalide')
    }

    let finalAnswer = textContent.text.trim()
    let isNewKnowledge = false

    if (finalAnswer.includes('[NEW_KNOWLEDGE]')) {
      isNewKnowledge = true
      finalAnswer = finalAnswer.replace(/\[NEW_KNOWLEDGE\]/g, '').trim()
      
      // Sauvegarde asynchrone pour ne pas bloquer la réponse UI
      prisma.aIKnowledgeBase.create({
        data: {
          question: question,
          answer: finalAnswer
        }
      }).catch(err => console.error('[Coach IA] Erreur save KB:', err))
    }

    return NextResponse.json({ answer: finalAnswer, learned: isNewKnowledge })

  } catch (err: unknown) {
    console.error('[coach-ia]', err)
    return NextResponse.json({ error: 'Le Coach est momentanément indisponible.' }, { status: 500 })
  }
}
