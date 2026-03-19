import { Page, Browser, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Fonction interne pour remplir le formulaire de connexion
 */
async function performLogin(page: Page, email: string) {
  // Navigation vers la page de login
  await page.goto('/login');
  
  // Utilisation des sélecteurs par nom d'attribut préconisés car les inputs ont 'name'
  await page.fill('input[name="emailOrPhone"]', email);
  const password = process.env.TEST_PASSWORD;
  if (!password) {
    throw new Error("TEST_PASSWORD is not defined in environment variables");
  }
  await page.fill('input[name="password"]', password);
  
  // Clic sur le bouton de soumission
  await page.click('button[type="submit"]:has-text("Accéder à mon tableau de bord")');
}

/**
 * Se connecte avec le compte Super Admin
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const email = process.env.TEST_ADMIN_EMAIL || 'djeylanidjitte@gmail.com';
  
  await performLogin(page, email);
  
  // Attend la redirection. Le middleware redirige un rôle admin vers /admin
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
  
  // Si le redirect nous a envoyé vers dashboard, on force la nav admin
  if (page.url().includes('/dashboard')) {
    await page.goto('/admin');
  }
  
  // Vérifie que l'accès admin est effectif via l'URL
  expect(page.url()).toContain('/admin');
}

/**
 * Se connecte avec le compte Vendeur de test
 */
export async function loginAsVendeur(page: Page): Promise<void> {
  const email = process.env.TEST_VENDEUR_EMAIL || 'afriflux@gmail.com';
  
  await performLogin(page, email);
  
  // Attend la redirection vers le dashboard vendeur
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  
  // Vérifie que le dashboard vendeur est bien chargé
  expect(page.url()).toContain('/dashboard');
}

/**
 * Déconnecte proprement la session active
 */
export async function logout(page: Page): Promise<void> {
  try {
    // Le composant Sidebar possède un bouton "Déconnexion"
    // On utilise role="button" et un regex insensible à la casse
    const logoutBtn = page.getByRole('button', { name: /déconnexion/i });
    
    // On s'assure que le bouton est visible, sinon on retourne simplement à la page d'accueil ou login
    if (await logoutBtn.isVisible({ timeout: 5000 })) {
      await logoutBtn.click();
      // On attend la redirection vers /login suite à auth.signOut()
      await page.waitForURL(/\/login/, { timeout: 10000 });
    } else {
      // Fallback si le bouton n'est pas présent (ex: l'écran est déjà déconnecté)
      await page.context().clearCookies();
      await page.goto('/login');
    }
  } catch {
    // Si une erreur survient, on force le nettoyage du contexte localement
    await page.context().clearCookies();
  }
}

// Dossier pour stocker l'état (cookies/sessionStorage) des utilisateurs
const STORAGE_STATE_DIR = path.join(process.cwd(), '.auth');

/**
 * Récupère ou crée une Page authentifiée en préservant le contexte du navigateur
 * pour accélérer l'exécution des futurs tests
 */
export async function getAuthenticatedPage(browser: Browser, role: 'admin' | 'vendeur'): Promise<Page> {
  // Création du dossier .auth s'il n'existe pas
  if (!fs.existsSync(STORAGE_STATE_DIR)) {
    fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true });
  }

  const storageStatePath = path.join(STORAGE_STATE_DIR, `${role}.json`);
  
  // Vérifie si le fichier storageState existe et n'est pas vide (session mock/réelle)
  if (fs.existsSync(storageStatePath) && fs.statSync(storageStatePath).size > 0) {
    const context = await browser.newContext({ storageState: storageStatePath });
    return context.newPage();
  }

  // Sinon, on recrée la session depuis le début
  const context = await browser.newContext();
  const page = await context.newPage();

  if (role === 'admin') {
    await loginAsAdmin(page);
  } else {
    await loginAsVendeur(page);
  }

  // Sauvegarde l'état pour les autres tests
  await page.context().storageState({ path: storageStatePath });
  
  return page;
}
