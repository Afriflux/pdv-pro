import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  resolveOrderCommission,
  canAcceptCOD,
} from '@/lib/commission/commission-service'
import { notifyNewOrder, notifyNewAffiliateSale } from '@/lib/notifications/createNotification'
import { sendTransactionalEmail } from '@/lib/brevo/brevo-service'
import { orderConfirmationEmail } from '@/lib/brevo/email-templates'
import { sendWhatsApp, msgVendorNewOrder, msgOrderConfirmed } from '@/lib/whatsapp/sendWhatsApp'
import { sendSaleNotification } from '@/lib/telegram/community-service'
import { executeWorkflows } from '@/lib/workflows/execution'

function roundTo5(amount: number): number {
  return Math.ceil(amount / 5) * 5
}

async function initiateCinetPay(params: { amount: number, orderId: string, buyerName: string, buyerPhone: string, productName: string, returnUrl: string, notifyUrl: string }) {
  const apiKey = process.env.CINETPAY_API_KEY!
  const siteId = process.env.CINETPAY_SITE_ID!
  const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: apiKey, site_id: siteId, transaction_id: params.orderId,
      amount: roundTo5(params.amount), currency: 'XOF', description: params.productName,
      return_url: params.returnUrl, notify_url: params.notifyUrl,
      customer_name: params.buyerName.split(' ')[0],
      customer_surname: params.buyerName.split(' ').slice(1).join(' ') || '-',
      customer_phone_number: params.buyerPhone,
    }),
  })
  const data = await res.json()
  if (data.code !== '201') throw new Error('CinetPay: ' + (data.message ?? 'Erreur inconnue'))
  return data.data.payment_url as string
}

async function initiatePayTech(params: { amount: number, orderId: string, productName: string, returnUrl: string, notifyUrl: string }) {
  const apiKey = process.env.PAYTECH_API_KEY!
  const apiSecret = process.env.PAYTECH_API_SECRET!
  const res = await fetch('https://paytech.sn/api/payment/request-payment', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'API_KEY': apiKey, 'API_SECRET': apiSecret },
    body: JSON.stringify({
      item_name: params.productName, item_price: String(Math.round(params.amount)),
      currency: 'XOF', ref_command: params.orderId, ipn_url: params.notifyUrl,
      success_url: params.returnUrl, cancel_url: params.returnUrl + '&cancelled=true',
      env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
    }),
  })
  const data = await res.json()
  if (data.success !== 1) throw new Error('PayTech: ' + (data.errors?.[0] ?? 'Erreur inconnue'))
  return data.redirect_url as string
}

