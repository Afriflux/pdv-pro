'use server'

import { createClient } from '@/lib/supabase/server'

export async function getActiveTips() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Tip')
    .select('*')
    .eq('active', true)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tips:', error)
    return []
  }

  return data || []
}

export async function markTipAsRead(tipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('TipRead')
    .upsert({
      tip_id: tipId,
      user_id: user.id,
      read_at: new Date().toISOString()
    }, {
      onConflict: 'tip_id,user_id'
    })

  if (error) {
    console.error('Error marking tip as read:', error)
    return { error: error.message }
  }

  return { success: true }
}
