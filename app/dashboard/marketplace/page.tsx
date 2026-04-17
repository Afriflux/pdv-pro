import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import MarketplaceClient from './MarketplaceClient'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user role & store
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  const role = userRecord?.role || 'vendor'

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, name: true, wallet: true }
  })

  // We consider users without stores might not be able to buy apps/themes
  // But they can buy courses or workflows if they are affiliate/closer. 
  // Let's not strict block them, we pass wallet info.
  const wallet = store?.wallet || { balance: 0, total_earned: 0 }

  // Fetch all active assets
  const [appsRaw, themesRaw, workflowsRaw, masterclassRaw] = await Promise.all([
    prisma.marketplaceApp.findMany({ where: { active: true }, orderBy: { created_at: 'desc' }, take: 50 }),
    prisma.themeTemplate.findMany({ where: { active: true, is_global: true }, orderBy: { created_at: 'desc' }, take: 50 }),
    prisma.workflow.findMany({ where: { store_id: null, user_id: null, status: 'active' }, orderBy: { created_at: 'desc' }, take: 50 }),
    prisma.masterclassArticle.findMany({ where: { is_active: true }, orderBy: { created_at: 'desc' }, take: 50 }) 
  ])

  // Filter based on allowed_roles -> user's role or 'all'
  const filterByRole = (items: any[]) => items.filter((i) => {
    if (!i.allowed_roles || i.allowed_roles.length === 0) return true;
    return i.allowed_roles.includes('all') || i.allowed_roles.includes(role);
  })

  const apps = filterByRole(appsRaw)
  const themes = filterByRole(themesRaw)
  const masterclass = filterByRole(masterclassRaw)
  const workflows = workflowsRaw.map(w => ({ ...w, description: w.description || undefined }))

  return (
    <div className="flex flex-col min-h-screen">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="mb-10 px-4">
          <h1 className="text-xl lg:text-3xl font-black text-ink tracking-tight mb-2">Marketplace & Apps</h1>
          <p className="text-gray-500 font-medium text-lg">Connectez de nouvelles fonctionnalités, de supers thèmes et vos cours.</p>
        </header>

        <MarketplaceClient 
          wallet={wallet}
          apps={apps}
          themes={themes}
          workflows={workflows}
          courses={masterclass}
          userRole={role}
        />
      </div>
    </div>
  )
}
