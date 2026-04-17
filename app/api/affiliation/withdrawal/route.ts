import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// ----------------------------------------------------------------
// TYPES INTERNES
// ----------------------------------------------------------------

type WithdrawalMethod = 'wave' | 'orange_money' | 'bank'

interface WithdrawalBody {
  amount: number
  method: WithdrawalMethod
  phoneOrIban: string
}

// ----------------------------------------------------------------
// API : DEMANDE DE RETRAIT AFFILIATION
// POST /api/affiliation/withdrawal
// ----------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const supabaseContext = await createClient()
    const { data: { user } } = await supabaseContext.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body: WithdrawalBody = await request.json()
    const { amount, method, phoneOrIban } = body

    const supabaseAdmin = createAdminClient()

    // 1. Récupérer le store_id
    const { data: store, error: storeError } = await supabaseAdmin
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    // 2. Récupérer le profil affilié
    const { data: affiliate, error: affError } = await supabaseAdmin
      .from('Affiliate')
      .select('*')
      .eq('store_id', store.id)
      .single()

    if (affError || !affiliate) {
      return NextResponse.json({ error: 'Profil affilié introuvable' }, { status: 404 })
    }

    // 3. Validations métier
    if (!amount || amount < 5000) {
      return NextResponse.json(
        { error: 'Le montant minimum de retrait est de 5 000 FCFA' },
        { status: 400 }
      )
    }

    if (affiliate.balance < amount) {
      return NextResponse.json(
        { error: 'Solde insuffisant pour ce retrait' },
        { status: 400 }
      )
    }

    const validMethods: WithdrawalMethod[] = ['wave', 'orange_money', 'bank']
    if (!validMethods.includes(method)) {
      return NextResponse.json({ error: 'Méthode de retrait invalide' }, { status: 400 })
    }

    if (!phoneOrIban || phoneOrIban.trim() === '') {
      return NextResponse.json({ error: 'Coordonnées de paiement (téléphone ou IBAN) requises' }, { status: 400 })
    }

    // 4. TRANSACTION ATOMIQUE PRISMA (Anti-Fraude Multi-Clonage)
    // Sécurise contre un script envoyant 100 requêtes asynchrones en 1 ms
    try {
      await prisma.$transaction(async (tx) => {
        // Déduction stricte et atomique (Lock gte: amount)
        const updateResult = await tx.affiliate.updateMany({
          where: { id: affiliate.id, balance: { gte: amount } },
          data: { balance: { decrement: amount } }
        })

        if (updateResult.count === 0) {
          throw new Error('INSUFFICIENT_BALANCE')
        }

        // Log de la Transaction
        await tx.affiliateTransaction.create({
          data: {
             affiliate_id: affiliate.id,
             type: 'withdrawal',
             amount: amount,
             status: 'pending',
             description: `Retrait vers ${method.toUpperCase()} - ${phoneOrIban}`
          }
        })

        // Créer l'entrée backend de retrait
        const withdrawalId = `AFF_WTD_${Date.now()}`
        await tx.affiliateWithdrawal.create({
          data: {
             id: withdrawalId,
             affiliate_id: affiliate.id,
             amount: amount,
             payment_method: method,
             phone: phoneOrIban,
             status: 'pending'
          }
        }).catch(() => {
          console.warn('[Affiliate WTD] Fallback si table AffiliateWithdrawal vide')
        })
      })
    } catch (txError: any) {
       if (txError.message === 'INSUFFICIENT_BALANCE') {
         return NextResponse.json({ error: 'Solde insuffisant pour ce retrait' }, { status: 400 })
       }
       throw txError
    }

    const newBalance = affiliate.balance - amount

    return NextResponse.json({
      success: true,
      newBalance,
      message: 'Votre demande de retrait a été enregistrée avec succès'
    })

  } catch (error: unknown) {

    console.error('[Affiliate Withdrawal Error]:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
