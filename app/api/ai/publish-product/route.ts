import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { storeId, productData, landingData } = await req.json()

    // 1. Vérification des crédits (5 requis pour la publication)
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { ai_credits: true }
    })
    
    if (!store || store.ai_credits < 5) {
      return NextResponse.json({ error: 'Fonds insuffisants (Requis: 5 crédits pour publier)' }, { status: 400 })
    }

    // 2. Déduction de 5 crédits (Coût de PUBLICATION)
    await prisma.store.update({
      where: { id: storeId },
      data: { ai_credits: { decrement: 5 } }
    })

    // 3. Création du Produit en base
    const product = await prisma.product.create({
      data: {
        store_id: storeId,
        name: productData.name,
        price: Number(productData.price),
        type: 'physical',
        category: productData.category || 'Généré par IA',
        description: productData.description,
        images: productData.images || [],
        active: true,
        cash_on_delivery: true,
      }
    })

    // 4. Création de la Landing Page (SalePage)
    // Structure du JSON du theme
    const themeConfig = {
      heroTitle: landingData.headline,
      heroSubtitle: landingData.hook,
      features: landingData.features,
      faqs: landingData.faq,
      buttonText: 'Acheter Maintenant',
      colors: { primary: '#0F7A60', secondary: '#C9A84C' }
    }

    const salePage = await prisma.salePage.create({
      data: {
        store_id: storeId,
        title: `Tunnel: ${productData.name}`,
        slug: `tunnel-${Math.random().toString(36).substring(7)}`,
        product_ids: [product.id],
        active: true,
        template: 'premium_ai',
        sections: themeConfig,
      }
    })

    return NextResponse.json({ success: true, productId: product.id, pageId: salePage.id, pageSlug: salePage.slug })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur interne lors de la publication' }, { status: 500 })
  }
}
