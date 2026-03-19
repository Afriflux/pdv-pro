import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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
