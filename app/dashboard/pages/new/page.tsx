import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewPageFlow } from './NewPageFlow'
import { prisma } from '@/lib/prisma'

export default async function NewSalePagePage({ searchParams }: { searchParams: { templateId?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // Produits disponibles pour lier à la page
  const { data: products } = await supabase
    .from('Product')
    .select('id, name, price, type, images')
    .eq('store_id', store.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  let templateData = null
  if (searchParams.templateId) {
    const t = await prisma.themeTemplate.findUnique({ where: { id: searchParams.templateId } })
    if (t && t.data) templateData = t.data
  }

  // Load global templates
  const globalTemplatesRaw = await prisma.themeTemplate.findMany({
    where: { type: 'sale_page', is_global: true },
    orderBy: { name: 'asc' }
  })
  
  const globalTemplates = globalTemplatesRaw.map(t => ({
    id: t.id,
    label: t.name,
    desc: t.description,
    category: t.category,
    sub_category: t.sub_category,
    is_premium: t.is_premium,
    price: t.price,
    ...(typeof t.data === 'object' && t.data !== null ? t.data : {})
  }))

  const assetPurchases = await prisma.assetPurchase.findMany({
    where: { store_id: store.id, asset_type: 'TEMPLATE' },
    select: { asset_id: true }
  })
  const purchasedAssetIds = assetPurchases.map(a => a.asset_id)

  return (
    <main className="min-h-screen bg-cream">
      <NewPageFlow 
        storeId={store.id} 
        products={products ?? []} 
        initialTemplateData={templateData} 
        globalTemplates={globalTemplates} 
        purchasedAssetIds={purchasedAssetIds}
      />
    </main>
  )
}
