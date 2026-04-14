import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export interface PaymentRouteInfo {
  provider: string;
  supported_method: string;
}

export interface ClientPaymentOption {
  method: string;
  provider: string; // L'agrégateur réel
  commission_rate: number;
}

/**
 * Helper: getAvailableProviders(userId)
 * 1. Filtre plateforme : PaymentIntegration.is_active = true
 * 2. Filtre utilisateur :
 *    - wave -> tjrs dispo
 *    - sinon -> vérifier installation app_id === provider && status === 'active'
 * 3. Retourne une liste dédoublonnée de méthodes de paiement, triées par commission_rate ASC.
 */
export async function getAvailableProviders(userId: string): Promise<ClientPaymentOption[]> {
  const store = await prisma.store.findFirst({
    where: { user_id: userId },
    select: { id: true }
  })
  
  if (!store) return [];

  // Récupérer tous les providers actifs globaux
  const activeIntegrations = await prisma.paymentIntegration.findMany({
    where: { is_active: true },
    orderBy: { commission_rate: 'asc' }
  });

  // Récupérer les apps installées par le vendeur
  const installedApps = await prisma.installedApp.findMany({
    where: { store_id: store.id, status: 'active' },
    select: { app_id: true }
  });
  const installedAppIds = new Set(installedApps.map(a => a.app_id));

  const availableMethods: ClientPaymentOption[] = [];
  const processedMethods = new Set<string>();

  // Les providers sont déjà triés par commission_rate ascendant (du moins cher au plus cher)
  for (const integration of activeIntegrations) {
    const isNativeWave = integration.provider === 'wave';
    const isInstalled = installedAppIds.has(integration.provider);

    if (isNativeWave || isInstalled) {
      const methods = (integration.supported_methods as string[]) || [];
      
      for (const method of methods) {
        // Enregistrer la méthode uniquement si elle n'a pas été fournie par un agrégateur moins cher
        if (!processedMethods.has(method)) {
          processedMethods.add(method);
          availableMethods.push({
            method: method,
            provider: integration.provider,
            commission_rate: integration.commission_rate
          });
        }
      }
    }
  }

  return availableMethods;
}

/**
 * Helper: resolvePaymentRoute(userId, selectedMethod)
 * Trouve l'agrégateur (ou processeur direct) le moins cher installé par le vendeur
 * qui supporte la méthode finale choisie.
 */
export async function resolvePaymentRoute(userId: string, selectedMethod: string): Promise<PaymentRouteInfo | null> {
  const options = await getAvailableProviders(userId);
  const match = options.find(opt => opt.method === selectedMethod);
  if (match) {
    return {
      provider: match.provider,
      supported_method: match.method
    }
  }
  return null;
}
