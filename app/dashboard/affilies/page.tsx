import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AffiliateClient from './AffiliateClient'

// ─── Page Programme d'Affiliation ────────────────────────────────────────────
// Migration prisma → Supabase natif
// Correction : utilisation de store_id au lieu de vendor_id (colonne inexistante)
// Et sélection des bonnes colonnes attendues par le client

// Type pour les affiliés retournés par Supabase
interface AffiliateRow {
  id: string
  code: string
  status: string
  clicks: number
  total_sales: number
  total_earnings: number
  created_at: string
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
  } | null
}

export interface OverrideItem {
  id: string
  name: string
  affiliate_active: boolean | null
  affiliate_margin: number | null
}

export default async function AffiliesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()

  // 1. Récupérer le store du vendeur via Supabase
  const { data: store } = await supabaseAdmin
    .from('Store')
    .select('id, slug, affiliate_active, affiliate_margin, gamification_active, gamification_config')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // 2. Récupérer les affiliés avec les infos utilisateur
  //    Mise à jour des champs (status, clicks) pour correspondre au Client.
  const { data: affiliates } = await supabaseAdmin
    .from('Affiliate')
    .select(`
      id, code, status, clicks,
      total_sales, total_earnings,
      created_at,
      user:User(id, name, email, phone)
    `)
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  // 2b. Récupérer les demandes de retrait des affiliés de ce store
  const { data: withdrawals } = await supabaseAdmin
    .from('AffiliateWithdrawal')
    .select(`
      id, amount, status, payment_method, requested_at, phone,
      Affiliate!inner(code, store_id, user:User(name, email))
    `)
    .eq('Affiliate.store_id', store.id)
    .order('requested_at', { ascending: false })

  // 3. Récupérer les Produits et les Pages de vente pour les commissions spécifiques
  const { data: products } = await supabaseAdmin
    .from('Product')
    .select('id, name, affiliate_active, affiliate_margin')
    .eq('store_id', store.id)

  const { data: salePages } = await supabaseAdmin
    .from('SalePage')
    .select('id, title, affiliate_active, affiliate_margin')
    .eq('store_id', store.id)

  const formattedProducts: OverrideItem[] = (products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    affiliate_active: p.affiliate_active,
    affiliate_margin: p.affiliate_margin,
  }))

  const formattedPages: OverrideItem[] = (salePages || []).map((p: any) => ({
    id: p.id,
    name: p.title,
    affiliate_active: p.affiliate_active,
    affiliate_margin: p.affiliate_margin,
  }))

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      {/* Header Premium */}
      <header className="bg-white border-b border-gray-100 px-6 py-8 md:px-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center text-xl shadow-sm">
                🤝
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Réseau d&apos;Affiliation</h1>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium max-w-xl leading-relaxed">
              Gérez vos ambassadeurs, configurez vos commissions et développez votre force de vente de manière totalement organique.
            </p>
          </div>
        </div>
      </header>

      <div className="w-full px-4 md:px-6 py-8">
        <AffiliateClient
          storeId={store.id}
          storeSlug={store.slug}
          initialActive={store.affiliate_active}
          initialMargin={store.affiliate_margin ?? 0.15}
          initialGamificationActive={store.gamification_active}
          initialGamificationConfig={store.gamification_config}
          affiliates={(affiliates ?? []) as unknown as AffiliateRow[]}
          withdrawals={withdrawals || []}
          products={formattedProducts}
          salePages={formattedPages}
        />
      </div>
    </main>
  )
}
