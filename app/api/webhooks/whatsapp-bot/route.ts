import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processWhatsAppMessage } from '@/lib/whatsapp/bot'

export async function POST(req: NextRequest) {
  try {
    const textData = await req.text()
    const searchParams = new URLSearchParams(textData)
    
    const From = searchParams.get('From')
    const Body = searchParams.get('Body')
    const ProfileName = searchParams.get('ProfileName') || ''

    if (!From || !Body) {
      return new NextResponse('Twilio format invalid', { status: 400 })
    }

    const rawMessage = Body.trim()
    const phone = From.replace('whatsapp:', '')

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
      // Message générique si la boutique n'est pas connue
      const responseTwiML = `
        <Response>
          <Message>Bienvenue sur Yayyam WhatsApp. Merci d'utiliser le lien fourni par votre vendeur pour commencer vos achats.</Message>
        </Response>
      `
      return new NextResponse(responseTwiML.trim(), {
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    // Process message
    const twiMLResponse = await processWhatsAppMessage({
      storeId,
      phone,
      clientName: ProfileName,
      message: rawMessage
    })

    return new NextResponse(twiMLResponse, {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (err: unknown) {
    console.error('[WhatsApp Bot Webhook] Erreur:', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}
