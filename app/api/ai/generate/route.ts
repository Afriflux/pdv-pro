import { NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/ai/router'
import { AIGenerationRequest } from '@/lib/ai/types'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Protection globale de la route
    const supabaseAdmin = createAdminClient()
    const { data: userData } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    // Vérifier les droits - les vendeurs et les admins peuvent utiliser l'IA 
    if (!['super_admin', 'gestionnaire', 'support', 'vendeur'].includes(userData?.role)) {
      return NextResponse.json({ error: 'Non autorisé à utiliser l\'API d\'intelligence artificielle' }, { status: 403 })
    }

    // Parsing la requete
    const body = await req.json()
    const { prompt, systemPrompt, taskType, forceProvider, temperature } = body as AIGenerationRequest

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })
    }

    // Execution via le routeur intelligent
    const aiResponse = await generateAIResponse({
      prompt,
      systemPrompt,
      taskType: taskType || 'eco',
      forceProvider,
      temperature
    })

    // (Optionnel) Loguer l'utilisation pour l'utilisateur
    // Cela nous permettra de tracer la consommation des vendeurs plus tard
    if (userData?.role === 'vendeur') {
       await supabaseAdmin.from('AdminLog').insert({
          admin_id: user.id,
          action: 'AI_USAGE',
          details: { 
            taskType: taskType || 'eco',
            modelUsed: aiResponse.modelUsed,
            provider: aiResponse.provider 
          }
       })
    }

    return NextResponse.json(aiResponse)

  } catch (error: unknown) {
    console.error('[API AI ERROR]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur lors de la génération IA' }, 
      { status: 500 }
    )
  }
}
