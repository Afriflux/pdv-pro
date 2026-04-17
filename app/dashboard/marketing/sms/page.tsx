import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSmsDashboard } from '@/app/actions/sms'
import SmsClient from './SmsClient'

export default async function SmsMarketingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // Récupération des SMS Dashboard statiques côté serveur
  const dashboardData = await getSmsDashboard(store.id).catch(() => ({
    credits: 0, used: 0, campaigns: [], stats: { totalLogs: 0, successRate: 0 }
  }))

  const { prisma } = await import('@/lib/prisma')
  const wallet = await prisma.wallet.findFirst({ where: { vendor_id: store.id } })
  const configs = await prisma.platformConfig.findMany({
    where: { key: { in: ['PRICE_SMS_PACK', 'PRICE_SMS_PACK_1000', 'VOLUME_SMS_PACK'] } }
  })

  // Extraction Fallback Pricing
  const getConf = (k: string, def: string) => configs.find(c => c.key === k)?.value || def
  const smsVolume = parseInt(getConf('VOLUME_SMS_PACK', '1000'))
  const smsPrice = parseInt(getConf('PRICE_SMS_PACK', getConf('PRICE_SMS_PACK_1000', '5000')))

  const walletData = wallet ? { balance: wallet.balance, total_earned: wallet.total_earned } : { balance: 0, total_earned: 0 }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 px-6 lg:px-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-emerald-100 text-emerald-700 rounded-[1.2rem] shadow-sm">
              <span className="text-2xl">📱</span>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent tracking-tight">Campagnes WhatsApp</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Créez des campagnes ciblées et communiquez directement par WhatsApp avec vos clients.</p>
            </div>
          </div>
        </header>

        <main className="w-full relative z-10 px-6 lg:px-10 pb-20">
          <SmsClient 
            storeId={store.id} 
            storeName={store.name} 
            initialData={dashboardData} 
            wallet={walletData} 
            smsVolume={smsVolume} 
            smsPrice={smsPrice} 
          />
        </main>
      </div>
    </div>
  )
}
