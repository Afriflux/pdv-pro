import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsLayout } from './SettingsLayout'

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

  // Extraction intelligente du numéro de téléphone
  const extractPhone = () => {
    if (profile?.phone) return profile.phone
    if (user.phone) return '+' + user.phone.replace('+', '')
    if (user.email) {
      // Cherche une suite d'au moins 8 chiffres (avec ou sans '+' initial)
      const match = user.email.match(/(\+?\d{8,})/)
      if (match) {
        let num = match[1]
        // Si c'est un numéro sénégalais local à 9 chiffres (commence par 70, 75, 76, 77, 78)
        if (/^7[05678]\d{7}$/.test(num)) {
          num = '+221' + num
        } else if (!num.startsWith('+')) {
          num = '+' + num
        }
        return num
      }
    }
    return ''
  }

  const realPhone = extractPhone()

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)]">
      {/* 🌟 MESH BACKGROUND DYNAMIQUE COSMÉTIQUE 🌟 */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAFAFA]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 blur-[130px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/15 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-300/10 blur-[100px] pointer-events-none mix-blend-multiply" />
      </div>

      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 px-6 lg:px-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-[#0F7A60] shadow-[0_8px_30px_rgb(15,122,96,0.12)] border border-white">
               <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Paramètres</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">
                Gérez votre boutique, votre profil et vos préférences métier.
              </p>
            </div>
          </div>
        </header>

        <div className="w-full relative z-10">
        <SettingsLayout
          store={store}
          profile={{
            ...(profile ?? {}),
            name: profile?.name || '',
            phone: realPhone,
            email: profile?.email || user.email || null
          }}
          userId={user.id}
        />
        </div>
      </div>
    </div>
  )
}
