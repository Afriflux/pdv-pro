import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const supabaseAdmin = createAdminClient()

    // Downgrade to client
    await supabaseAdmin
      .from('User')
      .update({ role: 'client', updated_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.redirect(new URL('/client', req.url))
  } catch (error) {
    console.error('[API Switch To Buyer Error]', error)
    return NextResponse.redirect(new URL('/dashboard?error=switch_failed', req.url))
  }
}
