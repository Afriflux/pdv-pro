// ─── app/api/settings/withdrawal/route.ts ────────────────────────────────────
// Route PATCH — Mettre à jour les coordonnées de retrait du vendeur
// Body : { withdrawalMethod, withdrawalNumber, withdrawalName }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WithdrawalBody {
  withdrawalMethod: 'wave' | 'orange_money' | 'bank'
  withdrawalNumber: string
  withdrawalName:   string
}

const VALID_METHODS = ['wave', 'orange_money', 'bank'] as const

// ─── PATCH /api/settings/withdrawal ─────────────────────────────────────────

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth vendeur
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
    }

    // 2. Parser le body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Body JSON invalide.' }, { status: 400 })
    }

    const { withdrawalMethod, withdrawalNumber, withdrawalName } = body as WithdrawalBody

    // 3. Valdations
    if (!withdrawalMethod || !VALID_METHODS.includes(withdrawalMethod)) {
      return NextResponse.json(
        { success: false, error: 'Méthode de retrait invalide.' },
        { status: 400 }
      )
    }

    if (!withdrawalNumber?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le numéro de compte est obligatoire.' },
        { status: 400 }
      )
    }

    if (!withdrawalName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le nom du titulaire est obligatoire.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 4. Vérifier que le store du vendeur existe
    const { data: store, error: storeErr } = await supabaseAdmin
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (storeErr || !store) {
      return NextResponse.json(
        { success: false, error: 'Boutique introuvable.' },
        { status: 404 }
      )
    }

    // 5. Mettre à jour les colonnes de retrait sur Store
    const { error: updateErr } = await supabaseAdmin
      .from('Store')
      .update({
        withdrawal_method: withdrawalMethod,
        withdrawal_number: withdrawalNumber.trim(),
        withdrawal_name:   withdrawalName.trim(),
        updated_at:        new Date().toISOString(),
      })
      .eq('id', store.id)

    if (updateErr) {
      console.error('[settings/withdrawal] Erreur update:', updateErr.message)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la sauvegarde.' },
        { status: 500 }
      )
    }

    console.log(
      `[settings/withdrawal] Mis à jour → méthode=${withdrawalMethod}` +
      ` numéro=${withdrawalNumber.trim()} (store=${store.id})`
    )

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[settings/withdrawal]', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
