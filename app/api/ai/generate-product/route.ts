import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { chargeForAI, AI_PRICING } from '@/lib/ai/ai-billing'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    // Pour simplifier, on suppose que l'ID user = ID wallet ou qu'on recupère le storeId depuis le body (ou user.id)
    const { description, category, market, walletId } = await req.json()
    // Si vous utilisez WalletId === UserId, on peut utiliser user.id. Modifiez selon votre structure.
    const targetWallet = walletId || user.id

    if (!description) {
      return NextResponse.json({ error: 'Description manquante' }, { status: 400 })
    }

    // 💰 Facturation Pay-as-you-go. (Ex: 25 FCFA pour cette génération)
    try {
      await chargeForAI('vendor', targetWallet, AI_PRICING.COPYWRITING_LONG, 'Génération Fiche Produit IA')
    } catch (billingError: any) {
      return NextResponse.json({ error: billingError.message }, { status: 402 }) // 402 Payment Required
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'Clé API Anthropic (Claude) manquante. Veuillez définir ANTHROPIC_API_KEY dans vos variables d\'environnement.' 
      }, { status: 500 })
    }

    const prompt = `Tu es un expert mondial en copywriting, e-commerce et SEO.
Ton objectif est de transformer la description très simple d'un vendeur en une fiche produit redoutable pour le marché cible.

MARCHÉ CIBLE: ${market || 'Sénégal / Afrique'}
CATÉGORIE: ${category || 'Général'}
DESCRIPTION BRUTE DU VENDEUR: "${description}"

Tu DOIS retourner un objet JSON strictement formaté selon la structure suivante, et RIEN D'AUTRE (AUCUN texte avant ou après, pas de blocs markdown \`\`\`json).

Structure JSON requise :
{
  "title": "Un titre de produit très accrocheur orienté vente",
  "description": "Une description très persuasive de 3 à 4 paragraphes, utilisant le copywriting AIDA (Attention, Intérêt, Désir, Action)",
  "benefits": ["Avantage 1 (pas de caractéristique technique)", "Avantage 2", "Avantage 3"],
  "faq": [
    {"question": "Question fréquente 1 ?", "answer": "Réponse rassurante 1."},
    {"question": "Question fréquente 2 ?", "answer": "Réponse rassurante 2."}
  ],
  "callToAction": "L'appel à l'action final irrésistible (ex: Cliquez sur Acheter Maintenant...)",
  "marketingAngles": ["Angle marketing cible 1", "Angle marketing cible 2"],
  "seoTitle": "Un titre optimisé Google (Moins de 60 caractères)",
  "metaDescription": "Une meta description optimisée Google (Entre 120 et 155 caractères avec CTA)"
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      temperature: 0.7,
      system: 'Tu es une IA e-commerce experte. Retourne UNIQUEMENT le JSON valide brut. Ne dis pas "Voici le JSON".',
      messages: [
        { role: 'user', content: prompt }
      ]
    })

    const generatedText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Clean potential markdown blocks
    const jsonString = generatedText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    const productData = JSON.parse(jsonString)

    return NextResponse.json({ success: true, product: productData })

  } catch (error: any) {
    console.error('Erreur API Generate Product (Anthropic):', error)
    return NextResponse.json(
      { success: false, error: 'Désolé, l\'IA a rencontré une erreur ou a renvoyé un format invalide. Réessayez.' }, 
      { status: 500 }
    )
  }
}
