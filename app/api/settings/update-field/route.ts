import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_FIELDS = [
  'meta_pixel_id',
  'tiktok_pixel_id',
  'google_tag_id',
  'whatsapp',
  'telegram_chat_id',
  'name',
  'description',
  'primary_color',
  'logo_url',
  'banner_url',
  'vendor_type'
]

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { field, value } = body

    if (!field || typeof field !== 'string' || !ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json({ error: 'Champ non autorisé ou invalide' }, { status: 400 })
    }

    const updatePayload = {
      [field]: value || null,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('Store')
      .update(updatePayload)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Erreur Supabase update-field:', updateError)
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Erreur API update-field:', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
