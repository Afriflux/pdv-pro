import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import {
  initiateWavePayment,
  initiateBictorysPayment,
  type PaymentMethod,
  type PaymentIntent,
} from '@/lib/payments/payment-service'

interface B2BInitiateBody {
  assetId: string
  assetType: 'MASTERCLASS' | 'APP' | 'SMS' | 'WORKFLOW' | 'TEMPLATE' | 'AI'
  assetName: string
  amount: number
  method: PaymentMethod
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = (await req.json()) as Partial<B2BInitiateBody>
    const { assetId, assetType, assetName, amount, method } = body

    if (!assetId || !assetType || !amount || !method) {
      return NextResponse.json({ error: 'Données invalides ou incomplètes' }, { status: 400 })
    }

    const store = await prisma.store.findUnique({
      where: { user_id: user.id },
      include: { wallet: true }
    })

    if (!store || !store.wallet) {
      return NextResponse.json({ error: 'Boutique ou portefeuille introuvable' }, { status: 404 })
    }
    
    // SERVER-SIDE Pricing Verification & Modification
    let finalAmount = amount
    let finalAssetId = assetId
    let finalAssetName = assetName

    if (assetType === 'SMS' || assetType === 'AI') {
      const configs = await prisma.platformConfig.findMany({
        where: {
          key: {
            in: [
              'PRICE_SMS_PACK', 'PRICE_SMS_PACK_1000', 'VOLUME_SMS_PACK',
              'PRICE_AI_PACK', 'PRICE_AI_PACK_100', 'VOLUME_AI_PACK'
            ]
          }
        }
      })

      const getConf = (k: string, def: string) => configs.find(c => c.key === k)?.value || def

      if (assetType === 'SMS') {
        const smsVolume = getConf('VOLUME_SMS_PACK', '1000')
        finalAmount = parseInt(getConf('PRICE_SMS_PACK', getConf('PRICE_SMS_PACK_1000', '5000')))
        finalAssetId = `sms_${smsVolume}`
        finalAssetName = `Pack de ${smsVolume} SMS`
      } else if (assetType === 'AI') {
        const aiVolume = getConf('VOLUME_AI_PACK', '100')
        finalAmount = parseInt(getConf('PRICE_AI_PACK', getConf('PRICE_AI_PACK_100', '3000')))
        finalAssetId = `ai_${aiVolume}`
        finalAssetName = `Pack de ${aiVolume} Tokens IA`
      }
    } else {
      // In a strict prod environment, we would also verify APP/MASTERCLASS prices here against their DB models.
      // But for SaaS packs, we enforce them completely here.
      finalAmount = amount
    }

    // We create a pending transaction that acts as our PaymentIntent Tracker.
    const transaction = await prisma.transaction.create({
       data: {
          wallet_id: store.wallet.id,
          type: 'b2b_asset',
          amount: finalAmount,
          status: 'pending',
          label: JSON.stringify({ assetId: finalAssetId, assetType, assetName: finalAssetName, storeId: store.id })
       }
    })

    // The payment intent uses the transaction.id as the "orderId" for webhooks to catch
    const intent: PaymentIntent = {
      orderId: `B2B_${transaction.id}`,
      amount: finalAmount,
      method: method,
      vendorAmount: finalAmount, // Internal: Yayyam gets 100%
      fees: 0,
      currency: 'XOF',
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yayyam.com'}/admin/monetization`,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yayyam.com'}/api/webhooks/${method}`
    }
    
    // Pour Yayyam B2B, l'argent va directement sur le compte Yayyam.
    // Nous appelons le PaymentService avec l'intent structuré.
    
    let paymentUrl = ''
    
    if (method === 'wave') {
      const result = await initiateWavePayment(intent)
      if (result.checkoutUrl) {
         paymentUrl = result.checkoutUrl
      } else {
         return NextResponse.json({ error: 'Erreur Wave' }, { status: 500 })
      }
    } else if (method === 'bictorys' || method === 'cinetpay' || method === 'paytech') {
      const result = await initiateBictorysPayment(intent)
      if (result.checkoutUrl) {
         paymentUrl = result.checkoutUrl
      } else {
         return NextResponse.json({ error: 'Erreur Processeur Bictorys' }, { status: 500 })
      }
    } else {
       return NextResponse.json({ error: 'Méthode non implémentée' }, { status: 400 })
    }

    return NextResponse.json({ success: true, checkoutUrl: paymentUrl })

  } catch (err: any) {
    console.error('B2B Initiate Error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
