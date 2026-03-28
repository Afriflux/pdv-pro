import { createAdminClient } from '@/lib/supabase/admin'

export async function logCronExecution(cronName: string, status: 'success' | 'error', message?: string) {
  const supabase = createAdminClient()

  const now = new Date().toISOString()
  const payload = JSON.stringify({ status, time: now, message })
  const keyName = `cron_${cronName}`

  const { data: exist } = await supabase
    .from('PlatformConfig')
    .select('id')
    .eq('key', keyName)
    .limit(1)
    .single()

  if (exist) {
    await supabase.from('PlatformConfig').update({ value: payload, commission_rate: 0 }).eq('id', exist.id)
  } else {
    await supabase.from('PlatformConfig').insert([{ key: keyName, value: payload, commission_rate: 0 }])
  }
}
