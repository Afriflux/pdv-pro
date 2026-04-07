import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { UniversalLinkHub } from '@/components/shared/links/UniversalLinkHub'

export const dynamic = 'force-dynamic'

export default async function VendorLinksPage({ searchParams }: { searchParams: { templateId?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get Store
  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    include: {
      products: { where: { active: true }, select: { id: true, name: true } },
      pages: { where: { active: true }, select: { id: true, title: true, slug: true } }
    }
  })

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white m-6 rounded-3xl border border-dashed border-gray-200">
        <span className="text-4xl mb-4">🛒</span>
        <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Aucun espace trouvé</h3>
        <p className="text-gray-500 font-medium text-center">
          Vous devez créer ou configurer votre boutique depuis le tableau de bord pour accéder à Link Hub.
        </p>
      </div>
    )
  }

  // Get BioLink from prisma
  let bioLink = await prisma.bioLink.findUnique({
    where: { user_id: user.id }
  })

  // If a templateId is provided, merge its data
  if (searchParams.templateId) {
    const template = await prisma.themeTemplate.findUnique({
      where: { id: searchParams.templateId }
    })
    
    if (template && template.data) {
      const td = template.data as any
      // If it's a new biolink, initialize it with template data
      // If it exists, we might overwrite theme/brand_color
      bioLink = {
         ...bioLink,
         id: bioLink?.id || '',
         slug: bioLink?.slug || '',
         user_id: user.id,
         theme: td.theme || bioLink?.theme || 'light',
         brand_color: td.brand_color || bioLink?.brand_color || '#0F7A60',
         links: td.links || bioLink?.links || [],
         socials: td.socials || bioLink?.socials || [],
         created_at: bioLink?.created_at || new Date(),
         updated_at: new Date()
      } as any
    }
  }

  const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'yayyam.sn'

  return (
    <main className="min-h-screen bg-[#FAFAF7] pb-12">
      <header className="bg-white border-b border-gray-100 px-6 py-8 md:px-10">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F7A60] to-teal-700 flex items-center justify-center text-white shadow-md">
            🔗
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Lien Hub</h1>
        </div>
        <p className="text-sm text-gray-500 mt-2 font-medium max-w-xl leading-relaxed">
          Générez des liens vers vos produits, ou configurez votre lien Link-in-Bio gratuit pour Instagram et TikTok.
        </p>
      </header>

      <div className="w-full px-4 md:px-6 py-8 mx-auto">
        <UniversalLinkHub 
          ownerType="vendor"
          userId={user.id}
          storeSlug={store.slug}
          domain={domain}
          products={store.products as any}
          salePages={store.pages as any}
          initialBioLink={bioLink}
        />
      </div>
    </main>
  )
}
