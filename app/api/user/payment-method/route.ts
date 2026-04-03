import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { method, number } = body

    await prisma.user.update({
      where: { id: user.id },
      data: {
        client_payment_method: method,
        client_payment_number: number,
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API Error updating payment method:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
