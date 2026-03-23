import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { walletId, auto_withdraw_enabled, auto_withdraw_threshold, monthly_goal } = body

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 })
    }

    // Build Prisma update payload
    const dataToUpdate: any = {}
    if (auto_withdraw_enabled !== undefined) dataToUpdate.auto_withdraw_enabled = auto_withdraw_enabled
    if (auto_withdraw_threshold !== undefined) dataToUpdate.auto_withdraw_threshold = Number(auto_withdraw_threshold)
    if (monthly_goal !== undefined) dataToUpdate.monthly_goal = Number(monthly_goal)

    // Verify ownership indirectly by fetching the wallet and its associated store
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

    return NextResponse.json({ success: true, wallet: updated })
  } catch (error) {
    console.error('[WALLET_SETTINGS_API] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
