import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { taskTitle, taskDescription, taskType } = await req.json()
    if (!taskTitle) {
      return NextResponse.json({ error: 'Titre de tâche manquant' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: config } = await supabaseAdmin
      .from('PlatformConfig')
      .select('value')
      .eq('key', 'ANTHROPIC_API_KEY')
      .single<{ value: string }>()

    const apiKey = config?.value || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Le service IA est indisponible (Clé non configurée).' },
        { status: 503 }
      )
    }

    const client = new Anthropic({ apiKey })

    const systemPrompt = `Tu es un Assistant Exécutif IA intégré au CRM d'un e-commerçant/infopreneur.
Ta mission est d'agir (passer à l'action) directement à partir d'une tâche donnée.

Voici les instructions par type :
- 'email' : Rédige l'email complet, professionnel et prêt à l'envoi. Gère les variables comme [Nom].
- 'call' : Prépare un cours script d'appel (Intro, Objections, Conclusion) pour le vendeur.
- 'marketing' : Propose un angle publicitaire, une amorce (hook) et un appel à l'action.
- 'content' : Rédige un brouillon de post RS, de script vidéo TikTok, ou d'article selon le cas.
- 'issue' ou 'support' : Rédige le message d'excuse ou de SAV type parfait pour calmer le client.
- Autres : Propose une liste d'étapes (3-4 points) pour accomplir la tâche brillamment.

Sois direct, concis et utilise un ton persuasif. Pas d'introduction "Voici votre contenu :". Renvoie uniquement le brouillon/résultat exploitable.`

    const userPrompt = `Tâche à traiter : "${taskTitle}"
Informations contextuelles : "${taskDescription || 'Aucunes précisions'}"
Type de tâche : "${taskType}"

Génère le livrable final :`

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Réponse vide')
    }

    return NextResponse.json({ generated: textContent.text.trim() })

  } catch (err: unknown) {
    console.error('[ai-tasks-generate]', err)
    return NextResponse.json({ error: 'Le moteur IA est momentanément surchargé.' }, { status: 500 })
  }
}
