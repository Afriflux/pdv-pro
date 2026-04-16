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
import { sendMetaCAPIPurchaseEvent } from '@/lib/tracking/capi'
import { checkBuyerForCOD } from '@/lib/anti-fraud/buyer-check'
import { createPaymentSession } from '@/lib/payments/routing'
import { validate, checkoutSchema } from '@/lib/validation'
import { getRateLimitStatus } from '@/lib/rate-limit'

function roundTo5(amount: number): number {
  return Math.ceil(amount / 5) * 5
}



export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const { success } = await getRateLimitStatus(`checkout_${ip}`, 10, 60000); // 10 reqs per min
    if (!success) {
      return NextResponse.json({ error: 'Trop de tentatives, veuillez patienter quelques instants.' }, { status: 429 })
    }

    const bodyText = await req.text()
    if (!bodyText) return NextResponse.json({ error: 'Body vide.' }, { status: 400 })
    const body = JSON.parse(bodyText) as Record<string, unknown>

    // ── Validation structurée des inputs ────────────────────────────────────
    const validationResult = validate(body, checkoutSchema)
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 })
    }

    const {
      product_id, store_id, variant_id, quantity = 1,
      buyer_name, buyer_email, buyer_phone, delivery_address, delivery_zone_id,
      payment_method, applied_promo_id, affiliate_token, affiliate_subid,
      booking_date, booking_start_time, booking_end_time,
      bump_product_id, loyalty_discount = 0, redeemed_points = 0
    } = body as {
      product_id?: string
      store_id?: string
      variant_id?: string
      quantity?: number
      buyer_name?: string
      buyer_email?: string
      buyer_phone?: string
      delivery_address?: string
      delivery_zone_id?: string
      payment_method?: string
      applied_promo_id?: string
      affiliate_token?: string
      affiliate_subid?: string
      booking_date?: string
      booking_start_time?: string
      booking_end_time?: string
      bump_product_id?: string
      loyalty_discount?: number
      redeemed_points?: number
    }

    if (!product_id || !store_id || !buyer_name || !buyer_phone || !payment_method) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    // ── 1. VALIDATION SERVEUR DU PRODUIT & STOCK ──────────────────
    const product = await prisma.product.findUnique({ 
      where: { id: product_id },
      include: { 
        store: { 
          select: { 
            volume_discounts_active: true, 
            volume_discounts_config: true, 
            meta_pixel_id: true, 
            meta_capi_token: true,
            installedApps: { where: { status: 'active', app_id: 'fraud-cod' } }
          } 
        } 
      }
    })
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

    let volumeDiscountAmount = 0
    if (product.store?.volume_discounts_active && product.store?.volume_discounts_config) {
      const config = typeof product.store.volume_discounts_config === 'string' 
        ? JSON.parse(product.store.volume_discounts_config) 
        : product.store.volume_discounts_config
        
      if (config?.rules && Array.isArray(config.rules)) {
        const sortedRules = [...config.rules].sort((a, b) => b.quantity - a.quantity)
        const validRule = sortedRules.find(r => quantity >= r.quantity)
        if (validRule) {
          if (validRule.discountType === 'percentage') {
            volumeDiscountAmount = (basePrice * quantity) * (validRule.value / 100)
          } else if (validRule.discountType === 'fixed') {
            volumeDiscountAmount = validRule.value
          }
        }
      }
    }

    const grossSubtotal = (basePrice * quantity) - volumeDiscountAmount + (bumpProduct ? bumpProduct.price : 0)
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

    let actualLoyaltyDiscount = 0
    if (redeemed_points > 0) {
      const dbLoyalty = await prisma.loyaltyAccount.findUnique({ where: { phone: buyer_phone } })
      if (dbLoyalty && dbLoyalty.balance >= redeemed_points) {
        // Recalcul serveur: 1 point = 1 FCFA, plafonné par le max_redeem_pct de la boutique
        const loyaltyConfig = await prisma.loyaltyConfig.findUnique({ where: { store_id: store_id } })
        const maxPct = loyaltyConfig?.max_redeem_pct ?? 20
        const maxDiscountAllowed = Math.floor((subtotal + deliveryFee) * (maxPct / 100))
        // Le discount est le min entre les points demandés et le plafond autorisé
        actualLoyaltyDiscount = Math.min(redeemed_points, maxDiscountAllowed, dbLoyalty.balance)
      }
    }

    const total = Math.max(0, subtotal + deliveryFee - actualLoyaltyDiscount)

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
    let targetAffiliateData: { user_id: string; status: string; token: string | null } | null = null

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

    // ── Anti-Fraude COD : Vérification BuyerScore & Blacklist ─────
    if (payment_method === 'cod') {
      const isFraudAppInstalled = product.store?.installedApps?.length > 0
      
      if (isFraudAppInstalled) {
        const fraudCheck = await checkBuyerForCOD(buyer_phone)
        if (!fraudCheck.allowed) {
          return NextResponse.json({ 
            error: fraudCheck.message || 'Le paiement à la livraison n\'est pas disponible pour ce numéro.',
            cod_blocked: true,
            risk_level: fraudCheck.riskLevel,
            score: fraudCheck.score,
          }, { status: 403 })
        }
      }
    }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // ── Mettre en attente (dépenser) les points de fidélité ──
      try {
        if (actualLoyaltyDiscount > 0) {
           const { redeemLoyaltyPoints } = await import('@/app/actions/loyalty')
           await redeemLoyaltyPoints(buyer_phone, store_id, actualLoyaltyDiscount, orderRecord.id)
        }
      } catch(e) { console.error('[Checkout] Loyalty redemption failed:', e) }

      // Nettoyer les paniers abandonnés du prospect
      try {
        await prisma.lead.deleteMany({
          where: { phone: buyer_phone, product_id: product_id, source: 'abandoned_cart' }
        })
      } catch(e) {
        console.error('[Checkout] Lead cleanup failed:', e)
      }

    } catch(txError) {
      console.error('[Checkout] Transaction atomique failed:', txError)
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

    // ── Extraction ville pour tracking ─────────────────────────────
    const city = delivery_address?.split(',')[1]?.trim() || null

    // ── 6. REPONSE FINALE ─────────────────────────────────────────
    if (payment_method === 'cod') {
      try {
        const { earnLoyaltyPoints } = await import('@/app/actions/loyalty')
        await earnLoyaltyPoints(buyer_phone, store_id, total, orderRecord.id)
      } catch(e) { console.error('[Loyalty COD Error]', e) }

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

      // Trigger Meta CAPI si activé
      if (product.store?.meta_pixel_id && product.store?.meta_capi_token) {
        sendMetaCAPIPurchaseEvent({
          pixelId: product.store.meta_pixel_id,
          capiToken: product.store.meta_capi_token,
          eventId: orderRecord.id,
          orderId: orderRecord.id,
          value: total,
          currency: 'XOF',
          contentName: product.name,
          customerEmail: buyer_email || undefined,
          customerPhone: buyer_phone,
          customerName: buyer_name,
          clientIp: req.headers.get('x-forwarded-for') || undefined,
          clientUserAgent: req.headers.get('user-agent') || undefined
        }).catch(e => console.error('[CAPI COD Error]', e));
      }

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
    const notifyUrlBase = `${baseUrl}/api/webhooks`

    if (!['wave', 'paytech', 'bictorys', 'cinetpay', 'moneroo'].includes(payment_method)) {
      return NextResponse.json({ error: 'Moyen de paiement invalide.' }, { status: 400 })
    }

    const payloadMethod = payment_method as 'wave' | 'paytech' | 'bictorys' | 'cinetpay' | 'moneroo'

    // DÉTECTION CAMEROUN POUR DEVISE XAF (CEMAC)
    let dynamicCurrency = 'XOF'
    let dynamicCountry = 'SN'
    if (buyer_phone.startsWith('+237') || buyer_phone.startsWith('237')) {
      dynamicCurrency = 'XAF'
      dynamicCountry = 'CM'
    }

    // Appel du Smart Router pour générer la session et gérer le fallback
    const paymentResponse = await createPaymentSession({
      amount: Math.round(total), // on utilise Math.round au lieu de roundTo5 potentiellement manquant
      currency: dynamicCurrency,
      orderId: orderRecord.id,
      method: payloadMethod,
      customer: {
        name: buyer_name,
        phone: buyer_phone,
        email: buyer_email || undefined,
        address: delivery_address || undefined,
        city: city || undefined,
        country: dynamicCountry
      },
      description: product.name,
      returnUrl: returnUrl,
      // On lie le notify_url à la méthode (qui peut avoir été mutée si fallback)
      notifyUrl: `${notifyUrlBase}/${payloadMethod}`,
      env: process.env.NODE_ENV === 'production' ? 'prod' : 'test'
    })

    if (!paymentResponse.success) {
      console.error('[Smart Router Error]', paymentResponse.error)
      throw new Error(`Le service de paiement est indisponible (${paymentResponse.error}).`)
    }

    return NextResponse.json({ order_id: orderRecord.id, payment_url: paymentResponse.paymentUrl })
  } catch (error: unknown) {
    console.error('[CHECKOUT ERROR]:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
