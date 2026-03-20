import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendTransactionalEmail } from '@/lib/brevo/brevo-service'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { order_id, new_status } = body

    if (!order_id || !new_status) {
      return NextResponse.json({ error: 'Données requises manquantes' }, { status: 400 })
    }

    // Vérifier que le statut est valide (selon l'enum OrderStatus)
    const validStatuses = ['confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(new_status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    // Récupérer le store du vendeur (et son nom pour les emails)
    const { data: store, error: storeError } = await supabase
      .from('Store')
      .select('id, name')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    // Vérifier que la commande appartient bien à cette boutique et récupérer les infos acheteur
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, store_id, buyer_name, buyer_email, buyer_phone')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    if (order.store_id !== store.id) {
      return NextResponse.json({ error: 'Cette commande ne vous appartient pas' }, { status: 403 })
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('Order')
      .update({ status: new_status })
      .eq('id', order_id)

    if (updateError) throw updateError

    // ── 5. NOTIFICATIONS (EMAIL + WHATSAPP) ────────────────────
    const trackingUrl = `${req.headers.get('origin') || 'https://pdvpro.com'}/track?ref=${order_id}`
    
    let emailSubject = ''
    let emailTitle = ''
    let waMessage = ''

    if (new_status === 'preparing') {
      emailSubject = 'Votre commande est en cours de préparation'
      emailTitle = 'Votre commande est en cours de préparation ⏳'
      waMessage = `Bonjour ${order.buyer_name},\n\nVotre commande #${order_id.split('-')[0].toUpperCase()} sur ${store.name || 'PDV Pro'} est en cours de préparation. ⏳\n\nSuivez l'état ici : ${trackingUrl}`
    } else if (new_status === 'shipped') {
      emailSubject = 'Votre commande a été expédiée !'
      emailTitle = 'Votre commande a été expédiée ! 🚚'
      waMessage = `Bonjour ${order.buyer_name},\n\nBonne nouvelle ! Votre commande #${order_id.split('-')[0].toUpperCase()} sur ${store.name || 'PDV Pro'} a été expédiée et est en route ! 🚚\n\nSuivez l'acheminement ici : ${trackingUrl}`
    } else if (new_status === 'delivered') {
      emailSubject = 'Votre commande a été livrée — laissez un avis !'
      emailTitle = 'Votre commande a été livrée ! 🎉'
      waMessage = `Bonjour ${order.buyer_name},\n\nVotre commande #${order_id.split('-')[0].toUpperCase()} sur ${store.name || 'PDV Pro'} a été livrée avec succès ! 🎉\n\nMerci de votre confiance. N'hésitez pas à laisser un avis.\n\nHistorique de la commande : ${trackingUrl}`
    }

    if (emailSubject) {
      // 5.1 Envoi Email via Brevo
      if (order.buyer_email && order.buyer_email.trim()) {
        sendTransactionalEmail({
          to: [{ email: order.buyer_email.trim(), name: order.buyer_name }],
          subject: emailSubject,
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>${emailTitle}</h2>
              <p>Bonjour ${order.buyer_name},</p>
              <p>Le statut de votre commande <strong>#${order_id.split('-')[0].toUpperCase()}</strong> a été mis à jour.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${trackingUrl}" style="background-color: #0F7A60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Suivre ma commande</a>
              </p>
              <p>Merci pour votre confiance dans la boutique ${store.name || 'PDV Pro'} !</p>
            </div>
          `
        }).catch(err => console.error('[Brevo Status Update Error]', err))
      }

      // 5.2 Envoi WhatsApp via l'utilitaire existant
      if (order.buyer_phone) {
        sendWhatsApp({
          to: order.buyer_phone,
          body: waMessage
        }).catch(err => console.error('[WhatsApp Status Update Error]', err))
      }
    }

    return NextResponse.json({ success: true, message: 'Statut mis à jour avec succès' })

  } catch (err: any) {
    console.error('Update order status error:', err)
    return NextResponse.json({ error: err.message || 'Erreur interne du serveur' }, { status: 500 })
  }
}
