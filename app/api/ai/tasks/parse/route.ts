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

    const { text } = await req.json()
    if (!text) {
      return NextResponse.json({ error: 'Texte manquant' }, { status: 400 })
    }
    
    // We send today's date so the model can resolve "tomorrow", "next monday", etc.
    const today = new Date().toISOString()

    const systemPrompt = `Tu es un assistant IA intégré à un outil CRM/Gestion de projet.
Ta mission est d'analyser la demande textuelle de l'utilisateur et d'extraire les paramètres de la tâche pour préremplir un formulaire.

Types de tâche possibles : 'call', 'email', 'meeting', 'issue', 'marketing', 'content', 'product', 'logistics', 'admin', 'general'.
Priorité possible : 'low', 'medium', 'high'.

Renvoie EXCLUSIVEMENT un objet JSON valide (sans aucun autre texte ou markdown) avec cette structure :
{
  "title": "Titre super clair et concis (max 50 chars)",
  "description": "Si le texte contient des détails annexes, mets-les ici, sinon vide",
  "taskType": "le type le plus pertinent parmi la liste",
  "priority": "low, medium, ou high (déduit de l'urgence du texte, par défaut medium)",
  "dueDate": "Si spécifié (ex: demain, lundi prochain), renvoie la date au format YYYY-MM-DD. La date d'aujourd'hui est ${today}. Sinon supprime ce champ",
  "client_name": "S'il s'agit d'un prénom/nom ou d'un client mentionné. Sinon supprime ce champ",
  "client_phone": "Si un numéro est mentionné. Sinon supprime ce champ"
}

Règle absolue : L'output DOIT être parsable par JSON.parse(). Ne rajoute AUCUN backtick, markdown ou phrase d'intro.`

    const response = await generateAIResponse({
      taskType: 'reasoning',
      systemPrompt: systemPrompt,
      prompt: text,
      temperature: 0.2
    })

    let parsed
    try {
      // Remove any trailing/leading whitespace or markdown artifacts just in case
      let cleanedText = response.content.trim()
      if (cleanedText.startsWith('```json')) cleanedText = cleanedText.replace('```json', '')
      if (cleanedText.startsWith('```')) cleanedText = cleanedText.replace('```', '')
      if (cleanedText.endsWith('```')) cleanedText = cleanedText.substring(0, cleanedText.length - 3)
      parsed = JSON.parse(cleanedText)
    } catch(_e) {
      console.error("Erreur de parsing AI JSON:", response.content)
      return NextResponse.json({ error: "L'IA n'a pas pu formater correctement la tâche." }, { status: 500 })
    }

    return NextResponse.json({ parsed })

  } catch (err: unknown) {
    console.error('[ai-tasks-parse]', err)
    return NextResponse.json({ error: 'Le moteur IA est momentanément surchargé.' }, { status: 500 })
  }
}
