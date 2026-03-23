import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store, error: storeError } = await supabase
    .from('Store')
    .select(`
      id, name, slug, logo_url, primary_color, description, category,
      kyc_status, kyc_document_type, kyc_documents, id_card_url, security_pin,
      updated_at, banner_url,
      notif_new_order, notif_weekly_report, notif_stock_alert,
      social_links,
      meta_pixel_id, tiktok_pixel_id, google_tag_id,
      telegram_chat_id, telegram_notifications,
      withdrawal_method, withdrawal_number, withdrawal_name,
      contract_accepted, contract_accepted_at, vendor_type
    `)
    .eq('user_id', user.id)
    .single()

  if (storeError && storeError.code !== 'PGRST116') {
    console.error('[SettingsPage] Fetch store error:', storeError)
  }

  const { data: profile } = await supabase
    .from('User')
    .select('name, phone, email, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="w-full space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] border border-white shadow-2xl shadow-[#0F7A60]/5 sticky top-2 z-20 overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0F7A60]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-ink to-slate text-white flex items-center justify-center shadow-lg shadow-ink/20 shrink-0">
            <span className="text-2xl md:text-3xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-ink tracking-tight">Paramètres</h1>
            <p className="text-dust text-sm md:text-base font-medium mt-1">
              Gérez votre boutique, votre profil et vos préférences.
            </p>
          </div>
        </div>
      </header>

      <div className="w-full">
        <SettingsForm
          store={store}
          profile={profile ?? { name: '', phone: '', email: null }}
          userId={user.id}
        />
      </div>
    </div>
  )
}
