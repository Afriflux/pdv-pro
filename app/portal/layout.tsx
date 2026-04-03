import { GlobalHomeButton } from '@/components/shared/GlobalHomeButton'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PortalSidebar } from '@/components/portal/PortalSidebar'
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
  const storeName = 'Réseau PDV Pro'
  const userName = userProfile.name || user.user_metadata?.name || 'Affilié'
  const avatarUrl = userProfile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null

  return (
    <div className="flex min-h-screen bg-[#FAFAF7]">
      <PortalSidebar
        storeName={storeName}
        userName={userName}
        avatarUrl={avatarUrl}
      />

      <main className="relative flex-1 bg-[#FAFAF7] min-w-0 min-h-screen overflow-auto">
        <GlobalHomeButton />
        {/* Bandeau alerte contrat affilié — affiché uniquement si non signé */}
        {!contractAccepted && (
          <AffiliateContractBanner
            affiliateName={userName}
          />
        )}

        <div className="pt-14 lg:pt-0 pb-12">
          {children}
        </div>
      </main>

      <GlobalCoach />
    </div>
  )
}
