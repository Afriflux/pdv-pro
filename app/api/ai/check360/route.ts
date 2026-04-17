import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/router'
import { prisma } from '@/lib/prisma'

// Rate limiting en mémoire : 1 appel max / 30s par utilisateur
const rateLimitMap = new Map<string, number>()

interface Check360Body {
  storeName: string
  caToday: number
  countToday: number
  pendingCount: number
  walletBalance: number
  productCount: number
  caWeek: number
  level: string
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>
}

const FALLBACK_ACTIONS = {
  summary: "Voici quelques actions recommandées pour démarrer votre analyse.",
  actions: [
    {
      icon: "🛍️",
      title: "Ajouter un produit",
      description: "Ajoutez un nouveau produit pour enrichir votre catalogue.",
      priority: "medium" as const,
      cta: "Créer un produit",
      ctaHref: "/dashboard/products/new"
    },
    {
      icon: "📣",
      title: "Booster vos ventes",
      description: "Publiez le lien de votre boutique en statut WhatsApp.",
      priority: "high" as const,
      cta: "Marketing",
      ctaHref: "/dashboard/marketing"
    },
    {
      icon: "📦",
      title: "Gérer vos commandes",
      description: "Assurez-vous qu'aucune commande n'est en attente prolongée.",
      priority: "low" as const,
      cta: "Mes commandes",
      ctaHref: "/dashboard/orders"
    }
  ]
}

export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Fonctionnement interne : Limite RAM
  const lastCall = rateLimitMap.get(user.id) ?? 0
  if (Date.now() - lastCall < 30000) {
    return NextResponse.json(FALLBACK_ACTIONS, { status: 200 })
  }
  rateLimitMap.set(user.id, Date.now())

  // SÉCURISATION MONÉTISATION : VÉRIFICATION DES TOKENS IA
  let store;
  try {
    store = await prisma.store.findUnique({
      where: { user_id: user.id },
      select: { id: true, ai_credits: true } as any
    }) as { id: string, ai_credits: number } | null
    
    if (!store || store.ai_credits <= 0) {
      console.warn(`[AI/Check360] Plus de crédits IA pour Boutique: ${store?.id ?? 'inconnue'}`);
      return NextResponse.json(FALLBACK_ACTIONS, { status: 200 }) // Renvoie les actions statiques gratuites (sans GPT)
    }

    // Déduction SaaS
    await prisma.store.update({
      where: { id: store.id },
      data: { ai_credits: { decrement: 1 } } as any
    })
  } catch (err) {
    console.error('[AI/Check360] Erreur vérif crédit:', err)
  }

  let body: Check360Body
  try {
    body = (await req.json()) as Check360Body
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const systemPrompt = `Tu es l'assistant IA de Yayyam, plateforme e-commerce africaine.
Tu analyses les données d'un vendeur et génères EXACTEMENT 3 actions.
Les actions sont concrètes, actionnables aujourd'hui, adaptées au marché africain (Wave, Orange Money, WhatsApp, COD).
Priorité high = urgent à faire maintenant.
Priorité medium = important cette semaine.
Priorité low = amélioration long terme.
ctaHref doit être un lien dashboard valide parmi : /dashboard/products/new, /dashboard/orders, /dashboard/marketing, /dashboard/wallet, /dashboard/settings, /dashboard/promotions.
Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks, avec cette structure exacte :
{
  "summary": "phrase de résumé globale max 20 mots",
  "actions": [
    {
      "icon": "emoji string",
      "title": "court, max 6 mots",
      "description": "1 phrase concrète, max 15 mots",
      "priority": "high" | "medium" | "low",
      "cta": "texte du bouton optionnel",
      "ctaHref": "lien interne optionnel"
    }
  ]
}`

  const userPrompt = `Analyse les données du vendeur:
- Boutique : ${body.storeName} (Niveau ${body.level})
- CA Aujourd'hui : ${body.caToday} FCFA
- Ventes Aujourd'hui : ${body.countToday}
- Commandes en attente : ${body.pendingCount}
- Solde Wallet : ${body.walletBalance} FCFA
- Nombre de produits : ${body.productCount}
- CA 7 derniers jours : ${body.caWeek} FCFA

Génère les 3 actions recommandées au format JSON.`

  try {
    const response = await generateAIResponse({
      taskType: 'reasoning',
      systemPrompt: systemPrompt,
      prompt: userPrompt,
      temperature: 0.4
    })    

    let rawText = response.content.trim()

    // Nettoyage markdown éventuel
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    try {
      const parsed = JSON.parse(rawText)
      if (parsed.actions && Array.isArray(parsed.actions)) {
        return NextResponse.json(parsed, { status: 200 })
      }
      throw new Error("Structure JSON invalide")
    } catch (e) {
      console.error('[AI/Check360] JSON parse error:', e, 'Raw JSON:', rawText.slice(0, 150))
      return NextResponse.json(FALLBACK_ACTIONS, { status: 200 })
    }

  } catch (error) {
    console.error('[AI/Check360] Fetch Error or Timeout:', error)
    return NextResponse.json(FALLBACK_ACTIONS, { status: 200 })
  }
}
