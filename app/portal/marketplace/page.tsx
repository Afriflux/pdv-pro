import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import MarketplaceClient from "./MarketplaceClient"

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch tous les partenariats existants de l'utilisateur (active, pending, rejected)
  const userAffiliations = await prisma.affiliate.findMany({
    where: { user_id: user.id }
  })

  // Fetch tous les produits 'affiliate_active' de toutes les boutiques 'affiliate_active'
  const activeProducts = await prisma.product.findMany({
    where: {
      OR: [
        { affiliate_active: true },
        { affiliate_active: null }
      ],
      active: true,
      store: {
        affiliate_active: true
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      affiliate_margin: true,
      affiliate_media_kit_url: true,
      images: true,
      created_at: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo_url: true,
          affiliate_margin: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  // Fetch toutes les pages de ventes 'affiliate_active'
  const activePages = await prisma.salePage.findMany({
    where: {
      OR: [
        { affiliate_active: true },
        { affiliate_active: null }
      ],
      active: true,
      store: {
        affiliate_active: true
      }
    },
    select: {
      id: true,
      title: true,
      slug: true,
      affiliate_margin: true,
      created_at: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo_url: true,
          affiliate_margin: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  // Formatage pour le frontend (unifier Produit et Page pour l'affichage)
  const items = [
    ...activeProducts.map(p => ({
      id: p.id,
      type: 'product' as const,
      title: p.name,
      description: p.description || '',
      price: p.price,
      // la marge du produit prend le dessus, sinon celle du store
      commissionRate: p.affiliate_margin !== null ? p.affiliate_margin : p.store.affiliate_margin,
      image: p.images[0] || null,
      storeId: p.store.id,
      storeName: p.store.name,
      storeSlug: p.store.slug,
      storeLogo: p.store.logo_url,
      slug: p.id, // slug ou id
      mediaKitUrl: p.affiliate_media_kit_url
    })),
    ...activePages.map(p => ({
      id: p.id,
      type: 'page' as const,
      title: p.title,
      description: `Page de vente Tunnel - ${p.title}`,
      price: null, // les pages n'ont pas toujours un prix global fixé
      commissionRate: p.affiliate_margin !== null ? p.affiliate_margin : p.store.affiliate_margin,
      image: null,
      storeId: p.store.id,
      storeName: p.store.name,
      storeSlug: p.store.slug,
      storeLogo: p.store.logo_url,
      slug: p.slug,
      mediaKitUrl: null
    }))
  ]

  // On envoie 'userAffiliations' au frontend pour déterminer l'état de chaque store (Non demandé, En attente, Validé)
  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 space-y-6 pt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-ink tracking-tight mb-2">
            La Marketplace Partenaires 🤝
          </h1>
          <p className="text-slate max-w-2xl text-lg">
            Découvrez les meilleurs programmes d'affiliation sur PDV Pro. Postulez en un clic, obtenez vos liens et touchez vos commissions.
          </p>
        </div>
      </div>

      <MarketplaceClient 
        items={items} 
        affiliations={userAffiliations} 
        userId={user.id} 
      />
    </div>
  )
}
