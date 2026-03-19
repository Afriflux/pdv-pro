import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

// Initialiser Prisma pour nettoyer les commandes de test et vérifier en BDD
const prisma = new PrismaClient();

test.describe('Webhooks de Paiement (IPN) & Checkout API', () => {

  const STORE_ID = 'de848551-ded9-4284-a4e7-3af349cc3f0f'; // sultan-alqalifa
  let testProductId: string;

  test.beforeAll(async () => {
    // S'assurer qu'on a un produit de test pour Sultan AlQalifa
    const product = await prisma.product.findFirst({
      where: { store_id: STORE_ID, type: 'physical' }
    });
    if (product) {
      testProductId = product.id;
    } else {
      // Si aucun produit, on en crée un temporaire pour les tests COD
      const newProd = await prisma.product.create({
        data: {
          store_id: STORE_ID,
          type: 'physical',
          name: 'Produit de Test E2E',
          price: 10000,
          cash_on_delivery: true,
          active: true
        }
      });
      testProductId = newProd.id;
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  // Nettoyage après chaque test pour garder la DB propre
  test.afterEach(async () => {
    await prisma.order.deleteMany({
      where: { buyer_name: 'Test E2E Buyer' }
    });
  });

  test('IPN Wave — paiement réussi', async ({ request }) => {
    // Création d'une commande "pending" en DB
    const order = await prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        store_id: STORE_ID,
        product_id: testProductId,
        buyer_name: 'Test E2E Buyer',
        buyer_phone: '+221770000000',
        payment_method: 'wave',
        subtotal: 5000,
        platform_fee: 350, // 7% test
        vendor_amount: 4650,
        total: 5000,
        status: 'pending'
      }
    });

    const waveSecret = process.env.WAVE_WEBHOOK_SECRET || process.env.WAVE_SECRET || 'test_secret';
    
    // Le handler de Wave attend 'client_reference' et 'checkout_status' etc.
    const body = {
      id: 'wave_evt_123',
      client_reference: order.id,
      checkout_status: 'succeeded'
    };

    const rawBody = JSON.stringify(body);
    const signature = crypto.createHmac('sha256', waveSecret).update(rawBody).digest('hex');

    const response = await request.post('/api/checkout/ipn/wave', {
      data: rawBody,
      headers: {
        'wave-signature': signature,
        'Content-Type': 'application/json'
      }
    });

    // On vérifie que la route Wave a bien renvoyé un statut 200
    expect(response.status()).toBe(200);

    // On vérifie en base que la commande est bien payée ou confirmée
    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.status).toBe('confirmed'); // cf confirmOrder() => confirmed par défaut
  });

  test('IPN Wave — signature invalide', async ({ request }) => {
    const body = {
      id: 'wave_evt_invalid',
      client_reference: 'fake_order_123',
      checkout_status: 'succeeded'
    };

    const response = await request.post('/api/checkout/ipn/wave', {
      data: JSON.stringify(body),
      headers: {
        'wave-signature': 'signature_invalide_1234',
        'Content-Type': 'application/json'
      }
    });

    // S'il y a un WAVE_WEBHOOK_SECRET, on doit avoir une erreur 401
    // Si process.env n'en a pas, le Webhook bypassera en dev et renverra 400 pour client reference, 
    // mais dans notre environnement .env.local on aura 401
    if (process.env.WAVE_WEBHOOK_SECRET) {
      expect(response.status()).toBe(401);
    } else {
      console.warn('WAVE_WEBHOOK_SECRET non configuré, test de signature bypassé.');
    }
  });

  test('IPN Wave — événement non géré', async ({ request }) => {
    const waveSecret = process.env.WAVE_WEBHOOK_SECRET || process.env.WAVE_SECRET || 'test_secret';
    
    const body = {
      id: 'wave_evt_refund',
      client_reference: 'fake_order_123',
      checkout_status: 'failed' // Non géré (attendu: succeeded)
    };

    const rawBody = JSON.stringify(body);
    const signature = crypto.createHmac('sha256', waveSecret).update(rawBody).digest('hex');

    const response = await request.post('/api/checkout/ipn/wave', {
      data: rawBody,
      headers: {
        'wave-signature': signature,
        'Content-Type': 'application/json'
      }
    });

    // Le webhook doit ignorer silencieusement et renvoyer 200 avec { ignored: true }
    expect(response.status()).toBe(200);
    const resBody = await response.json();
    expect(resBody).toHaveProperty('ignored', true);
  });

  test('IPN CinetPay — paiement réussi', async ({ request }) => {
    // Création commande "pending"
    const order = await prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        store_id: STORE_ID,
        product_id: testProductId,
        buyer_name: 'Test E2E Buyer',
        buyer_phone: '+22500000000',
        payment_method: 'cinetpay',
        subtotal: 5000,
        platform_fee: 350,
        vendor_amount: 4650,
        total: 5000,
        status: 'pending'
      }
    });

    const cinetpaySecret = process.env.CINETPAY_API_SECRET || 'test_cp_secret';
    const siteId = process.env.CINETPAY_SITE_ID || 'test_site';
    
    const body = {
      cpm_site_id: siteId,
      cpm_trans_id: order.id,
      cpm_result: '00',
      cpm_trans_status: 'ACCEPTED'
    };

    const xToken = crypto.createHash('sha256')
                         .update(siteId + order.id + cinetpaySecret)
                         .digest('hex');

    const response = await request.post('/api/checkout/ipn/cinetpay', {
      data: body,
      headers: {
        'x-token': xToken,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);

    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.status).toBe('confirmed');
  });

  test('IPN CinetPay — signature invalide', async ({ request }) => {
    const body = {
      cpm_site_id: 'site123',
      cpm_trans_id: 'order123',
      cpm_result: '00'
    };

    const response = await request.post('/api/checkout/ipn/cinetpay', {
      data: body,
      headers: {
        'x-token': 'token_tres_invalide',
        'Content-Type': 'application/json'
      }
    });

    if (process.env.CINETPAY_API_SECRET) {
      expect(response.status()).toBe(401);
    }
  });

  test('Commande COD — création et commission', async ({ request }) => {
    // 1. Appel direct API Initiate pour du COD
    // Note: requires the wallet balance to be >= commission in DB. 
    // We mock the user wallet directly if necessary but initiate should create it.
    
    // Assurons-nous que le wallet a assez de fonds pour les 5% de 10k (500 FCFA)
    await prisma.wallet.upsert({
      where: { vendor_id: STORE_ID },
      create: { vendor_id: STORE_ID, balance: 1000 },
      update: { balance: { increment: 1000 } }
    });

    const body = {
      store_id: STORE_ID,
      product_id: testProductId,
      quantity: 1,
      buyer_name: 'Test E2E Buyer',
      buyer_phone: '+221770000000',
      payment_method: 'cod',
      subtotal: 10000,
      total: 10000
    };

    const response = await request.post('/api/checkout/initiate', {
      data: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });

    // 2. Vérification réponse HTTP 200 et order_id
    expect(response.status()).toBe(200);
    const resData = await response.json();
    expect(resData).toHaveProperty('order_id');
    expect(resData).toHaveProperty('cod', true);

    // 3. Vérification de la création de commande en BDD et sa commission
    const order = await prisma.order.findUnique({ where: { id: resData.order_id } });
    expect(order).not.toBeNull();
    expect(order?.status).toBe('pending');
    
    // Le total est 10000, la commission COD fixe est 5%, donc 500.
    expect(order?.platform_fee).toBe(500); 
  });
});
