import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revokeMember } from '@/lib/telegram/community-service'

// Initialisation du client Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    // Vérification basique d'autorisation (Bearer token ou paramètre secret)
    // Dans le cas de Vercel Cron, le Header "Authorization" contient "Bearer CRON_SECRET"
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Pour les tests en local ou requêtes manuelle, on peut passer ?secret=XXX
      const { searchParams } = new URL(request.url)
      if (searchParams.get('secret') !== process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 })
      }
    }

    const now = new Date().toISOString()

    // 1. Trouver tous les membres expirés et encore actifs
    const { data: expiredMembers, error } = await supabaseAdmin
      .from('TelegramMember')
      .select('id, telegram_user_id, chat_id')
      .lt('expires_at', now)
      .eq('status', 'active')

    if (error) {
      console.error('[Cron Telegram Kick] Erreur DB:', error)
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
    }

    if (!expiredMembers || expiredMembers.length === 0) {
      return NextResponse.json({ success: true, message: 'Aucun membre à expulser', count: 0 })
    }

    let kickedCount = 0
    let failedCount = 0

    // 2. Traiter chaque expulsion
    for (const member of expiredMembers) {
      try {
        const userId = parseInt(member.telegram_user_id, 10)
        if (isNaN(userId)) throw new Error('Invalid User ID')

        // Appel à l'API Telegram pour Ban + Unban (expulsion sans blacklist)
        await revokeMember(member.chat_id, userId)

        // 3. Mettre à jour le statut en base de données
        await supabaseAdmin
          .from('TelegramMember')
          .update({ status: 'kicked' })
          .eq('id', member.id)

        kickedCount++
      } catch (err) {
        console.error(`[Cron Telegram Kick] Erreur pour le membre ID ${member.id}:`, err)
        failedCount++
      }
    }

    return NextResponse.json({
      success: true,
      processed: expiredMembers.length,
      kickedCount,
      failedCount,
      timestamp: now
    })

  } catch (error) {
    console.error('[Cron Telegram Kick] Erreur critique:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
