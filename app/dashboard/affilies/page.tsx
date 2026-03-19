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

export default async function AffiliesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()

  // 1. Récupérer le store du vendeur via Supabase
  const { data: store } = await supabaseAdmin
    .from('Store')
    .select('id, slug, affiliate_active, affiliate_margin')
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

  return (
    <>
      <header className="bg-white border-b border-line shadow-sm px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-ink text-xl font-bold">Programme d&apos;Affiliation</h1>
          </div>
        </div>
      </header>

      <div className="w-full p-6">
        <AffiliateClient
          storeId={store.id}

          initialActive={store.affiliate_active}
          initialMargin={store.affiliate_margin ?? 0.15}
          affiliates={(affiliates ?? []) as unknown as AffiliateRow[]}
        />
      </div>
    </>
  )
}
