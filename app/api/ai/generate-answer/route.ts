import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/router'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Rate limit : 20 generations de réponses par heure
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
    const { count: genCount } = await supabase
      .from('AIGenerationLog')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'question_answer')
      .gte('created_at', oneHourAgo)

    if ((genCount ?? 0) >= 20) {
      return NextResponse.json(
        { error: 'Limite atteinte (20/h). Réessayez plus tard.' },
        { status: 429 }
      )
    }

    // Logger la génération
    await supabase.from('AIGenerationLog')
      .insert({ user_id: user.id, type: 'question_answer' })

    const { question, productName } = await req.json()
    if (!question || !productName) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const systemPrompt = `Tu es un expert en service client e-commerce pour l'Afrique francophone (Sénégal, Côte d'Ivoire, Mali, Cameroun etc.). 
Ton rôle est de répondre de façon magique aux questions des clients sur des produits. 
- La réponse sera affichée publiquement (comme une FAQ) sur la page de vente du produit.
- La réponse doit être TRSÈS COURTE (2 ou 3 phrases maximum), courtoise, chaleureuse et viser à rassurer pour conclure la vente.
- Tu dois ABSOLUMENT vouvoyer le client.
- Ne dis PAS "bonjour", "bonsoir" ou "cordialement". Va droit au but, la communication est fluide.
- Si le ton du client est agressif ou urgent, sois hyper rassurant et professionnel.
- Retourne UNIQUEMENT le texte de la réponse. Sans guillemets autour, sans blabla d'introduction.`

    const userPrompt = `Produit : "${productName}"\nQuestion du client : "${question}"`

    const response = await generateAIResponse({
      taskType: 'eco',
      systemPrompt: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7
    })

    return NextResponse.json({ answer: response.content.trim() })

  } catch (err: unknown) {
    console.error('[generate-answer]', err)
    return NextResponse.json({ error: 'Une erreur est survenue avec l\'IA. Réessayez.' }, { status: 500 })
  }
}
