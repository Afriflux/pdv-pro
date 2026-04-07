import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CinetPayProvider } from '@/lib/payments/cinetpay'

export async function POST(req: Request) {
  try {
    // CinetPay envoie les données de notification en form-data ou JSON
    // Souvent form-data avec cpm_trans_id, cpm_site_id, etc.
    const bodyText = await req.text()
    const params = new URLSearchParams(bodyText)
    
    const transaction_id = params.get('cpm_trans_id')
    const site_id = params.get('cpm_site_id')

    if (!transaction_id || !site_id) {
       return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // 1. Vérifier le statut réel du paiement depuis l'API CinetPay
    const cinetpay = new CinetPayProvider()
    const verifyResult = await cinetpay.verifyPayment(transaction_id)
    
    if (!verifyResult.success || verifyResult.status !== 'ACCEPTED') {
      // Paiement échoué ou en attente
      await prisma.transaction.updateMany({
        where: { label: { contains: transaction_id }, status: 'pending' },
        data: { status: 'failed' }
      })
      return NextResponse.json({ status: 'failed or unverified' })
    }

    // 2. Trouver la transaction "pending" correspondante dans la DB
    const pendingTx = await prisma.transaction.findFirst({
      where: { label: { contains: transaction_id }, status: 'pending' }
    })

    if (!pendingTx) {
       return NextResponse.json({ status: 'already processed or not found' })
    }

    // 3. Valider le rechargement
    if (pendingTx.type === 'deposit') {
      // Créditer le Wallet
      await prisma.wallet.update({
         where: { id: pendingTx.wallet_id },
         data: { balance: { increment: verifyResult.amount || pendingTx.amount } }
      })
      
      // Marquer Tx comme payée
      await prisma.transaction.update({
         where: { id: pendingTx.id },
         data: { status: 'completed' }
      })
    }

    return NextResponse.json({ status: 'success' })
  } catch (error: any) {
    console.error('CinetPay Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
