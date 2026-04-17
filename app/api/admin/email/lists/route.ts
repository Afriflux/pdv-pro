import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { listAllBrevoLists } from '@/lib/brevo/brevo-service'

export async function GET() {
  try {
    const lists = await listAllBrevoLists()
    console.log(`[API Brevo Lists] ${lists.length} listes trouvées:`, JSON.stringify(lists))
    return NextResponse.json({ lists })
  } catch (error: unknown) {
    console.error('[API Brevo Lists] Erreur:', error)
    return NextResponse.json({ lists: [] })
  }
}
