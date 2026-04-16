import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { UniversalLinkHub } from '@/components/shared/links/UniversalLinkHub'

export const dynamic = 'force-dynamic'

export default async function AffiliateLinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Find the affiliate entry and its store
  const affiliate = await prisma.affiliate.findFirst({
    where: { user_id: user.id },
    include: {
      Store: {
        include: {
          products: { where: { active: true }, select: { id: true, name: true } },
          pages: { where: { active: true }, select: { id: true, title: true, slug: true } }
        }
      }
    }
  })

  if (!affiliate || !affiliate.Store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200 mt-6 mx-6">
        <h2 className="text-xl font-display font-black text-charcoal mb-2">Non rattaché</h2>
        <p className="text-slate font-medium">Vous devez être rattaché à une boutique pour générer des liens affiliés.</p>
      </div>
    )
  }

  // Get BioLink from prisma
  const bioLinks = await prisma.bioLink.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' }
  })

  // Quota for BioLinks
  const { checkUserQuota } = await import('@/lib/admin/quota')
  const bioLinkQuota = await checkUserQuota(user.id, 'link_bio')

  const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'yayyam.com'

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 animate-fade-in pb-12 pt-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display font-black text-[#1A1A1A] tracking-tight mb-2">Liens & Bio</h1>
        <p className="text-gray-500 text-sm sm:text-base font-medium">
          Créez facilement vos liens de parrainage pour <strong className="text-[#1A1A1A]">{affiliate.Store.name}</strong> ou gérez votre page Lien en Bio gratuite.
        </p>
      </div>

      <UniversalLinkHub 
        ownerType="affiliate"
        userId={user.id}
        storeSlug={affiliate.Store.slug}
        affiliateCode={affiliate.code}
        domain={domain}
        products={affiliate.Store.products as any}
        salePages={affiliate.Store.pages as any}
        bioLinks={bioLinks}
        bioLinkQuota={bioLinkQuota}
      />
    </div>
  )
}
