import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getRateLimitStatus } from '@/lib/rate-limit'

export async function GET(request: Request) {
  // Rate limit: 20 requêtes max par minute par IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { success } = await getRateLimitStatus(`slug_${ip}`, 20, 60000)
  if (!success) {
    return NextResponse.json({ available: false, error: 'Trop de requêtes' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ available: false }, { status: 400 })
  }

  const supabase = await createClient()
  
  // Vérifier si le slug existe déjà
  const { data, error } = await supabase
    .from('Store')
    .select('id')
    .eq('slug', slug.toLowerCase())
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
     console.error('Check slug error:', error)
     return NextResponse.json({ available: false })
  }

  return NextResponse.json({ available: !data })
}
