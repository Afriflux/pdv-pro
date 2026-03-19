import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// ----------------------------------------------------------------
// API : ACTIONS ADMIN SUR VENDEUR
// PATCH /api/admin/vendeurs/[id]
// ----------------------------------------------------------------
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 1. Vérifier le rôle super_admin
    const supabaseAdmin = createAdminClient()
    const { data: adminUser } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { action, reason } = await request.json()
    const vendorId = params.id

    let updateData = {}
    let logAction = ''

    // 2. Traitement selon l'action
    switch (action) {
      case 'suspend':
        updateData = { is_active: false }
        logAction = 'SUSPEND_VENDOR'
        break
      case 'activate':
        updateData = { is_active: true }
        logAction = 'ACTIVATE_VENDOR'
        break
      case 'verify':
        updateData = { kyc_status: 'verified' }
        logAction = 'APPROVE_KYC'
        break
      case 'reject':
        updateData = { kyc_status: 'rejected' }
        logAction = 'REJECT_KYC'
        break
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    // 3. Mise à jour du Store
    const { error: updateError } = await supabaseAdmin
      .from('Store')
      .update(updateData)
      .eq('id', vendorId)

    if (updateError) throw updateError

    // 4. Création du log d'audit
    await supabaseAdmin
      .from('AdminLog')
      .insert({
        admin_id: user.id,
        action: logAction,
        target_type: 'vendor',
        target_id: vendorId,
        details: { reason: reason || null }
      })

    return NextResponse.json({ 
      success: true, 
      action, 
      vendorId 
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[Admin Vendor Action Error]:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
