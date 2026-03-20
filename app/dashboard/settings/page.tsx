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
    <main className="min-h-screen bg-cream">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-ink">Paramètres</h1>
      </header>
      <div className="w-full p-6 space-y-6 bg-[#FAFAF7] min-h-screen">
        <SettingsForm
          store={store}
          profile={profile ?? { name: '', phone: '', email: null }}
          userId={user.id}
        />
      </div>
    </main>
  )
}
