'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')
  
  const role = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  if (role?.role !== 'super_admin' && role?.role !== 'gestionnaire') {
    throw new Error('Accès refusé')
  }
}

export async function getMarketplaceApps() {
  try {
    const apps = await prisma.marketplaceApp.findMany({
      orderBy: { created_at: 'desc' }
    })
    return apps
  } catch (error) {
    console.error('Error fetching apps:', error)
    return []
  }
}

export async function createMarketplaceApp(data: Prisma.MarketplaceAppCreateInput) {
  await checkAdmin()
  try {
    const app = await prisma.marketplaceApp.create({
      data
    })
    return { success: true, app }
  } catch (_error) {
    console.error('Create app error:', _error)
    return { success: false, error: "Erreur lors de la création de l'application" }
  }
}

export async function updateMarketplaceApp(id: string, data: Prisma.MarketplaceAppUpdateInput) {
  await checkAdmin()
  try {
    const app = await prisma.marketplaceApp.update({
      where: { id },
      data
    })
    return { success: true, app }
  } catch (_error) {
    console.error('Update app error:', _error)
    return { success: false, error: "Erreur lors de la mise à jour" }
  }
}

export async function toggleMarketplaceApp(id: string, active: boolean) {
  await checkAdmin()
  try {
    await prisma.marketplaceApp.update({
      where: { id },
      data: { active }
    })
    return { success: true }
  } catch (_error) {
    return { success: false, error: "Erreur lors de la modification du statut" }
  }
}

export async function deleteMarketplaceApp(id: string) {
  await checkAdmin()
  try {
    await prisma.marketplaceApp.delete({
      where: { id }
    })
    return { success: true }
  } catch (_error) {
    return { success: false, error: "Erreur lors de la suppression" }
  }
}

export async function seedRealMarketplaceApps() {
  await checkAdmin()
  try {
    // 1. Delete all current apps to wipe out mockups and garbage data
    await prisma.marketplaceApp.deleteMany({});

    // 2. Insert the real, correct apps for the platform
    const realApps = [
      {
        id: 'fraud-cod',
        name: 'Anti-Fraude COD',
        description: "Bloque automatiquement les fausses commandes à la livraison pour les clients présentant un risque de non-réponse.",
        icon_url: 'ShieldCheck', // Used by Puzzle fallback visually if needed, but it's proper text
        category: 'SÉCURITÉ',
        is_premium: true,
        price: 9900,
        allowed_roles: ['vendor', 'admin'],
        features: [
          'Score de Risque Automatique via IA',
          'Blocage à la source si risque > 90%'
        ],
        active: true
      },
      {
        id: 'coach-ia',
        name: 'Coach IA Proactif',
        description: "Une intelligence artificielle qui analyse vos ventes quotidiennes et vous donne des recommandations stratégiques.",
        icon_url: 'Sparkles',
        category: 'INTELLIGENCE ARTIFICIELLE',
        is_premium: true,
        price: 15000,
        allowed_roles: ['vendor', 'closer'],
        features: [
          'Analyse IA des ventes quotidiennes',
          'Génération de scripts de closing'
        ],
        active: true
      },
      {
        id: 'telegram',
        name: 'Le Hub Telegram',
        description: "Votre poste de contrôle pour Telegram : Alertes de ventes temps-réel & Monétisation automatisée pour vos groupes VIP.",
        icon_url: 'MessageSquare',
        category: 'COMMUNICATION',
        is_premium: false,
        price: 0,
        allowed_roles: ['vendor', 'admin'],
        features: [
          'Notifications de ventes en temps réel',
          'Gestion des groupes Telegram payants et expulsion auto'
        ],
        active: true
      },
      {
        id: 'whatsapp-bot',
        name: 'WhatsApp Bot (Automatique)',
        description: "Bot automatisé pour confirmer les commandes COD sur WhatsApp directement et relancer les paniers abandonnés.",
        icon_url: 'Phone',
        category: 'MARKETING',
        is_premium: true,
        price: 24900,
        allowed_roles: ['vendor', 'closer'],
        features: [
          'Confirmation de commande automatique',
          'Relance automatisée des paniers abandonnés'
        ],
        active: true
      },
      {
        id: 'affilies',
        name: 'Hub Affiliation',
        description: "Créez votre propre armée d'ambassadeurs. Génération de liens de tracking et calculs des commissions automatiques.",
        icon_url: 'Trophy',
        category: 'MARKETING',
        is_premium: false,
        price: 0,
        allowed_roles: ['vendor', 'affiliate'],
        features: [
          'Tracking par Pixel et lien URL ultra-précis',
          'Envoi des commissions automatiques Wave/OM'
        ],
        active: true
      },
      {
        id: 'sms-marketing',
        name: 'SMS Marketing Manager',
        description: "Envoyez des campagnes SMS massives pour des promos flash ou des relances de clients inactifs.",
        icon_url: 'MessageSquare',
        category: 'MARKETING',
        is_premium: true,
        price: 5000,
        allowed_roles: ['vendor'],
        features: [
          'Envoi de campagnes SMS à toute la DB',
          'Inclusion dynamique du prénom du client'
        ],
        active: true
      }
    ];

    // Prisma doesn't support createMany with non-primitive types if features is a Json field in some versions easily, but it works with JSON.stringify if it's String. Wait, MarketplaceApp.features is Json?
    // Let's create one by one to ensure safety with types.
    for (const app of realApps) {
      await prisma.marketplaceApp.create({
        data: {
          id: app.id,
          name: app.name,
          description: app.description,
          icon_url: app.icon_url,
          category: app.category,
          is_premium: app.is_premium,
          price: app.price,
          allowed_roles: app.allowed_roles,
          features: app.features as Prisma.InputJsonValue,
          active: app.active
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Seed error:', error);
    return { success: false, error: "Erreur lors du réamorçage des apps" };
  }
}
