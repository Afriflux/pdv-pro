'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Helper pour générer un slug propre
const slugify = (str: string) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateFlashFunnel(productId: string) {
  try {
    // 1. Récupération des données du produit via Prisma
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: true
      }
    })

    if (!product) {
      throw new Error("Produit introuvable")
    }

    if (!product.store) {
      throw new Error("Boutique introuvable")
    }

    // Extraction des images
    let imageUrl = 'https://placehold.co/800x600/0f7a60/white?text=Votre+Produit'
    if (product.images && product.images.length > 0) {
      imageUrl = product.images[0] as string
    }

    // 2. Création de la structure du Funnel Flash
    // Un JSON puissant pré-rempli avec les sections qui convertissent
    const funnelSections = [
      {
        id: "hero-1",
        type: "hero",
        title: `Découvrez ${product.name}`,
        subtitle: product.description || "L'offre exclusive que vous attendiez est enfin là. Ne laissez pas passer cette opportunité unique de transformer votre quotidien.",
        cta: "Acheter maintenant",
        bgImage: "", // Fond transparent ou clair
        productImage: imageUrl,
        features: ["Livraison rapide", "Paiement sécurisé", "Satisfait ou remboursé"]
      },
      {
        id: "benefits-1",
        type: "benefits",
        title: "Pourquoi choisir cette offre ?",
        benefits: [
          {
            title: "Haute Qualité",
            description: "Conçu avec les meilleurs standards pour vous garantir une satisfaction totale."
          },
          {
            title: "Assistance Premium",
            description: "Notre équipe est disponible 24/7 pour répondre à toutes vos interrogations."
          },
          {
            title: "Résultats Immédiats",
            description: "Profitez d'un impact positif dès l'achat. Satisfaction garantie."
          }
        ]
      },
      {
         id: "countdown-1",
         type: "countdown",
         title: "Flash Sale - Offre très limitée !",
         subtitle: "Une réduction exceptionnelle s'applique pour quelques heures. Obtenez " + product.name + " avant rupture de stock.",
         targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +24 Heures
         bgStyle: "dark"
      },
      {
        id: "cta-1",
        type: "cta",
        title: "N'attendez plus. Sécurisez votre commande aujourd'hui.",
        subtitle: "Stock limité. L'offre expire sous peu.",
        cta: "Je commande maintenant",
        primary: true
      }
    ]

    // Template par défaut basé sur le store
    let pageTemplate = 'ecommerce'
    if (product.type === 'coaching') pageTemplate = 'coaching'
    else if (product.type === 'digital') pageTemplate = 'ebook'
    
    const baseSlug = slugify(product.name)
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const newSlug = `${baseSlug}-flash-${suffix}`

    // 3. Injection dans la base de données
    const newSalePage = await prisma.salePage.create({
      data: {
        store_id: product.store_id,
        title: `[FLASH] ${product.name}`,
        slug: newSlug,
        template: pageTemplate,
        sections: funnelSections,
        product_ids: [product.id],
        active: false, // Laissant le temps au vendeur d'ajuster l'éditeur (Draft)
      }
    })

    revalidatePath('/dashboard/pages')
    revalidatePath(`/dashboard/products`)

    // On retourne l'ID pour pouvoir rediriger côté Client UI
    return { success: true, pageId: newSalePage.id, slug: newSalePage.slug }

  } catch (error: any) {
    console.error('[GenerateFlashFunnel Error]', error)
    return { error: error?.message || "Une erreur est survenue lors de la création du funnel flash." }
  }
}
