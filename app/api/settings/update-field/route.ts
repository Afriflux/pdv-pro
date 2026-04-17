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
  'vendor_type',
  'geo',
  'notif_new_order',
  'notif_weekly_report',
  'notif_stock_alert',
  'contract_accepted'
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

    // ── BLOCAGE MENSUEL POUR VENDOR_TYPE ──
    if (field === 'vendor_type') {
      const { data: storeData, error: storeError } = await supabase
        .from('Store')
        .select('vendor_type_updated_at')
        .eq('user_id', user.id)
        .single()
      
      if (!storeError && storeData?.vendor_type_updated_at) {
        // Obtenir la différence en jours
        const lastUpdated = new Date(storeData.vendor_type_updated_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - lastUpdated.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays < 30) {
          return NextResponse.json(
            { error: `Vous ne pouvez modifier votre modèle économique qu'une fois tous les 30 jours. Prochain changement possible dans ${30 - diffDays + 1} jour(s).` }, 
            { status: 403 }
          )
        }
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (field === 'contract_accepted') {
      updatePayload['contract_accepted'] = true
      updatePayload['contract_accepted_at'] = new Date().toISOString()
    } else if (field === 'geo') {
      updatePayload['base_country'] = value?.base_country || 'SN'
      updatePayload['target_countries'] = Array.isArray(value?.target_countries) ? value.target_countries : []
    } else if (value === 'true') {
      updatePayload[field] = true
    } else if (value === 'false') {
      updatePayload[field] = false
    } else {
      updatePayload[field] = value || null
    }

    // Si on met à jour le vendor_type, on actualise aussi la date de modification
    if (field === 'vendor_type') {
      updatePayload['vendor_type_updated_at'] = new Date().toISOString()
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
