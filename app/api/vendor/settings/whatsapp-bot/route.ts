import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { store_id, active, welcome_message, auto_reply, ai_enabled, phone_number } = body

    if (!store_id) {
      return NextResponse.json({ error: 'store_id manquant' }, { status: 400 })
    }

    // Verify ownership
    const store = await prisma.store.findUnique({ where: { id: store_id } })
    if (!store || store.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const botConfig = await prisma.whatsappBot.upsert({
      where: { store_id },
      update: {
        active,
        welcome_message,
        auto_reply,
        ai_enabled,
        phone_number
      },
      create: {
        store_id,
        active,
        welcome_message,
        auto_reply,
        ai_enabled,
        phone_number
      }
    })

    return NextResponse.json({ success: true, botConfig })
  } catch (error: unknown) {
    console.error('[WhatsApp Bot Settings] Error:', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
  }
}
