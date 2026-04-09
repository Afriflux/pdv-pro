import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processWhatsAppMessage } from '@/lib/whatsapp/bot'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Récupération dynamique du token de vérification
  const supabaseAdmin = createAdminClient()
  const { data: config } = await supabaseAdmin
    .from('PlatformConfig')
    .select('value')
    .eq('key', 'WHATSAPP_VERIFY_TOKEN')
    .single<{ value: string }>()
  
  const verifyToken = config?.value || process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Meta WhatsApp Cloud API format check
    if (body.object !== 'whatsapp_business_account') {
      return new NextResponse('Origin Invalid', { status: 404 })
    }

    const entry = body.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) {
      // It might be a status update (read, delivered, sent). We acknowledge immediately.
      return new NextResponse('EVENT_RECEIVED', { status: 200 })
    }

    const message = messages[0]
    const contact = value.contacts?.[0]
    
    const phone = message.from
    const ProfileName = contact?.profile?.name || ''

    if (message.type !== 'text') {
      // Ignorer les messages audio/images pour l'instant
      return new NextResponse('Ignored', { status: 200 })
    }

    const rawMessage = message.text.body.trim()

    // Tenter de trouver le store_id à partir de la conversation existante
    const conversation = await prisma.whatsappConversation.findFirst({
      where: { phone },
      orderBy: { updated_at: 'desc' } // prend la dernière conversation active
    })

    let storeId: string | undefined = conversation?.store_id

    // Si on détecte un message d'initiative pointant vers un store ('join slug' ou text='... boutique slug')
    // Pour simplifier, on regarde si le message contient un slug de notre DB.
    // Cela se produit souvent lors du premier contact via un lien wa.me prérempli.
    const isJoinIntent = rawMessage.toLowerCase().startsWith('join ')
    
    if (isJoinIntent) {
      const slugRaw = rawMessage.substring(5).trim().toLowerCase()
      const store = await prisma.store.findUnique({ where: { slug: slugRaw } })
      if (store) {
        storeId = store.id
      }
    }

    if (!storeId) {
      // Si la boutique n'est pas connue et pas d'intent Join, on ignore simplement pour Meta
      return new NextResponse('EVENT_RECEIVED', { status: 200 })
    }

    // Process message (Ceci fera désormais l'appel réseau vers Graph API au lieu de retourner du XML)
    await processWhatsAppMessage({
      storeId,
      phone,
      clientName: ProfileName,
      message: rawMessage
    })

    // Meta exige un retour direct HTTP 200 pour accuser réception du Webhook
    return new NextResponse('EVENT_RECEIVED', { status: 200 })
  } catch (err: unknown) {
    console.error('[WhatsApp Bot Webhook] Erreur:', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}
