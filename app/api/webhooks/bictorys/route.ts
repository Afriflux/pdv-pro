import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const cfg = await prisma.platformConfig.findUnique({ where: { key: 'BICTORYS_WEBHOOK_SECRET' } });
    const webhookSecret = cfg?.value || process.env.BICTORYS_WEBHOOK_SECRET;
    const incomingSecret = req.headers.get('X-Secret-Key');

    // 1. Validation de l'origine
    if (incomingSecret !== webhookSecret) {
      console.warn("Bictorys Webhook Validation Failed. Secrets mismatch.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await req.json();

    // 2. Vérifications de base (statut et référence)
    if (!event.status || (!event.paymentReference && !event.id)) {
       return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
    }

    const status = event.status.toLowerCase();
    
    // Soit succeeded soit authorized
    if (status !== 'succeeded' && status !== 'authorized') {
       return NextResponse.json({ status: 'ignored' });
    }

    // Reference (On a enregistré ça sous Payload.reference dans BictorysProvider)
    const transaction_id = event.paymentReference || event.id;

    // 3. Trouver la transaction "pending" correspondante dans la DB
    const pendingTx = await prisma.transaction.findFirst({
      where: { label: { contains: transaction_id }, status: 'pending' }
    });

    if (!pendingTx) {
       return NextResponse.json({ status: 'already processed or not found' });
    }

    // 4. Validation et Crédit
    if (pendingTx.type === 'deposit') {
      // Créditer le Wallet
      await prisma.wallet.update({
         where: { id: pendingTx.wallet_id },
         data: { balance: { increment: event.amount || pendingTx.amount } }
      });
      
      // Marquer Tx comme payée
      await prisma.transaction.update({
         where: { id: pendingTx.id },
         data: { status: 'completed' }
      });
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error('Bictorys Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
