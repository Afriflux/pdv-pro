import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GenerateTextBody {
  pageTitle: string
  field: string
  contextType: string
  template: string
  currentText?: string
  actionType?: 'generate' | 'improve' | 'fix' | 'shorten' | 'translate'
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

  // Rate limiting (max 100/h for text generation)
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count: genCount } = await supabase
    .from('AIGenerationLog')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'page_text')
    .gte('created_at', oneHourAgo)

  if ((genCount ?? 0) >= 100) {
    return NextResponse.json({ error: 'Limite atteinte (100/h). Réessayez plus tard.' }, { status: 429 })
  }

  // Log usage
  await supabase.from('AIGenerationLog').insert({ user_id: user.id, type: 'page_text' })

  let body: GenerateTextBody
  try {
    body = (await req.json()) as GenerateTextBody
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { pageTitle, field, contextType, template, currentText = '', actionType = 'generate' } = body

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API Claude non configurée.' }, { status: 503 })
  }

  const systemPrompt = `Tu es un copywriter d'élite expert en pages de vente agressives et ultra-persuasives pour le marché africain francophone.
Ta tâche est de traiter un court extrait de texte (1 phrase ou 1 paragraphe max) pour le produit : "${pageTitle}".
Niche/Template du produit : ${template}.

Instructions strictes :
- Renvoie UNIQUEMENT le texte final, sans introduction ni conclusion.
- Formule "Copier-coller", pas de guillemets au début ou à la fin.
- Ne pose pas de questions au tiret, ne dis pas "Voici le texte".`

  let userPrompt = ''

  if (actionType === 'improve') {
    userPrompt = `Réécris le texte suivant de manière beaucoup plus persuasive, agressive (marketing direct) et engageante pour pousser à l'achat rapide :\n\n"${currentText}"`
  } else if (actionType === 'fix') {
    userPrompt = `Corrige uniquement les fautes d'orthographe, de grammaire et de syntaxe du texte suivant, sans modifier le sens, le ton ou la longueur :\n\n"${currentText}"`
  } else if (actionType === 'shorten') {
    userPrompt = `Raccourcis le texte suivant au maximum pour qu'il soit très percutant et aille droit au but, en gardant l'argumentaire principal (conserve très peu de mots) :\n\n"${currentText}"`
  } else if (actionType === 'translate') {
    userPrompt = `Traduis le texte suivant en Anglais (si le texte actuel est en français) OU en Français (s'il est en anglais). Garde le ton très persuasif de vente :\n\n"${currentText}"`
  } else {
    // actionType === 'generate'
    userPrompt = `Génère le champ "${field}" de la section "${contextType}".`
    
    if (contextType === 'hero' && field === 'title') {
      userPrompt += `\nCeci est le gros titre principal (Hero). Il doit être très court et accrocheur (ex: "Débloquez Votre Potentiel avec X").`
    } else if (contextType === 'hero' && field === 'subtitle') {
      userPrompt += `\nCeci est la sous-promesse sous le titre. (1 ou 2 phrases max) pour expliquer le bénéfice rapide.`
    } else if (contextType === 'coach' && field === 'bio') {
      userPrompt += `\nCeci est la biographie du créateur ou coach. Donne-lui une autorité instantanée et raconte très brièvement pourquoi il est légitime. (3-4 phrases)`
    } else if (field === 'text') {
      userPrompt += `\nC'est un bloc de texte libre. Fais un paragraphe persuasif sur l'urgence d'acheter ou la douleur résolue.`
    }

    if (currentText) {
      userPrompt += `\nNote subsidiaire : l'utilisateur a déjà écrit ceci, utilise-le comme base d'inspiration mais améliore-le grandement : "${currentText}"`
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout for fast text

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!anthropicRes.ok) {
      console.error('[AI/GeneratePageText] Erreur Anthropic:', await anthropicRes.text())
      return NextResponse.json({ error: "Erreur lors de l'appel à l'IA." }, { status: 502 })
    }

    const anthropicData = (await anthropicRes.json()) as AnthropicResponse
    let text = anthropicData.content.find(c => c.type === 'text')?.text || ''

    // Clean quotes just in case Claude outputs "Texte"
    text = text.replace(/^["']|["']$/g, '').trim()

    return NextResponse.json({ text }, { status: 200 })

  } catch (error) {
    console.error('[AI/GeneratePageText] Fetch Error or Timeout:', error)
    return NextResponse.json({ error: 'Timeout ou erreur serveur.' }, { status: 500 })
  }
}
