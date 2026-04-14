import { GlobalHomeButton } from '@/components/shared/GlobalHomeButton'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PortalSidebar } from '@/components/portal/PortalSidebar'
import { PortalMobileBottomNav } from '@/components/portal/PortalMobileBottomNav'
import GlobalCoach from '@/components/dashboard/GlobalCoach'
import AffiliateContractBanner from '@/components/affiliate/AffiliateContractBanner'


export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  // 1. Récupérer le Profil
  const { data: userProfile } = await supabaseAdmin
    .from('User')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userProfile) {
    redirect('/login')
  }

  // 2. Vérifier le rôle
  if (userProfile.role !== 'affilie') {
    redirect('/dashboard')
  }

  // 3. Vérifier le contrat affilié de manière globale (parmi toutes les boutiques potentielles)
  const { data: affiliates } = await supabaseAdmin
    .from('Affiliate')
    .select('contract_accepted')
    .eq('user_id', user.id)

  const contractAccepted = affiliates && affiliates.length > 0 
    ? affiliates.some(a => a.contract_accepted) 
    : false; // Ajuster selon le besoin réel, par défaut non accepté s'il n'a aucun lien

  // Les affiliés sont désormais multi-vendeurs et globaux
  const storeName = 'Réseau Yayyam'
  const userName = userProfile.name || user.user_metadata?.name || 'Affilié'
  const avatarUrl = userProfile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      <PortalSidebar
        storeName={storeName}
        userName={userName}
        avatarUrl={avatarUrl}
      />

      <main className="relative flex-1 bg-gray-50 min-w-0 h-[100dvh] overflow-y-auto overflow-x-hidden">
        <GlobalHomeButton />

        {/* 🌟 UNIVERSAL MESH BACKGROUND 🌟 */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-300/10 blur-[130px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:10s]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-teal-300/10 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:12s] [animation-delay:2s]" />
        </div>

        {/* Bandeau alerte contrat affilié — affiché uniquement si non signé */}
        {!contractAccepted && (
          <AffiliateContractBanner
            affiliateName={userName}
          />
        )}

        <div className="relative z-10 pt-14 lg:pt-0 pb-24 lg:pb-12 w-full max-w-[2000px] mx-auto px-3 lg:px-8 xl:px-10 min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar Mobile */}
      <PortalMobileBottomNav
        userName={userName}
        storeName={storeName}
        avatarUrl={avatarUrl}
      />

      <GlobalCoach />
    </div>
  )
}
