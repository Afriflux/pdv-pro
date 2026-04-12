// ─── app/api/wallet/withdraw/route.ts ────────────────────────────────────────
// Route POST — Demande de retrait vendeur
// Lit withdrawal_method/number/name depuis Store (plus de champs côté client)
// Met à jour Wallet : balance -= amount, pending += amount

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WithdrawBody {
  amount:  number
  storeId: string
}

const MIN_AMOUNT = 5000

const METHOD_LABELS: Record<string, string> = {
  wave:         'Wave',
  orange_money: 'Orange Money',
  bank:         'Virement bancaire',
}

// ─── POST /api/wallet/withdraw ────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth vendeur
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Vous devez être connecté.' }, { status: 401 })
    }

    // 2. Parser le body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Body JSON invalide.' }, { status: 400 })
    }

    const { amount, storeId } = body as WithdrawBody

    // 3. Validation basique du montant
    if (!amount || typeof amount !== 'number' || amount < MIN_AMOUNT) {
      return NextResponse.json(
        { success: false, error: `Montant minimum de retrait : ${MIN_AMOUNT.toLocaleString('fr-FR')} FCFA.` },
        { status: 400 }
      )
    }

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'storeId manquant.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 4. Récupérer le Store et vérifier l'appartenance au vendeur connecté
    const { data: store, error: storeErr } = await supabaseAdmin
      .from('Store')
      .select('id, name, user_id, kyc_status, withdrawal_method, withdrawal_number, withdrawal_name, telegram_notifications')
      .eq('id', storeId)
      .single()

    if (storeErr || !store) {
      return NextResponse.json({ success: false, error: 'Boutique introuvable.' }, { status: 404 })
    }

    // Vérifier que le store appartient bien au vendeur connecté (sécurité)
    if ((store.user_id as string) !== user.id) {
      return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })
    }

    // Vérifier KYC statut
    if (store.kyc_status !== 'verified') {
      return NextResponse.json({ success: false, error: 'Votre identité (KYC) doit être vérifiée avant de pouvoir retirer des fonds.' }, { status: 403 })
    }

    // 5. Vérifier que le compte de retrait est configuré
    if (!store.withdrawal_number?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configurez votre compte de retrait dans les Paramètres avant de demander un retrait.',
        },
        { status: 400 }
      )
    }

    // 6. Récupérer le Wallet (pour vérifier son existence)
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('Wallet')
      .select('id, balance')
      .eq('vendor_id', store.id)
      .single()

    if (walletErr || !wallet) {
      return NextResponse.json({ success: false, error: 'Portefeuille introuvable.' }, { status: 404 })
    }

    const currentBalance = Number(wallet.balance) || 0

    // 7. Vérification rapide du solde (pré-check, la RPC vérifie aussi)
    if (currentBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Solde insuffisant. Disponible : ${currentBalance.toLocaleString('fr-FR')} FCFA.`,
        },
        { status: 400 }
      )
    }

    // 8. Débit atomique du Wallet via RPC (balance -= amount, pending += amount)
    //    Retourne FALSE si solde insuffisant (protection contre double-clic)
    const { data: debited, error: debitErr } = await supabaseAdmin
      .rpc('debit_wallet', {
        p_vendor_id: store.id,
        p_amount:    amount,
      })

    if (debitErr || !debited) {
      return NextResponse.json(
        { success: false, error: 'Solde insuffisant ou opération concurrente. Réessayez.' },
        { status: 400 }
      )
    }

    const methodLabel = METHOD_LABELS[store.withdrawal_method as string] ?? 'Wave'

    // Payout automatique via Wave/CinetPay — intégré dans /api/admin/retraits/[id]
    // 9. Notification Telegram au vendeur (fire-and-forget)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId        = store.telegram_notifications as string | null

    if (telegramToken && chatId) {
      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id: chatId,
          text:
            `💸 *Retrait en cours de traitement*\n\n` +
            `💰 Montant : *${amount.toLocaleString('fr-FR')} FCFA*\n` +
            `📱 Via : ${methodLabel}\n` +
            `📞 Vers : ${store.withdrawal_number as string}\n` +
            `⏱️ Délai estimé : 24–48h`,
          parse_mode: 'Markdown',
        }),
      }).catch((e) => {
        console.warn('[Withdraw] Telegram notification failed:', e)
      })
    }

    // 10. Retour succès
    return NextResponse.json(
      {
        success:    true,
        message:    'Retrait en cours de traitement',
        newBalance: currentBalance - amount,
      },
      { status: 200 }
    )

  } catch (error: unknown) {

    console.error('[Withdraw API]', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
