import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { walletId, auto_withdraw_enabled, auto_withdraw_threshold, monthly_goal, targetContext } = body

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 })
    }

    // Determine context (default to 'vendor')
    const ctx = targetContext || 'vendor'

    if (ctx === 'vendor') {
      const dataToUpdate: any = {}
      if (auto_withdraw_enabled !== undefined) dataToUpdate.auto_withdraw_enabled = auto_withdraw_enabled
      if (auto_withdraw_threshold !== undefined) dataToUpdate.auto_withdraw_threshold = Number(auto_withdraw_threshold)
      if (monthly_goal !== undefined) dataToUpdate.monthly_goal = Number(monthly_goal)

      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
        include: { vendor: true }
      })

      if (!wallet || wallet.vendor.user_id !== user.id) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const updated = await prisma.wallet.update({
        where: { id: walletId },
        data: dataToUpdate
      })
      return NextResponse.json({ success: true, target: 'wallet', updated })
    }

    if (ctx === 'closer') {
      const dataToUpdate: any = {}
      if (auto_withdraw_enabled !== undefined) dataToUpdate.closer_auto_withdraw = auto_withdraw_enabled
      if (auto_withdraw_threshold !== undefined) dataToUpdate.closer_auto_withdraw_threshold = Number(auto_withdraw_threshold)

      // walletId actually matches user.id
      if (walletId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: dataToUpdate
      })
      return NextResponse.json({ success: true, target: 'closer', updated })
    }

    if (ctx === 'affiliate') {
      const dataToUpdate: any = {}
      if (auto_withdraw_enabled !== undefined) dataToUpdate.affiliate_auto_withdraw = auto_withdraw_enabled
      if (auto_withdraw_threshold !== undefined) dataToUpdate.affiliate_auto_withdraw_threshold = Number(auto_withdraw_threshold)

      // walletId matches user.id
      if (walletId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      // @ts-ignore : waiting for Prisma db push on affiliate_auto_withdraw
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: dataToUpdate
      })
      return NextResponse.json({ success: true, target: 'affiliate', updated })
    }

    return NextResponse.json({ error: 'Invalid config targetContext' }, { status: 400 })
  } catch (error) {
    console.error('[WALLET_SETTINGS_API] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
