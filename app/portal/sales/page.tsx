import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SalesClient from './SalesClient'

export const metadata = {
  title: 'Mes Ventes | Yayyam Affilié',
}

export const dynamic = 'force-dynamic'

export default async function AffiliateSalesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  // 1. Récupérer l'affilié lié à cet utilisateur
  const { data: affiliate } = await supabaseAdmin
    .from('Affiliate')
    .select('*, Store:store_id(name, slug)')
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

  // 2. Fetcher toutes les commandes générées via son token d'affiliation
  // On inclut le nom du produit via le Foreign Key relation
  const { data: orders } = await supabaseAdmin
    .from('Order')
    .select(`
      id, 
      created_at, 
      total, 
      affiliate_amount, 
      status, 
      Product:product_id(name)
    `)
    .eq('affiliate_token', affiliate.token)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col flex-1 w-full max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-8 max-w-full">
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
         <h1 className="text-3xl sm:text-4xl font-black text-[#041D14] tracking-tight mb-2">Historique des Ventes</h1>
         <p className="text-gray-500 text-[15px] font-medium max-w-2xl">
           Consultez en temps réel l'état des commandes générées par vos liens (Validé, Livraison en cours, Livré). Seules les commandes "Livrées & Payées" créditent votre portefeuille.
         </p>
      </div>
      
      <SalesClient orders={(orders as any) || []} />
    </div>
  )
}
