import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/notifications — notifications du vendeur connecté (20 dernières) */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: notifications } = await supabase
    .from('Notification')
    .select('id, type, title, message, read, link, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const unread = (notifications ?? []).filter(n => !n.read).length

  return NextResponse.json({ notifications: notifications ?? [], unread })
}

/** PATCH /api/notifications — marquer toutes comme lues */
export async function PATCH() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  await supabase
    .from('Notification')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return NextResponse.json({ ok: true })
}
