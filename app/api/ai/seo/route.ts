import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Utilise la clé ANTHROPIC_API_KEY depuis les variables d'environnement
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(req: Request) {
  try {
    const { context, type } = await req.json()

    if (!context || !type) {
      return NextResponse.json({ error: 'Missing context or type' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'Clé API Anthropic (Claude) manquante. Veuillez définir ANTHROPIC_API_KEY.' 
      }, { status: 500 })
    }

    let prompt = ''
    if (type === 'title') {
      prompt = `Tu es un expert mondial en SEO et e-commerce. Ta mission est de générer un 'Titre SEO (Balise Title)' parfait pour Google.
Contexte de la page : "${context}"
Règles strictes :
1. Moins de 60 caractères.
2. Direct, accrocheur, optimisé pour la vente en Afrique/Sénégal (PDV Pro).
3. Ne fournis AUCUNE introduction, justification ou texte supplémentaire. Uniquement la balise texte brute. Pas de guillemets autour de la réponse.`
    } else if (type === 'description') {
      prompt = `Tu es un expert mondial en SEO et e-commerce. Ta mission est de générer une 'Meta Description' parfaite pour Google.
Contexte de la page : "${context}"
Règles strictes :
1. Entre 120 et 155 caractères.
2. Doit inclure un appel à l'action clair (Call To Action).
3. Doit convaincre l'internaute de cliquer avec un ton professionnel.
4. Ne fournis AUCUNE introduction, justification ou texte supplémentaire. Uniquement la description brute. Pas de guillemets autour de la réponse.`
    } else {
      return NextResponse.json({ error: 'Invalid type. Use title or description.' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      temperature: 0.7,
      system: 'Tu es une IA spécialisée dans le référencement naturel on-page. Tu dois retourner exactement et uniquement le texte demandé, sans fioritures.',
      messages: [
        { role: 'user', content: prompt }
      ]
    })

    const generatedText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Nettoyer d'éventuels guillemets résiduels
    const cleanedText = generatedText.replace(/^"(.*)"$/, '$1')

    return NextResponse.json({ result: cleanedText })

  } catch (error: any) {
    console.error('Erreur IA SEO:', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la génération IA' }, 
      { status: 500 }
    )
  }
}
