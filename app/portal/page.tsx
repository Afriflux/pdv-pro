import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'

const PortalClient = nextDynamic(() => import('./PortalClient'), { ssr: false, loading: () => <div className="animate-pulse h-[500px] w-full bg-gray-50"/> })

export const dynamic = 'force-dynamic'

export default async function AffiliatePortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  // 1. Récupérer l'entrée Affiliate complète
  const { data: affiliate } = await supabaseAdmin
    .from('Affiliate')
    .select('*, Store:store_id(name, slug, logo_url, gamification_active, gamification_config)')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    // Si l'utilisateur est rôle affilie mais n'a pas encore de lien, on le dit.
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl shadow-sm border border-line">
        <h2 className="text-xl font-display font-black text-charcoal mb-2">Compte en attente de validation</h2>
        <p className="text-slate mb-6">Vous n'êtes pas encore rattaché formellement à une boutique.</p>
      </div>
    )
  }

  // 2. Récupérer les 10 dernières commandes générées par ce token
  const { data: recentOrders } = await supabaseAdmin
    .from('Order')
    .select('id, created_at, total, affiliate_amount, status, buyer_name')
    .eq('affiliate_token', affiliate.token)
    .order('created_at', { ascending: false })
    .limit(10)

  // 3. Gains du mois en cours
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthOrders } = await supabaseAdmin
    .from('Order')
    .select('affiliate_amount')
    .eq('affiliate_token', affiliate.token)
    .gte('created_at', startOfMonth.toISOString())

  const thisMonthEarnings = (monthOrders || []).reduce((sum, o) => sum + Number(o.affiliate_amount || 0), 0)

  // 4. Classement (Leaderboard) : Top 5 affiliés
  const { data: topAffiliates } = await supabaseAdmin
    .from('Affiliate')
    .select('id, total_earned, User:user_id(name, avatar_url)')
    .order('total_earned', { ascending: false })
    .limit(5)

  return (
    <main className="min-h-screen bg-[#FAFAF7] font-sans pb-20 relative animate-fade-in">
      {/* Ambient BG Glows */}
      <div className="absolute top-0 left-10 w-[600px] h-[600px] bg-[#0F7A60]/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-0 w-[500px] h-[500px] bg-[#C9A84C]/[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* ── SECTION 1 : HEADER ───────────────────────────────────────────── */}
      <header className="bg-white/70 backdrop-blur-2xl border-b border-gray-100 px-6 lg:px-10 py-8 relative z-10 w-full mb-8">
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
              Tableau de bord
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-2">
              Bienvenue dans votre espace partenaire <strong className="text-[#1A1A1A]">{affiliate.Store?.name || 'Boutique'}</strong>
            </p>
          </div>
        </div>
      </header>

      <div className="w-full px-6 lg:px-10">
        <PortalClient 
          affiliate={affiliate} 
          recentOrders={recentOrders || []} 
          thisMonthEarnings={thisMonthEarnings}
          topAffiliates={topAffiliates || []}
        />
      </div>
    </main>
  )
}
