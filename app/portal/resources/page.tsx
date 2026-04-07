import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ResourcesClient from './ResourcesClient'

export const metadata = {
  title: 'Ressources Marketing | Yayyam Affilié',
}

export const dynamic = 'force-dynamic'

export default async function AffiliateResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  // 1. Récupération de l'affilié et de la boutique
  const { data: affiliate } = await supabaseAdmin
    .from('Affiliate')
    .select('*, Store:store_id(slug)')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/60 mt-8">
        <h2 className="text-xl font-black text-gray-900 mb-2">Compte non rattaché</h2>
        <p className="text-gray-500 mb-6 font-medium">Vous devez d'abord obtenir un lien d'affiliation depuis un vendeur.</p>
      </div>
    )
  }

  // 2. Fetcher les produits actifs de la boutique rattachée
  const { data: products } = await supabaseAdmin
    .from('Product')
    .select('id, name, price, images, description, affiliate_media_kit_url')
    .eq('store_id', affiliate.store_id)
    .eq('active', true)
    // On trie par les plus récents
    .order('created_at', { ascending: false })

  // 3. Fetcher les codes promos assignés à l'affilié
  const { data: promoCodes } = await supabaseAdmin
    .from('PromoCode')
    .select('id, code, type, value, uses, max_uses, expires_at')
    .eq('affiliate_id', affiliate.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  const storeSlug = affiliate.Store?.slug || 'store'

  return (
    <div className="flex flex-col flex-1 w-full max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-8 max-w-full">
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
         <h1 className="text-3xl sm:text-4xl font-black text-[#041D14] tracking-tight mb-2">Ressources Marketing</h1>
         <p className="text-gray-500 text-[15px] font-medium max-w-2xl">
           Découvrez tous les produits que vous pouvez promouvoir. Générez vos liens uniques en 1 clic et téléchargez les visuels fournis par le vendeur.
         </p>
      </div>
      
      <ResourcesClient 
        affiliateCode={affiliate.code} 
        storeSlug={storeSlug} 
        products={products || []} 
        promoCodes={promoCodes || []}
      />
    </div>
  )
}
