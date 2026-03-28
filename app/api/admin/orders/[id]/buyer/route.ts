import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const supabaseSession = await createClient()
    const { data: { user } } = await supabaseSession.auth.getUser()

    if (!user) return new NextResponse('Non autorisé', { status: 401 })

    // Seul le super_admin, gestionnaire ou support peut modifier les infos client
    const supabaseAdmin = createAdminClient()
    const { data: adminUser } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    const rolesAutorises = ['super_admin', 'gestionnaire', 'support']
    if (!adminUser || !rolesAutorises.includes(adminUser.role)) {
      return new NextResponse('Interdit', { status: 403 })
    }

    const { target, value } = await request.json()
    // target = 'buyer_name' | 'buyer_phone' | 'buyer_email' | 'delivery_address'

    if (!['buyer_name', 'buyer_phone', 'buyer_email', 'delivery_address'].includes(target)) {
      return new NextResponse('Champ invalide', { status: 400 })
    }

    // Récupérer l'ancienne valeur pour le log d'audit
    const { data: oldOrder } = await supabaseAdmin
      .from('Order')
      .select(target)
      .eq('id', id)
      .single()

    // 1. Mettre à jour la commande
    const { error: updateError } = await supabaseAdmin
      .from('Order')
      .update({ [target]: value || null })
      .eq('id', id)

    if (updateError) throw updateError

    // 2. Logger l'action (Gouvernance)
    await supabaseAdmin.from('AdminLog').insert({
      admin_id: user.id,
      action: 'ORDER_BUYER_UPDATED',
      target_type: 'ORDER',
      target_id: id,
      details: {
        field: target,
        oldValue: oldOrder?.[target],
        newValue: value
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API Update Buyer Error]:', err.message)
    return new NextResponse(err.message, { status: 500 })
  }
}
