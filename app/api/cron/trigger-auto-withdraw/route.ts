import { verifyCronSecret, cronResponse } from '@/lib/cron/cron-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { logCronExecution } from '@/lib/cron/cronLogger'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: Request) {
  // 1. Secret vérification
  if (!verifyCronSecret(req)) {
    return cronResponse({ error: 'Unauthorized' }, 401)
  }

  let vendorsTriggered = 0
  let affiliatesTriggered = 0
  let closersTriggered = 0

  try {
    // ---------------------------------------------------------
    // 1. VENDORS (Store Wallets)
    // ---------------------------------------------------------
    const vendorWallets = await prisma.wallet.findMany({
      where: {
        auto_withdraw_enabled: true,
        balance: { gt: 0 } // Must have at least something to trigger
      },
      include: {
        vendor: { select: { withdrawal_method: true, withdrawal_number: true, withdrawal_name: true } }
      }
    })

    for (const w of vendorWallets) {
      const threshold = w.auto_withdraw_threshold ?? 50000
      if (w.balance >= threshold) {
        // Validation basique
        if (!w.vendor.withdrawal_number) continue

        // On crée la requête pending et on déduit du balance (Atomic via Transaction)
        await prisma.$transaction(async (tx) => {
          // Verify balance hasn't changed inside transaction
          const currentWallet = await tx.wallet.findUnique({ where: { id: w.id } })
          if (!currentWallet || currentWallet.balance < threshold) return
          
          await tx.wallet.update({
            where: { id: w.id },
            data: {
              balance: { decrement: currentWallet.balance },
              pending: { increment: currentWallet.balance }
            }
          })

          await tx.withdrawal.create({
            data: {
              wallet_id: w.id,
              store_id: w.vendor_id,
              amount: currentWallet.balance,
              status: 'pending',
              payment_method: w.vendor.withdrawal_method || 'wave',
              phone_or_iban: w.vendor.withdrawal_number,
              notes: 'Retrait Automatique',
              requested_at: new Date()
            }
          })
        })
        vendorsTriggered++
      }
    }

    // ---------------------------------------------------------
    // 2. AFFILIATES
    // ---------------------------------------------------------
    // Need to join User to check affiliate_auto_withdraw
    const affiliates = await prisma.affiliate.findMany({
      where: {
        balance: { gt: 0 }
      },
      include: {
        User: { select: { phone: true, affiliate_auto_withdraw: true, affiliate_auto_withdraw_threshold: true, withdrawal_method: true, withdrawal_number: true } }
      }
    })

    for (const aff of affiliates) {
      if (!aff.User?.affiliate_auto_withdraw) continue
      const threshold = aff.User.affiliate_auto_withdraw_threshold ?? 50000
      // @ts-expect-error : Decimal vs Number diff in Prisma
      const currentBalance = Number(aff.balance || 0)

      if (currentBalance >= threshold && aff.User.withdrawal_number) {
        await prisma.$transaction(async (tx) => {
          const currentAff = await tx.affiliate.findUnique({ where: { id: aff.id } })
          const checkBalance = Number(currentAff?.balance || 0)
          if (!currentAff || checkBalance < threshold) return

          await tx.affiliate.update({
            where: { id: aff.id },
            data: { balance: 0 } // Reset balance. Note: Affiliate currently has no 'pending' field strictly typed, we just deduct.
          })

          await tx.affiliateWithdrawal.create({
            data: {
              id: crypto.randomUUID(),
              affiliate_id: aff.id,
              amount: checkBalance,
              status: 'pending',
              payment_method: aff.User.withdrawal_method || 'wave',
              phone: aff.User.withdrawal_number,
              notes: 'Retrait Automatique Affilié',
              requested_at: new Date()
            }
          })
        })
        affiliatesTriggered++
      }
    }

    // ---------------------------------------------------------
    // 3. CLOSERS
    // ---------------------------------------------------------
    const closers = await prisma.user.findMany({
      where: {
        role: 'closer',
        closer_auto_withdraw: true,
        closer_balance: { gt: 0 }
      }
    })

    for (const closer of closers) {
      const threshold = closer.closer_auto_withdraw_threshold ?? 50000
      const currentBalance = Number(closer.closer_balance || 0)

      if (currentBalance >= threshold && closer.withdrawal_number) {
        await prisma.$transaction(async (tx) => {
          const currentUser = await tx.user.findUnique({ where: { id: closer.id } })
          const checkBalance = Number(currentUser?.closer_balance || 0)
          if (!currentUser || checkBalance < threshold) return

          await tx.user.update({
            where: { id: closer.id },
            data: { closer_balance: 0 } // Reset balance.
          })

          await tx.closerWithdrawal.create({
            data: {
              closer_id: closer.id,
              amount: checkBalance,
              status: 'pending',
              payment_method: closer.withdrawal_method || 'wave',
              phone: closer.withdrawal_number,
              notes: 'Retrait Automatique Closer',
              requested_at: new Date()
            }
          })
        })
        closersTriggered++
      }
    }

    await logCronExecution('trigger-auto-withdraw', 'success', `Vendors: ${vendorsTriggered}, Affiliates: ${affiliatesTriggered}, Closers: ${closersTriggered}`)
    
    return cronResponse({
      success: true,
      vendorsTriggered,
      affiliatesTriggered,
      closersTriggered
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CRON trigger-auto-withdraw] Error:', message)
    await logCronExecution('trigger-auto-withdraw', 'error', message)
    return cronResponse({ error: message }, 500)
  }
}
