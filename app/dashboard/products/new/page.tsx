import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from './ProductForm'
import { prisma } from '@/lib/prisma'

export default async function NewProductPage({ searchParams }: { searchParams: { templateId?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupérer l'espace lié au vendeur
  const { data: store } = await supabase
    .from('Store')
    .select('id, name, vendor_type')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  let templateData = null
  if (searchParams.templateId) {
    const t = await prisma.themeTemplate.findUnique({ where: { id: searchParams.templateId } })
    if (t && t.data) templateData = t.data
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard/products" className="text-gray-400 hover:text-gray-600 transition">
          ←
        </Link>
        <div>
          <h1 className="text-lg font-bold text-ink">Nouveau produit</h1>
          <p className="text-xs text-gray-400">{store.name}</p>
        </div>
      </header>

      <div className="w-full p-6 space-y-6 bg-[#FAFAF7] min-h-screen">
        <ProductForm storeId={store.id} vendorType={store.vendor_type} initialTemplateData={templateData} />
      </div>
    </main>
  )
}
