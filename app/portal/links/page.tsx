import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import LinkGeneratorClient from './LinkGeneratorClient'

export const dynamic = 'force-dynamic'

export default async function LinkGeneratorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  // 1. Récupérer l'entrée Affiliate complète
  const { data: affiliate } = await supabaseAdmin
    .from('Affiliate')
    .select('*, Store:store_id(name, slug)')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl shadow-sm border border-line">
        <h2 className="text-xl font-display font-black text-charcoal mb-2">Non rattaché</h2>
        <p className="text-slate">Vous devez être rattaché à une boutique pour générer des liens.</p>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 space-y-8 animate-fade-in pb-12 pt-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-black text-ink tracking-tight mb-2">Générateur de liens</h1>
        <p className="text-slate text-sm sm:text-base">
          Créez des liens de parrainage pointant vers des pages spécifiques de la boutique <strong className="text-charcoal">{affiliate.Store?.name || 'Boutique'}</strong>.
        </p>
      </div>

      <LinkGeneratorClient 
        storeSlug={affiliate.Store?.slug || ''}
        affiliateCode={affiliate.code}
      />
    </div>
  )
}
