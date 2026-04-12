import { createAdminClient } from '@/lib/supabase/admin'
import WhatsAppDashboardClient from './WhatsAppDashboardClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WhatsApp | Administration',
}

export const dynamic = 'force-dynamic'

export default async function WhatsAppAdminPage() {
  const supabase = createAdminClient()
  
  const { data: config } = await supabase
    .from('PlatformConfig')
    .select('value')
    .eq('key', 'whatsapp_agents')
    .maybeSingle()

  let initialAgents = []
  if (config?.value) {
    try {
      initialAgents = JSON.parse(config.value)
    } catch {
      initialAgents = []
    }
  }

  return <WhatsAppDashboardClient initialAgents={initialAgents} />
}
