import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Vérifier si l'utilisateur a déjà une boutique
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: store } = await supabase
        .from('Store')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!store) {
        // Pas de boutique → C'est un nouveau user via Google
        const { cookies } = await import('next/headers')
        const roleCookie = cookies().get('yayyam_onboarding_role')?.value
        const roleQuery = roleCookie ? `&role=${roleCookie}` : ''
        return NextResponse.redirect(`${origin}/register/complete?userId=${user.id}${roleQuery}`)
      }
    }
  }
  
  return NextResponse.redirect(`${origin}/dashboard`)
}
