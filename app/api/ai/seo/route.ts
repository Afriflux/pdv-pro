import { NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/ai/router'

export async function POST(req: Request) {
  try {
    const { context, type } = await req.json()

    if (!context || !type) {
      return NextResponse.json({ error: 'Missing context or type' }, { status: 400 })
    }

    let prompt = ''
    if (type === 'title') {
      prompt = `Tu es un expert mondial en SEO et e-commerce. Ta mission est de générer un 'Titre SEO (Balise Title)' parfait pour Google.
Contexte de la page : "${context}"
Règles strictes :
1. Moins de 60 caractères.
2. Direct, accrocheur, optimisé pour la vente en Afrique/Sénégal (Yayyam).
3. Ne fournis AUCUNE introduction, justification ou texte supplémentaire. Uniquement la balise texte brute. Pas de guillemets autour de la réponse.`
    } else if (type === 'description') {
      prompt = `Tu es un expert mondial en SEO et e-commerce. Ta mission est de générer une 'Meta Description' parfaite pour Google.
Contexte de la page : "${context}"
Règles strictes :
1. Entre 120 et 155 caractères.
2. Doit inclure un appel à l'action clair (Call To Action).
3. Doit convaincre l'internaute de cliquer avec un ton professionnel.
4. Ne fournis AUCUNE introduction, justification ou texte supplémentaire. Uniquement la description brute. Pas de guillemets autour de la réponse.`
    } else if (type === 'keywords') {
      prompt = `Tu es un expert mondial en SEO et e-commerce. Ta mission est de générer une liste sémantique de 25 à 30 'Mots-clés pertinents'.
Contexte de la page : "${context}"
Règles strictes :
1. Cible idéalement le marché Africain / Sénégalais (vente en ligne, plateforme, sans abonnement).
2. Retourne UNIQUEMENT les mots-clés séparés par des virgules.
3. Ne fournis AUCUNE introduction, ni point final. Exemple: "ecommerce sénégal, vendre en ligne, boutique africaine"`
    } else {
      return NextResponse.json({ error: 'Invalid type. Use title, description or keywords.' }, { status: 400 })
    }

    const response = await generateAIResponse({
      taskType: 'eco',
      systemPrompt: 'Tu es une IA spécialisée dans le référencement naturel on-page. Tu dois retourner exactement et uniquement le texte demandé, sans fioritures.',
      prompt: prompt,
      temperature: 0.7
    })

    const generatedText = response.content.trim()

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
