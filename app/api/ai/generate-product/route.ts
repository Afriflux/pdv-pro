import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { storeId, promptText, model } = await req.json()

    // 1. Vérification des crédits
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { ai_credits: true }
    })
    
    if (!store || store.ai_credits < 5) {
      return NextResponse.json({ error: 'Fonds insuffisants (Requis: 5 crédits)' }, { status: 400 })
    }

    // 2. Déduction de 5 crédits (Coût de GENERATION)
    await prisma.store.update({
      where: { id: storeId },
      data: { ai_credits: { decrement: 5 } }
    })

    // 3. ICI ON MOCK L'APPEL CLAUDE/GPT car pas de clé API intégrée dans ce sandbox.
    // Dans la réalité, on enverrait l'image et/ou le texte au modèle choisi (ex: Claude 4.6 Sonnet).
    // On simule un délai de réflexion court côté API (l'animation Jarvis se fera côté client).
    await new Promise(r => setTimeout(r, 2000))

    const mockPrice = Math.floor(Math.random() * 8 + 2) * 1000 // Prix entre 2000 et 10000

    const mockResult = {
      product: {
        name: `${promptText.split(' ').slice(0, 3).join(' ')} - Édition Premium`,
        description: `Ce produit d'exception, conçu pour sublimer votre quotidien, répond parfaitement à vos attentes. Profitez de l'offre spéciale.`,
        price: mockPrice,
        category: 'Tendances',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop'] 
      },
      landingPage: {
        headline: `De Doute à Confiance : Le Secret pour Maîtriser Votre Style`,
        hook: `Rejoignez les 98% de clients satisfaits qui ont sauté le pas.`,
        features: [
          'Qualité premium garantie',
          'Confort absolu toute la journée',
          'Design exclusif et élégant',
          'Matériaux durables'
        ],
        faq: [
          { question: "Combien de temps dure la livraison ?", answer: "Livraison express en 24-48h." },
          { question: "Puis-je payer à la livraison ?", answer: "Oui, le paiement se fait à la réception (COD)." }
        ]
      }
    }

    return NextResponse.json(mockResult)

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}
