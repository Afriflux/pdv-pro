import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
import { listAllBrevoLists } from '@/lib/brevo/brevo-service'

const ADMIN_ROLES = ['super_admin', 'gestionnaire', 'support']

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_ROLES.includes(user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const lists = await listAllBrevoLists()
    console.log(`[API Brevo Lists] ${lists.length} listes trouvées:`, JSON.stringify(lists))
    return NextResponse.json({ lists })
  } catch (error: unknown) {
    console.error('[API Brevo Lists] Erreur:', error)
    return NextResponse.json({ lists: [] })
  }
}
