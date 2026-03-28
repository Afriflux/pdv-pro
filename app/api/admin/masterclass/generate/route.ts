import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* readonly */ }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== 'super_admin' && dbUser?.role !== 'gestionnaire') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { prompt } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Sujet manquant pour la génération.' }, { status: 400 })
    }

    const integrationRecord = await prisma.integrationKey.findUnique({
      where: { key: 'ANTHROPIC_API_KEY' }
    })
    const apiKey = integrationRecord?.value || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
       return NextResponse.json({ error: "La clé API Claude n'est pas configurée dans les intégrations." }, { status: 403 })
    }

    const client = new Anthropic({ apiKey })

    const systemPrompt = `Tu es un formateur expert en vente, marketing et e-commerce.
L'utilisateur te demande de générer un mini-cours (guide) structuré.
Règles strictes :
1. Retourne UNIQUEMENT un objet JSON valide, SANS AUCUN TEXTE AUTOUR. 
2. Structure :
{
  "title": "Titre super accrocheur (ex: Maîtriser le Closing sur WhatsApp)",
  "emoji": "📱", // Un seul émoji pertinent
  "color": "bg-indigo-50", // Choisis au hasard parmi : bg-blue-50, bg-indigo-50, bg-emerald-50, bg-amber-50, bg-rose-50, bg-purple-50
  "category": "Vente", // ou Marketing, Support, Mindset
  "readTime": "x min", // Estimation du temps
  "intro": "Une intro pêchue qui donne envie de lire (2-3 phrases).",
  "tips": [
    { "number": 1, "title": "Titre actionnable", "desc": "Explication claire et pratique." },
    // 3 à 5 étapes maximum
  ]
}`

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Sujet du cours : "${prompt}" \nGénère le JSON.` }]
    })

    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error("Réponse de l'IA illisible.")
    }

    let article
    try {
      const cleanJson = textContent.text.replace(/```json/g, '').replace(/```/g, '').trim()
      article = JSON.parse(cleanJson)
    } catch (e) {
      console.error("[generate-masterclass] Parsing JSON Error:", textContent.text)
      throw new Error("L'IA n'a pas renvoyé de format valide.")
    }

    return NextResponse.json({ success: true, article })

  } catch (error: unknown) {
    console.error('[API Generate Masterclass] Erreur:', error)
    const msg = error instanceof Error ? error.message : 'Une erreur est survenue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