async function initiateWave(params: { amount: number, orderId: string, productName: string, successUrl: string, errorUrl: string }) {
  const apiKey = process.env.WAVE_API_KEY!
  const res = await fetch('https://api.wave.com/v1/checkout/sessions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      amount: String(Math.round(params.amount)), currency: 'XOF',
      error_url: params.errorUrl, success_url: params.successUrl, client_reference: params.orderId,
    }),
  })
  const data = await res.json()
  if (!data.wave_launch_url) throw new Error('Wave: ' + (data.message ?? 'Erreur inconnue'))
  return data.wave_launch_url as string
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    if (!bodyText) return NextResponse.json({ error: 'Body vide.' }, { status: 400 })
    const body = JSON.parse(bodyText) as Record<string, any>

    const {
      product_id, store_id, variant_id, quantity = 1,
      buyer_name, buyer_email, buyer_phone, delivery_address, delivery_zone_id,
      payment_method, applied_promo_id, affiliate_token, affiliate_subid,
      booking_date, booking_start_time, booking_end_time,
      bump_product_id
    } = body

    if (!product_id || !store_id || !buyer_name || !buyer_phone || !payment_method) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    // ── 1. VALIDATION SERVEUR DU PRODUIT & STOCK ──────────────────
    const product = await prisma.product.findUnique({ where: { id: product_id } })
    if (!product || !product.active || product.store_id !== store_id) {
      return NextResponse.json({ error: 'Produit introuvable ou inactif.' }, { status: 404 })
    }

    let basePrice = product.price
    if (variant_id) {
      const variantData = await prisma.productVariant.findUnique({ where: { id: variant_id } })
      if (!variantData || variantData.product_id !== product_id) {
        return NextResponse.json({ error: 'Variante introuvable.' }, { status: 404 })
      }
      if (variantData.stock < quantity) {
        return NextResponse.json({ error: 'Stock insuffisant pour cette option.' }, { status: 400 })
      }
      basePrice += variantData.price_adjust
    }

    let bumpProduct = null
    if (bump_product_id) {
      bumpProduct = await prisma.product.findUnique({ where: { id: bump_product_id } })
      if (!bumpProduct || !bumpProduct.active || bumpProduct.store_id !== store_id) {
        return NextResponse.json({ error: 'Produit additionnel invalide.' }, { status: 400 })
      }
    }

    const grossSubtotal = (basePrice * quantity) + (bumpProduct ? bumpProduct.price : 0)
    let promoDiscountAmount = 0
    let promoAffiliateId: string | null = null

    // ── 2. VALIDATION SERVEUR DU CODE PROMO ───────────────────────
    if (applied_promo_id) {
      const promo = await prisma.promoCode.findUnique({ where: { id: applied_promo_id } })
      if (!promo || !promo.active || promo.store_id !== store_id) {
        return NextResponse.json({ error: 'Code promo invalide.' }, { status: 400 })
      }
      if (promo.expires_at && promo.expires_at < new Date()) {
        return NextResponse.json({ error: 'Code promo expiré.' }, { status: 400 })
      }
      if (promo.max_uses && promo.uses >= promo.max_uses) {
        return NextResponse.json({ error: 'Ce code a atteint sa limite d\'utilisation.' }, { status: 400 })
      }
      if (promo.min_order && grossSubtotal < promo.min_order) {
        return NextResponse.json({ error: `Minimum requis de ${promo.min_order} FCFA.` }, { status: 400 })
      }
      if (promo.product_ids && promo.product_ids.length > 0 && !promo.product_ids.includes(product_id)) {
        return NextResponse.json({ error: 'Non applicable sur ce produit.' }, { status: 400 })
      }

      if (promo.type === 'percentage') {
        promoDiscountAmount = (grossSubtotal * promo.value) / 100
      } else {
        promoDiscountAmount = promo.value
      }
      if (promoDiscountAmount > grossSubtotal) promoDiscountAmount = grossSubtotal

      if (promo.affiliate_id) {
        promoAffiliateId = promo.affiliate_id
      }
    }

    const subtotal = Math.max(0, grossSubtotal - promoDiscountAmount)

    // ── 3. VALIDATION TYPE DE PRODUIT & FRAIS DE LIVRAISON ────────
    let deliveryFee = 0
    if (product.type === 'physical') {
      if (payment_method !== 'cod' && !delivery_address) {
        return NextResponse.json({ error: 'Adresse de livraison requise.' }, { status: 400 })
      }
      if (delivery_zone_id) {
        const zone = await prisma.deliveryZone.findUnique({ where: { id: delivery_zone_id } })
        if (!zone || !zone.active || zone.store_id !== store_id) {
          return NextResponse.json({ error: 'Zone impossible.' }, { status: 400 })
        }
        deliveryFee = zone.fee
      }
    } else if (product.type === 'coaching') {
      if (!booking_date || !booking_start_time || !booking_end_time) {
        return NextResponse.json({ error: 'Informations de coaching manquantes.' }, { status: 400 })
      }
      
      const parsedDate = new Date(`${booking_date}T00:00:00.000Z`)

      // Check capacity bounds
      const currentBookings = await prisma.booking.count({
        where: {
          product_id: product_id,
          booking_date: parsedDate,
          start_time: booking_start_time,
          end_time: booking_end_time,
          status: { in: ['pending', 'confirmed'] }
        }
      })
      
      const maxAllowed = product.coaching_type === 'group' ? (product.max_participants || 10) : 1
      if (currentBookings >= maxAllowed) {
        return NextResponse.json({ error: 'Désolé, ce créneau vient d\'être completé ! Veuillez en choisir un autre.' }, { status: 400 })
      }
    }

    if (payment_method === 'cod' && product.type !== 'physical') {
      return NextResponse.json({ error: 'Le COD est réservé aux produits physiques.' }, { status: 400 })
    }

    const total = subtotal + deliveryFee

    // ── 4. COMMISSION PLATEFORME & AFFILIATION ──────────────────────────────────
    const storeRecord = await prisma.store.findUnique({
      where: { id: store_id },
      select: { closing_enabled: true, affiliate_active: true, affiliate_margin: true }
    })
    
    // Le vendeur a activé la confirmation manuelle
    const requiresClosing = storeRecord?.closing_enabled && payment_method === 'cod'

    const { platformFee: finalPlatformFee, deliveryCommission: finalDeliveryCommission, vendorAmount: initialVendorAmount } =
      await resolveOrderCommission(store_id, subtotal, deliveryFee, payment_method)

    let finalVendorAmount = initialVendorAmount
    let affiliateAmount = 0
    let finalAffiliateToken = affiliate_token || null
    let targetAffiliateData: any = null

    // 1. Vérifier si l'affilié existe via Code Promo (priorité absolue) OU via le Cookie
    if (promoAffiliateId) {
      targetAffiliateData = await prisma.affiliate.findUnique({
        where: { id: promoAffiliateId }
      })
    } else if (finalAffiliateToken) {
      targetAffiliateData = await prisma.affiliate.findUnique({
        where: { code: finalAffiliateToken }
      })
    }

    if (targetAffiliateData && targetAffiliateData.status === 'active') {
      // Remplacer le code par le token interne pour le stocker dans Order
      finalAffiliateToken = targetAffiliateData.token

      // 2. Déterminer le taux
        let appliedMargin = 0
        if (product.affiliate_active === true && product.affiliate_margin !== null) {
          appliedMargin = product.affiliate_margin
        } else if (product.affiliate_active !== false) {
          if (storeRecord?.affiliate_active && storeRecord.affiliate_margin) {
            appliedMargin = storeRecord.affiliate_margin
          }
        }

        // 3. Calcul sur le sous-total (hors livraison) moins frais plateforme
        if (appliedMargin > 0) {
          const baseForAffiliate = Math.max(0, subtotal - finalPlatformFee)
          affiliateAmount = Math.round(baseForAffiliate * appliedMargin)
          
          if (affiliateAmount > 0 && affiliateAmount < finalVendorAmount) {
            finalVendorAmount -= affiliateAmount
          } else {
            affiliateAmount = 0
            finalAffiliateToken = null
          }
        } else {
          finalAffiliateToken = null
        }
      } else {
         finalAffiliateToken = null
      }

    const supabase = await createClient()

    // Vérification Portefeuille pour COD
    if (payment_method === 'cod') {
      const { canAccept, commissionDue } = await canAcceptCOD(store_id, total, 0)

      if (!canAccept) {
        return NextResponse.json({ error: `Solde insuffisant pour la marge COD. Requis : ${commissionDue} FCFA.` }, { status: 402 })
      }

      const { error: freezeErr } = await supabase.rpc('freeze_commission', {
        p_vendor_id: store_id, p_commission: commissionDue,
      })
      if (freezeErr) return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    // ── 5. TRANSACTION ATOMIQUE ───────────────────────────────────
    let orderRecord
    try {
      const operations: any[] = []

      // Baisse de stock atomique (si variante)
      if (variant_id) {
        operations.push(
          prisma.productVariant.update({
            where: { id: variant_id },
            data: { stock: { decrement: quantity } }
          })
        )
      }

      // Calcul de la prochaine date de facturation si abonnement
      let nextBillingAt = null
      if (product.payment_type === 'recurring' && product.recurring_interval) {
        const now = new Date()
        switch(product.recurring_interval) {
          case 'weekly': nextBillingAt = new Date(now.setDate(now.getDate() + 7)); break;
          case 'monthly': nextBillingAt = new Date(now.setMonth(now.getMonth() + 1)); break;
          case 'quarterly': nextBillingAt = new Date(now.setMonth(now.getMonth() + 3)); break;
          case 'yearly': nextBillingAt = new Date(now.setFullYear(now.getFullYear() + 1)); break;
        }
      }

      // Création commande
      operations.push(
        prisma.order.create({
          data: {
            product_id, store_id, variant_id: variant_id ?? null, quantity,
            bump_product_id: bump_product_id ?? null,
            buyer_name, buyer_email: buyer_email?.trim() || null, buyer_phone, delivery_address: delivery_address ?? null,
            delivery_zone_id: delivery_zone_id ?? null, delivery_fee: deliveryFee,
            payment_method, subtotal: grossSubtotal, promo_discount: promoDiscountAmount,
            platform_fee: finalPlatformFee, delivery_commission: finalDeliveryCommission,
            vendor_amount: finalVendorAmount, total,
            applied_promo_id: applied_promo_id ?? null,
            affiliate_token: finalAffiliateToken,
            affiliate_amount: affiliateAmount,
            affiliate_subid: affiliate_subid || null,
            status: requiresClosing ? 'cod_pending_confirmation' : 'pending',
            is_subscription: product.payment_type === 'recurring',
            next_billing_at: nextBillingAt,
            ...(booking_date && booking_start_time && booking_end_time && {
              booking: {
                create: {
                  store_id, product_id, booking_date: new Date(`${booking_date}T00:00:00.000Z`),
                  start_time: booking_start_time, end_time: booking_end_time,
                }
              }
            }),
            ...(requiresClosing && {
              closing: {
                create: { store_id, closing_fee: 0, status: 'PENDING' }
              }
            }),
          },
        })
      )

      const results = await prisma.$transaction(operations)
      orderRecord = results[results.length - 1] // La commande est la dernière op

      // Nettoyer les paniers abandonnés du prospect
      try {
        await prisma.lead.deleteMany({
          where: { phone: buyer_phone, product_id: product_id, source: 'abandoned_cart' }
        })
      } catch (e) {
        // silent fail
      }

    } catch (dbErr: any) {
      if (payment_method === 'cod') {
        const commissionDue = Math.round(total * 0.05)
        await supabase.rpc('unfreeze_commission', { p_vendor_id: store_id, p_commission: commissionDue })
      }
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    if (applied_promo_id) {
      await supabase.rpc('increment_promo_uses', { p_promo_id: applied_promo_id, delta: 1 })
    }

    // ── 5.5. ENVOI DE L'EMAIL DE CONFIRMATION ────────────────────
    if (buyer_email && buyer_email.trim()) {
      const storeRecordData = await prisma.store.findUnique({ where: { id: store_id }, select: { name: true, whatsapp: true } })
      
      const { data: tCommunity } = await supabase
        .from('TelegramCommunity')
        .select('chat_title')
        .eq('product_id', product_id)
        .eq('is_active', true)
        .maybeSingle()
      const telegramGroupName = tCommunity?.chat_title

      // On n'attend pas la fin de l'envoi pour ne pas ralentir le checkout
      sendTransactionalEmail({
        to: [{ email: buyer_email.trim(), name: buyer_name }],
        subject: `Votre commande #${orderRecord.id.split('-')[0].toUpperCase()} sur ${storeRecordData?.name || 'Yayyam'} est enregistrée !`,
        htmlContent: orderConfirmationEmail({
          id: orderRecord.id,
          productName: product.name,
          total: total,
          status: requiresClosing ? 'cod_pending_confirmation' : 'pending',
          buyerName: buyer_name,
          paymentMethod: payment_method
        }, telegramGroupName)
      }).catch(err => console.error('[Brevo Confirmation Email Error]', err))
    }

    // ── 5.6. NOTIFICATION EMAIL + WHATSAPP AU VENDEUR ──────────────
    const storeRecordData = await prisma.store.findUnique({ 
      where: { id: store_id }, 
      select: { name: true, whatsapp: true, user: { select: { email: true, phone: true } } } 
    })
    
    if (storeRecordData?.user?.email) {
      sendTransactionalEmail({
        to: [{ email: storeRecordData.user.email }],
        subject: "Nouvelle commande reçue sur votre boutique !",
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Nouvelle commande reçue ! 🎉</h2>
            <p>Félicitations, vous avez reçu une nouvelle commande de <strong>${total.toLocaleString('fr-FR')} FCFA</strong> pour le produit <strong>${product.name}</strong>.</p>
            <p><strong>Acheteur :</strong> ${buyer_name} ${buyer_phone}</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${req.nextUrl.protocol}//${req.nextUrl.host}/dashboard/orders" style="background-color: #0F7A60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Traiter la commande</a>
            </p>
          </div>
        `
      }).catch(err => console.error('[Brevo Vendeur Email Error]', err))
    }

    if (storeRecordData?.user?.phone) {
      sendWhatsApp({ 
        to: storeRecordData.user.phone, 
        body: msgVendorNewOrder({
          productName: product.name,
          buyerName: buyer_name,
          buyerPhone: buyer_phone,
          amount: total,
          vendorAmount: finalVendorAmount,
          address: delivery_address || undefined
        })
      }).catch(err => console.error('[WhatsApp Vendeur Error]', err))
    }

    if (buyer_phone && payment_method === 'cod') {
      sendWhatsApp({
        to: buyer_phone,
        body: msgOrderConfirmed({
          buyerName: buyer_name,
          productName: product.name,
          amount: total,
          orderId: orderRecord.id,
          vendorName: storeRecordData?.name || 'la boutique'
        })
      }).catch(err => console.error('[WhatsApp Acheteur COD Error]', err))
    }

    // ── 6. REPONSE FINALE ─────────────────────────────────────────
    if (payment_method === 'cod') {
      const city = delivery_address?.split(',')[1]?.trim() || null
      notifyNewOrder({
        userId: store_id, productName: product.name, buyerName: buyer_name,
        amount: total, orderId: orderRecord.id, paymentMethod: 'cod', city,
      }).catch(e => console.error('[Notification COD ERROR]', e))

      sendSaleNotification(store_id, total, buyer_name, product.name).catch(e => console.error('[Telegram Sale Notify ERROR]', e))

      if (targetAffiliateData && affiliateAmount > 0) {
        notifyNewAffiliateSale({
          userId: targetAffiliateData.user_id, productName: product.name, buyerName: buyer_name, amount: affiliateAmount, paymentMethod: 'cod'
        }).catch(console.error)
      }

      executeWorkflows(store_id, 'Nouvelle Commande (Validée COD)', {
        client_name: buyer_name,
        client_phone: buyer_phone,
        client_email: buyer_email || '',
        product_name: product.name,
        order_id: orderRecord.id,
        order_total: total,
        customer_city: city || 'Inconnue',
        store_name: storeRecordData?.name || 'Yayyam',
      }).catch(e => console.error('[Workflow Engine Error]', e));

      if (product.oto_active && product.oto_product_id) {
         return NextResponse.json({ 
           order_id: orderRecord.id, 
           cod: true, 
           oto: true, 
           oto_url: `/checkout/upsell?o=${orderRecord.id}&p=${product.oto_product_id}&d=${product.oto_discount ?? 0}` 
         })
      }

      return NextResponse.json({ order_id: orderRecord.id, cod: true })
    }

    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`
    const returnUrl = `${baseUrl}/checkout/success?order=${orderRecord.id}`
    const notifyUrlBase = `${baseUrl}/api/checkout/ipn`

    let paymentUrl = ''
    if (payment_method === 'cinetpay') {
      paymentUrl = await initiateCinetPay({ amount: total, orderId: orderRecord.id, buyerName: buyer_name, buyerPhone: buyer_phone, productName: product.name, returnUrl, notifyUrl: `${notifyUrlBase}/cinetpay` })
    } else if (payment_method === 'paytech') {
      paymentUrl = await initiatePayTech({ amount: total, orderId: orderRecord.id, productName: product.name, returnUrl, notifyUrl: `${notifyUrlBase}/paytech` })
    } else if (payment_method === 'wave') {
      paymentUrl = await initiateWave({ amount: total, orderId: orderRecord.id, productName: product.name, successUrl: returnUrl, errorUrl: `${baseUrl}/checkout/${product_id}?error=true` })
    } else {
      return NextResponse.json({ error: 'Moyen de paiement invalide.' }, { status: 400 })
    }

    return NextResponse.json({ order_id: orderRecord.id, payment_url: paymentUrl })
  } catch (error: any) {
    console.error('[CHECKOUT ERROR]:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
