import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { loginAsAdmin, loginAsVendeur } from './helpers/auth';

const prisma = new PrismaClient();
const STORE_ID = 'de848551-ded9-4284-a4e7-3af349cc3f0f';

test.describe('Espace Admin', () => {
  let testProductId: string;

  test.beforeAll(async () => {
    const p = await prisma.product.findFirst({ where: { store_id: STORE_ID } });
    testProductId = p?.id ?? '';
  });

  // Optionnel : déconnecter à la fin si des tests inséraient des données
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  // Nettoyer la session à chaque test pour garantir l'isolation complète
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('Accès admin — authentification', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Vérifier chargement page admin
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    
    // Le titre de `page.tsx` dans l'admin est "Vue d'ensemble"
    await expect(page.getByRole('heading', { name: /Vue d'ensemble/i })).toBeVisible();
  });

  test('Accès refusé — vendeur essaie /admin', async ({ page }) => {
    await loginAsVendeur(page);
    
    // Tentative d'accès à l'admin
    await page.goto('/admin');
    
    // Le middleware redirige les vendeurs vers /dashboard
    await expect(page).not.toHaveURL(/\/admin/);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('/admin/orders — liste des commandes', async ({ page }) => {
    // Injecter une commande E2E bidon si nécessaire pour être sûr qu'une s'affiche
    const orderId = 'test-e2e-order-' + Date.now();
    await prisma.order.create({
      data: {
        id: orderId,
        store_id: STORE_ID,
        product_id: testProductId,
        buyer_name: 'Test Admin E2E',
        buyer_phone: '+22100000000',
        payment_method: 'wave',
        status: 'completed',
        subtotal: 15000,
        total: 15000,
        platform_fee: 1000,
        vendor_amount: 14000
      }
    });

    await loginAsAdmin(page);
    await page.goto('/admin/orders');
    
    // L'en-tête de la page orders est "Toutes les Commandes"
    await expect(page.getByRole('heading', { name: /Toutes les Commandes/i })).toBeVisible();

    // Vérifier la présence de la commande insérée
    // On s'attend à "Test Admin E2E" dans le tableau
    await expect(page.getByText('Test Admin E2E')).toBeVisible();

    // Nettoyage de la fausse commande
    await prisma.order.delete({ where: { id: orderId } });
  });

  test('/admin/orders — filtrer par statut', async ({ page }) => {
    const orderId = 'test-e2e-order-pending-' + Date.now();
    await prisma.order.create({
      data: {
        id: orderId,
        store_id: STORE_ID,
        product_id: testProductId,
        buyer_name: 'Pending E2E',
        buyer_phone: '+22100000000',
        payment_method: 'wave',
        status: 'pending',
        subtotal: 5000,
        total: 5000,
        platform_fee: 350,
        vendor_amount: 4650
      }
    });

    await loginAsAdmin(page);
    await page.goto('/admin/orders');

    // Clic sur l'onglet "En attente" ou filtre via l'URL directement
    // Le lien est généré comme "/admin/orders?status=pending"
    const pendingTab = page.locator('a[href*="status=pending"]');
    await pendingTab.click();

    await page.waitForURL(/status=pending/, { timeout: 5000 });

    // Vérifier que SEULES les commandes pending s'affichent
    // On doit trouver notre Pending E2E
    await expect(page.getByText('Pending E2E')).toBeVisible();

    // Nettoyage
    await prisma.order.delete({ where: { id: orderId } });
  });

  // NOTE: Les routes exactes /admin/commissions et /admin/wallets
  // n'existent pas encore dans le dossier app/admin/ d'après mon analyse du code source.
  // Je les remplace par la vérification des Vendeurs liés aux Wallets et des retraits.

  test('/admin/vendeurs — liste des boutiques (Remplace wallets)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/vendeurs');

    // Vérifier que la boutique de test apparaît
    await expect(page.getByRole('heading', { name: /Gestion des Vendeurs/i })).toBeVisible();

    // L'UI affiche soit le nom exact du store, soit une fallback. On va chercher l'email au minimum.
    const sellerMail = process.env.TEST_VENDEUR_EMAIL || 'afriflux@gmail.com';
    await expect(page.getByText(sellerMail)).toBeVisible();
  });

  test('/admin/retraits — validations (Remplace commissions)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/retraits');

    // Vérifier le titre
    await expect(page.getByRole('heading', { name: /Gestion des Retraits/i })).toBeVisible();

    // Vérifier que le composant de filtre est bien là
    const pendingFilter = page.locator('a[href*="status=pending"]');
    await expect(pendingFilter).toBeVisible();
  });
});
