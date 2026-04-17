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
    const apps = await prisma.marketplaceApp.findMany({ take: 50, 
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
      { id: 'fraud-cod', name: 'Anti-Fraude COD', description: "Bloque automatiquement les fausses commandes à la livraison pour les clients présentant un risque de non-réponse.", icon_url: '🛡️', category: 'SÉCURITÉ', is_premium: true, price: 9900, allowed_roles: ['vendor', 'admin'], features: ['Score de Risque', 'Blocage Automatique'], active: true },
      { id: 'coach-ia', name: 'Coach IA Proactif', description: "Une intelligence artificielle qui analyse vos ventes quotidiennes.", icon_url: '✨', category: 'INTELLIGENCE ARTIFICIELLE', is_premium: true, price: 15000, allowed_roles: ['vendor', 'closer'], features: ['Analyse IA', 'Génération Scripts'], active: true },
      { id: 'telegram', name: 'Le Hub Telegram', description: "Votre poste de contrôle pour Telegram : Alertes de ventes temps-réel.", icon_url: '✈️', category: 'COMMUNICATION', is_premium: false, price: 0, allowed_roles: ['vendor', 'admin'], features: ['Notifications Live', 'Groupes VIP'], active: true },
      { id: 'whatsapp-bot', name: 'WhatsApp Bot (Automatique)', description: "Bot automatisé pour confirmer les commandes COD sur WhatsApp.", icon_url: '💬', category: 'MARKETING', is_premium: true, price: 24900, allowed_roles: ['vendor', 'closer'], features: ['Confirmation Auto', 'Relances Paniers'], active: true },
      { id: 'affilies', name: 'Hub Affiliation', description: "Créez votre propre armée d'ambassadeurs.", icon_url: '🤝', category: 'MARKETING', is_premium: false, price: 0, allowed_roles: ['vendor', 'affiliate'], features: ['Tracking Pixel', 'Commissions Autos'], active: true },
      { id: 'marketing', name: 'Marketing Hub', description: "Gérez vos canaux d'acquisition, l'inbound et vos analyses de trafic global.", icon_url: '📣', category: 'MARKETING', is_premium: false, price: 0, allowed_roles: ['vendor'], features: ['Acquisition', 'ROI'], active: true },
      { id: 'workflows', name: 'Automations & Flow', description: "Créer des tunnels automatisés sans coder.", icon_url: '⚡️', category: 'PRODUCTIVITY', is_premium: true, price: 15000, allowed_roles: ['vendor'], features: ['Zapier local', 'Triggers Autos'], active: true },
      { id: 'promotions', name: 'Codes Promos', description: "Gestion fine de coupons et réductions ciblées.", icon_url: '🏷️', category: 'MARKETING', is_premium: false, price: 0, allowed_roles: ['vendor'], features: ['Coupons', 'Flash Sales'], active: true },
      { id: 'ambassadeur', name: 'Programme Ambassadeurs', description: "Structure MLM avancée pour vos leaders.", icon_url: '🥇', category: 'MARKETING', is_premium: true, price: 10000, allowed_roles: ['vendor'], features: ['Sub-affiliés', 'Tableau de bord VVIP'], active: true },
      { id: 'links', name: 'Link-in-Bio Pro', description: "Arbre de liens SEO pour TikTok et IG.", icon_url: '🔗', category: 'PRODUCTIVITY', is_premium: false, price: 0, allowed_roles: ['vendor', 'affiliate'], features: ['BioLink UI', 'Tracking Social'], active: true },
      { id: 'ai-generator', name: 'Générateur Copywriting', description: "Génération automatique de fiches produits SEO avec IA.", icon_url: '🪄', category: 'INTELLIGENCE ARTIFICIELLE', is_premium: true, price: 4900, allowed_roles: ['vendor'], features: ['SEO Auto', 'Copywriting Magique'], active: true },
      { id: 'webhooks', name: 'Webhooks Développeurs', description: "Connectez Yayyam à vos propres serveurs.", icon_url: '⚙️', category: 'OPERATIONS', is_premium: true, price: 2900, allowed_roles: ['vendor'], features: ['Payloads bruts', 'JSON temps réel'], active: true },
      { id: 'customers', name: 'CRM Clients', description: "Historique et fiches détaillées de tous vos acheteurs.", icon_url: '👥', category: 'OPERATIONS', is_premium: false, price: 0, allowed_roles: ['vendor'], features: ['Suivi LTV', 'Historique'], active: true },
      { id: 'livraisons', name: 'Logistique & Colis', description: "Intégration directe avec vos livreurs et dispatching.", icon_url: '📦', category: 'OPERATIONS', is_premium: true, price: 12500, allowed_roles: ['vendor'], features: ['Bordereaux PDF', 'Dispatch'], active: true },
      { id: 'agenda', name: 'Booking & Agenda', description: "Prise de rendez-vous type Calendly intégrée.", icon_url: '📅', category: 'PRODUCTIVITY', is_premium: true, price: 3000, allowed_roles: ['vendor'], features: ['Créneaux', 'Synchro Gmail'], active: true },
      { id: 'tasks', name: 'Tâches & ToDo', description: "Outils de gestion interne pour vos équipes.", icon_url: '✅', category: 'PRODUCTIVITY', is_premium: false, price: 0, allowed_roles: ['vendor'], features: ['Kanban', 'Assignations'], active: true },
      { id: 'communautes', name: 'Communautés Privées', description: "Groupes de discussion hébergés pour vos cercles.", icon_url: '🌐', category: 'MARKETING', is_premium: true, price: 9000, allowed_roles: ['vendor'], features: ['Chats privés', 'Membres'], active: true },
      { id: 'closers', name: 'Manager de Closers', description: "Dispatch des leads et suivi des appels.", icon_url: '🎧', category: 'OPERATIONS', is_premium: true, price: 19900, allowed_roles: ['vendor'], features: ['Leads', 'Appels'], active: true },
      { id: 'academy', name: 'Masterclass Academy', description: "Hébergez vos formations vidéos VIP.", icon_url: '🎓', category: 'PRODUCTIVITY', is_premium: true, price: 19900, allowed_roles: ['vendor'], features: ['Hébergement', 'DRM'], active: true },
      { id: 'quotes', name: 'Gesti-Devis Pro', description: "Gestion B2B : création et facturation de devis pro.", icon_url: '📝', category: 'OPERATIONS', is_premium: true, price: 7900, allowed_roles: ['vendor'], features: ['Devis PDF', 'Paiement différé'], active: true },
      { id: 'payment-links', name: 'Liens de Paiement Rapides', description: "Générez des liens magiques type Stripe pour facturer via Whatsapp.", icon_url: '🔗', category: 'FINANCE', is_premium: true, price: 10000, allowed_roles: ['vendor'], features: ['Facture SMS', 'Link B2B'], active: true },
      { id: 'server-side-pixels', name: 'Pixels CAPI Avancés', description: "Facebook & Tiktok CAPI.", icon_url: '🎯', category: 'ANALYTICS', is_premium: true, price: 9900, allowed_roles: ['vendor'], features: ['ROAS parfait', 'Anti-Adblock'], active: true },
      { id: 'social-proof', name: 'Social Proof (Notifs)', description: "Popups de preuves sociales (quelqu'un vient d'acheter).", icon_url: '🔔', category: 'MARKETING', is_premium: false, price: 0, allowed_roles: ['vendor'], features: ['Popups visuels', 'Boost CVR'], active: true },
      { id: 'volume-discounts', name: 'Réductions par Volume', description: "Achetez-en 2, obtenez 10% de réduction.", icon_url: '🛒', category: 'MARKETING', is_premium: true, price: 4000, allowed_roles: ['vendor'], features: ['Tiers', 'Upsells intelligents'], active: true },
      { id: 'smart-reviews', name: 'Smart Reviews (Avis)', description: "Avis clients importés ou récoltés.", icon_url: '⭐️', category: 'MARKETING', is_premium: true, price: 2900, allowed_roles: ['vendor'], features: ['Avis Textes', 'Photos VIP'], active: true },
      { id: 'subscriptions', name: 'Abonnements Récurrents', description: "Facturez vos clients par mois ou à l'année.", icon_url: '🔄', category: 'FINANCE', is_premium: true, price: 29900, allowed_roles: ['vendor'], features: ['Paiement récurrent', 'Auto-Mailing'], active: true },
      { id: 'helpdesk', name: 'Support SAV (Tickets)', description: "Gérez les litiges en un seul clic.", icon_url: '🚑', category: 'OPERATIONS', is_premium: false, price: 0, allowed_roles: ['vendor'], features: ['Plaintes', 'Remboursements'], active: true },
      { id: 'email-sms-marketing', name: 'Campagnes E-mail & SMS (Brevo)', description: "Unifiez vos communications clients d'un seul coup.", icon_url: '📧', category: 'MARKETING', is_premium: true, price: 14900, allowed_roles: ['vendor'], features: ['Mass Mailing', 'Mass SMS'], active: true },
      { id: 'loyalty-points', name: 'Fidélité & Récompenses', description: "Récompensez vos meilleurs acheteurs et fidélisez.", icon_url: '🎁', category: 'MARKETING', is_premium: false, price: 0, allowed_roles: ['vendor'], features: ['Points', 'Cartes Cadeaux'], active: true }
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
