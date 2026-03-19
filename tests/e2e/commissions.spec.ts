import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Initialisation du client Supabase pour s'authentifier dans les tests API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

test.describe('Commissions, Wallet & Retraits', () => {
  const STORE_ID = 'de848551-ded9-4284-a4e7-3af349cc3f0f';
  let testProductId: string;
  let vendeurToken: string;
  let adminToken: string;
  let walletId: string;

  test.beforeAll(async () => {
    // S'assurer qu'un produit existe pour les tests d'initiate
    const product = await prisma.product.findFirst({
      where: { store_id: STORE_ID, type: 'physical' }
    });
    if (product) {
      testProductId = product.id;
    } else {
      const newProd = await prisma.product.create({
        data: {
          store_id: STORE_ID,
          type: 'physical',
          name: 'Produit Commission E2E',
          price: 10000,
          cash_on_delivery: true,
          active: true
        }
      });
      testProductId = newProd.id;
    }

    // Auth Supabase : Obtenir un token d'accès pour masquer "pas de UI" mais être bien authentifié
    const vendeurEmail = process.env.TEST_VENDEUR_EMAIL || 'afriflux@gmail.com';
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'djeylanidjitte@gmail.com';
    const password = process.env.TEST_PASSWORD || 'password123';

    // Connexion vendeur
    const vAuth = await supabase.auth.signInWithPassword({ email: vendeurEmail, password });
    if (vAuth.data.session) vendeurToken = vAuth.data.session.access_token;

    // Connexion admin
    const aAuth = await supabase.auth.signInWithPassword({ email: adminEmail, password });
    if (aAuth.data.session) adminToken = aAuth.data.session.access_token;

    // Retirée configuration withdrawal sur le store, le schema ne la prévoit pas ici

    // Mettre à jour le wallet avec un minimum pour passer le COD check ou initialiser
    const w = await prisma.wallet.upsert({
      where: { vendor_id: STORE_ID },
      create: { vendor_id: STORE_ID, balance: 10000 },
      update: { }
    });
    walletId = w.id;
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.afterEach(async () => {
    // Nettoyer les fausses commandes générées par les tests
    await prisma.order.deleteMany({
      where: { buyer_name: { contains: 'Test E2E Commission' } }
    });
    // Nettoyer tous les retraits créés dans ce store dans the timeframe
    await prisma.withdrawal.deleteMany({
      where: { wallet_id: walletId, amount: { in: [5000, 4999] } }
    });
  });

  test('Commission Wave 7% — palier 0-100K', async ({ request }) => {
    // 1. Appel API pour créer l'ordre Wave - L'API calcule la commission lors de l'initiate
    const body = {
      store_id: STORE_ID,
      product_id: testProductId,
      quantity: 1,
      buyer_name: 'Test E2E Commission Wave',
      buyer_phone: '+221770000002',
      payment_method: 'wave',
      subtotal: 10000,
      total: 10000
    };

    const initRes = await request.post('/api/checkout/initiate', {
      data: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(initRes.status()).toBe(200);
    const { order_id } = await initRes.json();

    // 2. Vérification DB
    const order = await prisma.order.findUnique({ where: { id: order_id } });
    expect(order).not.toBeNull();
    expect(order?.platform_fee).toBe(700);    // 7% de 10 000
    expect(order?.vendor_amount).toBe(9300);  // Reste vendeur
  });

  test('Commission COD 5% fixe', async ({ request }) => {
    // 1. Ajuster le balance temporairement pour garantir l'acceptation COD de l'API (il faut 5% de 20k = 1000)
    await prisma.wallet.update({
      where: { vendor_id: STORE_ID },
      data: { balance: { increment: 1000 } }
    });

    const body = {
      store_id: STORE_ID,
      product_id: testProductId,
      quantity: 2,
      buyer_name: 'Test E2E Commission COD',
      buyer_phone: '+221770000003',
      payment_method: 'cod',
      subtotal: 20000,
      total: 20000
    };

    const initRes = await request.post('/api/checkout/initiate', {
      data: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(initRes.status()).toBe(200);
    const { order_id } = await initRes.json();

    // 2. Vérification commission 5% sur 20 000 = 1000 FCFA
    const order = await prisma.order.findUnique({ where: { id: order_id } });
    expect(order?.platform_fee).toBe(1000);
    expect(order?.vendor_amount).toBe(19000);
  });

  test('Wallet vendeur mis à jour après paiement (IPN)', async ({ request }) => {
    // 1. Obtenir balance initial
    const walletBefore = await prisma.wallet.findUnique({ where: { vendor_id: STORE_ID } });
    const initialBalance = walletBefore?.balance || 0;

    // 2. Créer une commande pending (7%) => Vendor expected +9300
    const order = await prisma.order.create({
      data: {
        store_id: STORE_ID,
        product_id: testProductId,
        buyer_name: 'Test E2E Commission IPN',
        buyer_phone: '+221770000004',
        payment_method: 'wave',
        subtotal: 10000,
        platform_fee: 700,
        vendor_amount: 9300,
        total: 10000,
        status: 'pending'
      }
    });

    // 3. Simuler l'IPN Wave
    const waveSecret = process.env.WAVE_WEBHOOK_SECRET || process.env.WAVE_SECRET || 'test_secret';
    const payload = JSON.stringify({
      id: 'wave_evt_test_wallet',
      client_reference: order.id,
      checkout_status: 'succeeded'
    });
    const signature = crypto.createHmac('sha256', waveSecret).update(payload).digest('hex');

    await request.post('/api/checkout/ipn/wave', {
      data: payload,
      headers: {
        'wave-signature': signature,
        'Content-Type': 'application/json'
      }
    });

    // 4. Vérifier wallet
    const walletAfter = await prisma.wallet.findUnique({ where: { vendor_id: STORE_ID } });
    expect(walletAfter?.balance).toBe(initialBalance + 9300);
  });

  test('Palier commission 6% — CA > 100K dans le mois', async ({ request }) => {
    // 1. Simuler un CA confirmé pour le mois en cours supérieur à 100K (>100000 = palier 6%)
    const caOrder = await prisma.order.create({
      data: {
        store_id: STORE_ID,
        product_id: testProductId,
        buyer_name: 'Test E2E Commission CA Simulation',
        buyer_phone: '+22100000000',
        payment_method: 'wave',
        subtotal: 110000,
        total: 110000,
        platform_fee: 0,
        vendor_amount: 110000,
        status: 'completed' // Comptabilisé dans getVendorMonthlyCA
      }
    });

    // 2. Initier une nouvelle commande Wave de 10 000 FCFA
    const initRes = await request.post('/api/checkout/initiate', {
      data: JSON.stringify({
        store_id: STORE_ID,
        product_id: testProductId,
        quantity: 1,
        buyer_name: 'Test E2E Commission Palier 6%',
        buyer_phone: '+221770000005',
        payment_method: 'wave',
        subtotal: 10000,
        total: 10000
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(initRes.status()).toBe(200);
    const { order_id } = await initRes.json();

    // 3. Vérifier que c'est bien 6% = 600 FCFA
    const order = await prisma.order.findUnique({ where: { id: order_id } });
    expect(order?.platform_fee).toBe(600);
    expect(order?.vendor_amount).toBe(9400);

    // Supprimer le mock CA
    await prisma.order.delete({ where: { id: caOrder.id } });
  });

  test('Demande de retrait — montant valide', async ({ request }) => {
    // S'assurer qu'un wallet balance permet ce retrait
    await prisma.wallet.update({
      where: { vendor_id: STORE_ID },
      data: { balance: { increment: 5000 } }
    });

    const body = {
      amount: 5000,
      storeId: STORE_ID
    };

    // Authentiqué en tant que vendeur
    const response = await request.post('/api/wallet/withdraw', {
      data: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendeurToken}`
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Vérifier création du withdrawal
    const withdrawal = await prisma.withdrawal.findFirst({
      where: { wallet_id: walletId, amount: 5000 },
      orderBy: { requested_at: 'desc' }
    });
    expect(withdrawal).not.toBeNull();
    expect(withdrawal?.status).toBe('pending');
  });

  test('Demande de retrait — montant sous le minimum', async ({ request }) => {
    const response = await request.post('/api/wallet/withdraw', {
      data: JSON.stringify({ amount: 4999, storeId: STORE_ID }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vendeurToken}`
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Montant minimum');
  });

  test('Approbation retrait admin', async ({ request }) => {
    // 1. Créer un retrait mock "pending"
    const withdrawal = await prisma.withdrawal.create({
      data: {
        wallet_id: walletId,
        amount: 5000,
        status: 'pending',
        payment_method: 'wave'
      }
    });

    // 2. S'assurer que le wallet a 5000 en balance pour approuver
    await prisma.wallet.update({
      where: { vendor_id: STORE_ID },
      data: { balance: { increment: 5000 } }
    });

    // 3. Appel de l'API Admin
    const response = await request.patch(`/api/admin/retraits/${withdrawal.id}`, {
      data: JSON.stringify({ status: 'approved' }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    // On s'attend à 200 succès
    expect(response.status()).toBe(200);

    // 4. On vérifie en base que le statut est passé de pending à approved
    const updated = await prisma.withdrawal.findUnique({ where: { id: withdrawal.id } });
    expect(updated?.status).toBe('approved');
    
    // Cleanup de ce retrait-là
    await prisma.withdrawal.delete({ where: { id: withdrawal.id } });
  });
});
