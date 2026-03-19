// ─── app/api/onboarding/complete/route.ts ────────────────────────────────────
// Route POST / GET — Finalisation de l'onboarding vendeur

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
  }

  let body: Record<string, string> = {}
  try {
    body = await req.json()
  } catch {
    // Ignore error if bad json
  }

  const { vendorType, storeName, primaryColor, logoUrl } = body

  // Marquer onboarding_completed = true et stocker les infos
  const updateData: Record<string, string | boolean> = { onboarding_completed: true }
  
  if (vendorType) {
    updateData.vendor_type = vendorType
  }
  if (storeName) {
    updateData.name = storeName
  }
  if (primaryColor) {
    updateData.primary_color = primaryColor
  }
  if (logoUrl) {
    updateData.logo_url = logoUrl
  }

  const { error } = await supabase
    .from('Store')
    .update(updateData)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, redirectTo: '/dashboard' })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  await supabase
    .from('Store')
    .update({ onboarding_completed: true })
    .eq('user_id', user.id)

  return NextResponse.redirect(new URL('/dashboard', req.url))
}
