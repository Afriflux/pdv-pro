import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Store, ArrowRight, ShieldCheck, Banknote, Rocket, Megaphone, Target, PhoneCall, Headphones, DollarSign, Link as LinkIcon } from 'lucide-react'
import { randomUUID } from 'crypto'
import Link from 'next/link'
import { UpgradeFormButton } from '@/components/client/UpgradeFormButton'

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()
  const { data: userData } = await supabaseAdmin.from('User').select('role, name').eq('id', user.id).single()

  if (userData?.role === 'vendeur' || userData?.role === 'affilie') {
    redirect('/dashboard') // Déjà upgrader
  }

  // --- SERVER ACTION : PASSER VENDEUR ---
  async function confirmUpgradeVendor() {
    'use server'
    const supabaseAction = await createClient()
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser()
    if (!actionUser) redirect('/login')

    const sAdmin = createAdminClient()
    const { data: uData } = await sAdmin.from('User').select('role, name').eq('id', actionUser.id).single()

    // 1. Mettre à jour le rôle
    await sAdmin.from('User').update({ role: 'vendeur', updated_at: new Date().toISOString() }).eq('id', actionUser.id)

    // 2. Vérifier s'il a déjà une boutique
    const { data: existingStore } = await sAdmin.from('Store').select('id').eq('user_id', actionUser.id).maybeSingle()
    
    if (!existingStore) {
      const storeId = randomUUID()
      const baseName = uData?.name || 'Ma Boutique'
      const slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + randomUUID().slice(0, 4)

      await sAdmin.from('Store').insert({
          id: storeId,
          user_id: actionUser.id,
          name: baseName,
          slug: slug,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
      })
      await sAdmin.from('Wallet').insert({
          id: randomUUID(),
          vendor_id: storeId,
          balance: 0,
          pending: 0,
          total_earned: 0,
          updated_at: new Date().toISOString(),
      })
    }

    redirect('/dashboard')
  }

  // --- SERVER ACTION : PASSER AFFILIÉ ---
  async function confirmUpgradeAffiliate() {
    'use server'
    const supabaseAction = await createClient()
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser()
    if (!actionUser) redirect('/login')

    const sAdmin = createAdminClient()

    // 1. Mettre à jour le rôle en 'affilie'
    await sAdmin.from('User').update({ role: 'affilie', updated_at: new Date().toISOString() }).eq('id', actionUser.id)
    
    redirect('/portal')
  }

  // --- SERVER ACTION : PASSER CLOSER ---
  async function confirmUpgradeCloser() {
    'use server'
    const supabaseAction = await createClient()
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser()
    if (!actionUser) redirect('/login')

    const sAdmin = createAdminClient()

    // 1. Mettre à jour le rôle en 'closer'
    await sAdmin.from('User').update({ role: 'closer', updated_at: new Date().toISOString() }).eq('id', actionUser.id)
    
    redirect('/closer')
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4">
      
      <div className="w-full max-w-5xl bg-white border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden relative">
        
        {/* En-tête immersif */}
        <div className="bg-[#1A1A1A] px-8 py-14 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0F7A60]/20 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2 opacity-50"></div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white relative z-10 mb-4 tracking-tight leading-tight">
            Générez des revenus avec <span className="text-[#C9A84C]">Yayyam</span>
          </h1>
          <p className="text-gray-400 font-medium relative z-10 max-w-2xl text-[15px]">
            Vous êtes sur le point de transformer votre compte client. Choisissez votre voie : développez votre propre empire, recommandez les meilleurs produits, ou concluez des ventes par téléphone.
          </p>
        </div>

        {/* Contenu - Séparation 3 colonnes */}
        <div className="p-8 lg:p-12 lg:pb-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            
            {/* OPTION A : VENDEUR */}
            <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-8 relative flex flex-col hover:shadow-xl hover:border-emerald-500/30 transition-all group overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-900 group-hover:scale-150 group-hover:-rotate-12 transition-transform duration-700 pointer-events-none">
                <Store size={150} />
              </div>
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-sm border border-emerald-200">
                <Store size={28} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 relative z-10">Créer ma Boutique</h2>
              <p className="text-gray-500 mb-6 text-sm relative z-10 leading-relaxed">
                Devenez Vendeur. Hébergez vos produits, encaissez 100% de vos ventes (moins nos frais minimes) et bénéficiez d'outils analytiques de pointe.
              </p>
              
              <ul className="space-y-3 mb-8 flex-1 relative z-10">
                <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <Banknote className="text-emerald-500 flex-shrink-0" size={18} /> Sans abonnement mensuel
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <Rocket className="text-emerald-500 flex-shrink-0" size={18} /> Tout-en-un clés en main
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <ShieldCheck className="text-emerald-500 flex-shrink-0" size={18} /> Espace indépendant et sécurisé
                </li>
              </ul>

              <div className="relative z-10 mt-auto">
                 <UpgradeFormButton 
                   action={confirmUpgradeVendor} 
                   className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-600/20"
                   confirmationTitle="Créer ma Boutique"
                   confirmationText="Êtes-vous sûr de vouloir créer votre boutique et devenir vendeur sur Yayyam ?"
                   theme="emerald"
                 >
                   Passer Vendeur <ArrowRight size={18} />
                 </UpgradeFormButton>
              </div>
            </div>

            {/* OPTION B : AFFILIÉ */}
            <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-8 relative flex flex-col hover:shadow-xl hover:border-amber-500/30 transition-all group overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-900 group-hover:scale-150 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                <Megaphone size={150} />
              </div>
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-sm border border-amber-200">
                <Megaphone size={28} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 relative z-10">Devenir Affilié</h2>
              <p className="text-gray-500 mb-6 text-sm relative z-10 leading-relaxed">
                Faites la promotion des produits phares de la marketplace. Aucun stock, aucun SAV. Partagez simplement vos liens et encaissez vos commissions.
              </p>
              
              <ul className="space-y-3 mb-8 flex-1 relative z-10">
                <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <Target className="text-amber-500 flex-shrink-0" size={18} /> Accès au Catalogue global
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <LinkIcon className="text-amber-500 flex-shrink-0" size={18} /> Liens de tracking sécurisés
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <Banknote className="text-amber-500 flex-shrink-0" size={18} /> Retraits ultra-rapides
                </li>
              </ul>

              <div className="relative z-10 mt-auto">
                 <UpgradeFormButton 
                   action={confirmUpgradeAffiliate} 
                   className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20"
                   confirmationTitle="Devenir Partenaire"
                   confirmationText="Êtes-vous sûr de vouloir devenir partenaire affilié sur Yayyam ?"
                   theme="amber"
                 >
                   Devenir Partenaire <ArrowRight size={18} />
                 </UpgradeFormButton>
              </div>
            </div>

            {/* OPTION C : CLOSER */}
            <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-8 relative flex flex-col hover:shadow-xl hover:border-blue-500/30 transition-all group overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-900 group-hover:scale-150 group-hover:rotate-6 transition-transform duration-700 pointer-events-none">
                <Headphones size={150} />
              </div>
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-sm border border-blue-200">
                <PhoneCall size={28} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 relative z-10">Devenir Closer</h2>
              <p className="text-gray-500 mb-6 text-sm relative z-10 leading-relaxed">
                Appelez des prospects chauds (paniers abandonnés) et concluez des ventes High-Ticket pour toucher des commissions massives.
              </p>
              
              <ul className="space-y-3 mb-8 flex-1 relative z-10">
                <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <PhoneCall className="text-blue-500 flex-shrink-0" size={18} /> Leads qualifiés fournis
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <DollarSign className="text-blue-500 flex-shrink-0" size={18} /> Commissions High-Ticket
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <Target className="text-blue-500 flex-shrink-0" size={18} /> CRM de prospection inclus
                </li>
              </ul>

              <div className="relative z-10 mt-auto">
                 <UpgradeFormButton 
                   action={confirmUpgradeCloser} 
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20"
                   confirmationTitle="Devenir Closer"
                   confirmationText="Êtes-vous sûr de vouloir devenir Closer (Expert en vente) sur Yayyam ?"
                   theme="blue"
                 >
                   Devenir Closer <ArrowRight size={18} />
                 </UpgradeFormButton>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-center">
            <Link href="/client" className="text-gray-400 font-bold hover:text-gray-900 transition-colors flex items-center gap-2">
               Annuler, je préfère rester simple Acheteur pour le moment
            </Link>
          </div>

        </div>

      </div>

    </div>
  )
}
