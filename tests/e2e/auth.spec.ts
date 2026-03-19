import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { loginAsVendeur } from './helpers/auth';

const prisma = new PrismaClient();

test.describe('Authentification et Middlewares', () => {

  // Isolation stricte entre les tests
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Login — succès vendeur', async ({ page }) => {
    await page.goto('/login');
    
    // Remplissage infos valides
    const email = process.env.TEST_VENDEUR_EMAIL || 'afriflux@gmail.com';
    const password = process.env.TEST_PASSWORD || 'password123';

    await page.fill('input[name="emailOrPhone"]', email);
    await page.fill('input[name="password"]', password);
    
    await page.click('button[type="submit"]:has-text("Accéder à mon tableau de bord")');
    
    // Vérification de la redirection vers le tableau de bord
    await page.waitForURL(/\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Vérification basique qu'on est bien sur l'UI du vendeur
    await expect(page.locator('aside')).toBeVisible(); 
  });

  test('Login — mauvais mot de passe', async ({ page }) => {
    await page.goto('/login');
    
    const email = process.env.TEST_VENDEUR_EMAIL || 'afriflux@gmail.com';
    await page.fill('input[name="emailOrPhone"]', email);
    await page.fill('input[name="password"]', 'mauvais_mdp_test');
    
    await page.click('button[type="submit"]:has-text("Accéder à mon tableau de bord")');
    
    // La page ne doit PAS changer
    await expect(page).toHaveURL(/\/login/);
    
    // Un message d'erreur doit s'afficher
    // L'UI affiche soit ⚠️ Email/téléphone ou mot de passe incorrect.
    await expect(page.getByText(/incorrect/i)).toBeVisible();
  });

  test('Register — formulaire présent', async ({ page }) => {
    await page.goto('/register');
    
    // Vérifier la présence des sections essentielles du formulaire
    await expect(page.getByLabel(/Nom/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Mot de passe/i)).toBeVisible();
    
    // Vérifier que le bouton de soumission est présent
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Register ambassador — page et formulaire', async ({ page }) => {
    await page.goto('/register/ambassador');
    
    // Vérifier le champ code ambassadeur
    const codeInput = page.getByLabel(/Code Ambassadeur/i);
    await expect(codeInput).toBeVisible();
    
    // Vérifier le bouton de validation ("Continuer")
    await expect(page.getByRole('button', { name: /Continuer/i })).toBeVisible();
  });

  test('Middleware — redirect si non connecté vers /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Le middleware redirige les visiteurs non loggés vers /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('Middleware — redirect si non connecté vers /admin', async ({ page }) => {
    await page.goto('/admin');
    
    // Le middleware redirige specifiquement vers /admin/login (ou /login si non configuré)
    // Ici on match n'importe quel type de login tant qu'on n'est PAS sur /admin ou /dashboard
    await expect(page).not.toHaveURL(/\/admin$/);
    await expect(page.url()).toContain('login');
  });

  test('LandingNav — état déconnecté', async ({ page }) => {
    await page.goto('/');
    
    // Le bouton de connexion doit être là
    await expect(page.getByText('Connexion')).toBeVisible();
    
    // Le bouton "Mon espace" (réservé aux connectés) ne doit PAS être là
    await expect(page.getByText('Mon espace', { exact: false })).toBeHidden();
  });

  test('LandingNav — état connecté', async ({ page }) => {
    // 1. On se connecte réellement via le helper pour injecter la session complète
    await loginAsVendeur(page);
    
    // 2. On retourne manuellement sur la landing page
    await page.goto('/');
    
    // 3. Le LandingNav (Client Component) lit le cookie et doit afficher "Mon espace →"
    await expect(page.getByText('Mon espace')).toBeVisible();
    
    // "Connexion" ne doit plus être visible
    await expect(page.getByText('Connexion')).toBeHidden();
  });

  test('Onboarding middleware — reste sur dashboard même si non complété (optionnel)', async ({ page }) => {
    // L'onboarding est désormais optionnel. On vérifie que le vendeur n'est PAS forcé sur /onboarding.
    
    const SELLER_ID = 'de848551-ded9-4284-a4e7-3af349cc3f0f'; // sultan-alqalifa
    
    // On met onboarding = false
    await prisma.store.update({
      where: { id: SELLER_ID },
      data: { onboarding_completed: false }
    });

    // On connecte ce vendeur
    await loginAsVendeur(page);

    try {
      // Le middleware ne doit PLUS rediriger vers /onboarding
      await page.waitForURL(/\/dashboard/);
      await expect(page).toHaveURL(/\/dashboard/);
    } catch (e) {
      throw e;
    } finally {
      // CLEAUP OBLIGATOIRE - On restaure l'onboarding du vendeur de Test pour ne pas ruiner les autres tests E2E !!
      await prisma.store.update({
        where: { id: SELLER_ID },
        data: { onboarding_completed: true }
      });
    }
  });

});
