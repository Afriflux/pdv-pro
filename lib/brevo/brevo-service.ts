// ─── lib/brevo/brevo-service.ts ─────────────────────────────────────────────
// Service central pour toutes les interactions avec l'API Brevo (email marketing)
// Clé API lue depuis PlatformConfig (BDD) avec fallback sur process.env.BREVO_API_KEY
// Base URL : https://api.brevo.com/v3

import { createClient } from '@/lib/supabase/server'
import { vendorEmptyStoreEmail, vendorMasterclassReminderEmail } from './email-templates'

// ─── Constantes ──────────────────────────────────────────────────────────────

const BREVO_BASE_URL = 'https://api.brevo.com/v3'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BrevoContact {
  email: string
  attributes?: Record<string, string | number | boolean>
  listIds?: number[]
}

export interface BrevoEmailParams {
  to: Array<{ email: string; name?: string }>
  subject: string
  htmlContent?: string
  templateId?: number
  params?: Record<string, string | number>
  sender?: { name: string; email: string }
}

export interface BrevoEventParams {
  email: string
  event: string
  properties?: Record<string, string | number | boolean>
}

export interface BrevoContactStats {
  email: string
  id?: number
  emailBlacklisted: boolean
  smsBlacklisted: boolean
  createdAt: string
  modifiedAt: string
  listIds: number[]
  statistics?: Record<string, unknown>
}

export interface BrevoCreateCampaignParams {
  name: string
  subject: string
  htmlContent: string
  sender: { name: string; email: string }
  recipients: { listIds: number[] }
  scheduledAt?: string
}

// ─── 1. Lecture de la clé API Brevo ──────────────────────────────────────────

/**
 * Lit la clé API Brevo depuis PlatformConfig (BDD).
 * Fallback : process.env.BREVO_API_KEY
 * Retourne null si aucune clé n'est configurée.
 */
export async function getBrevoApiKey(): Promise<string | null> {
  try {
    // Tentative de lecture depuis PlatformConfig en BDD
    const supabase = await createClient()
    const { data } = await supabase
      .from('PlatformConfig')
      .select('value')
      .eq('key', 'BREVO_API_KEY')
      .maybeSingle()

    if (data?.value && typeof data.value === 'string' && data.value.trim() !== '') {
      return data.value.trim()
    }
  } catch {
    // En cas d'erreur de connexion, on passe au fallback silencieusement
    console.warn('[Brevo] Impossible de lire PlatformConfig, utilisation du fallback .env')
  }

  // Fallback : variable d'environnement
  const envKey = process.env.BREVO_API_KEY
  if (envKey && envKey.trim() !== '') {
    return envKey.trim()
  }

  console.error('[Brevo] ⚠️ Aucune clé API Brevo configurée (PlatformConfig ni .env)')
  return null
}

// ─── Helper : headers communs Brevo ───────────────────────────────────────────

/**
 * Construit les headers HTTP pour les requêtes Brevo API v3.
 */
async function buildBrevoHeaders(): Promise<Record<string, string> | null> {
  const apiKey = await getBrevoApiKey()
  if (!apiKey) return null

  return {
    'api-key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

// ─── 2. Créer / Mettre à jour un contact Brevo (upsert) ──────────────────────

/**
 * Crée ou met à jour un contact dans Brevo.
 * Utilise POST /contacts avec updateEnabled=true pour simuler un upsert.
 *
 * @param email     - Adresse email du contact
 * @param attributes - Attributs Brevo : PRENOM, NOM, BOUTIQUE, PAYS, etc.
 * @param listIds   - IDs des listes Brevo (ex: 1 = acheteurs, 2 = vendeurs)
 */
export async function createOrUpdateContact(
  email: string,
  attributes?: Record<string, string | number | boolean>,
  listIds?: number[]
): Promise<boolean> {
  const headers = await buildBrevoHeaders()
  if (!headers) return false

  try {
    const body: Record<string, unknown> = {
      email,
      updateEnabled: true, // Upsert : met à jour si le contact existe déjà
    }

    if (attributes && Object.keys(attributes).length > 0) {
      body.attributes = attributes
    }

    if (listIds && listIds.length > 0) {
      body.listIds = listIds
    }

    const response = await fetch(`${BREVO_BASE_URL}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    // 201 = créé, 204 = mis à jour (no content)
    if (response.status === 201 || response.status === 204) {
      return true
    }

    // Brevo retourne 400 si le contact existe et updateEnabled=false, mais avec updateEnabled=true c'est rare
    const errorText = await response.text()
    console.error(`[Brevo] createOrUpdateContact erreur ${response.status}:`, errorText)
    return false
  } catch (error) {
    console.error('[Brevo] createOrUpdateContact exception:', error)
    return false
  }
}

// ─── 3. Envoi d'email transactionnel ─────────────────────────────────────────

/**
 * Envoie un email transactionnel via l'API Brevo SMTP.
 * Supporte : HTML brut, template ID Brevo, ou les deux.
 *
 * @param params - Destinataires, sujet, contenu HTML ou templateId Brevo
 */
export async function sendTransactionalEmail(params: BrevoEmailParams): Promise<boolean> {
  const headers = await buildBrevoHeaders()
  if (!headers) return false

  try {
    const body: Record<string, unknown> = {
      to: params.to,
      subject: params.subject,
      sender: params.sender ?? {
        name: 'Yayyam',
        email: 'noreply@yayyam.com',
      },
    }

    // Contenu HTML ou template Brevo (template prioritaire)
    if (params.templateId) {
      body.templateId = params.templateId
      if (params.params) {
        body.params = params.params
      }
    } else if (params.htmlContent) {
      body.htmlContent = params.htmlContent
    } else {
      console.error('[Brevo] sendTransactionalEmail : htmlContent ou templateId requis')
      return false
    }

    const response = await fetch(`${BREVO_BASE_URL}/smtp/email`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (response.ok) {
      return true
    }

    const errorText = await response.text()
    console.error(`[Brevo] sendTransactionalEmail erreur ${response.status}:`, errorText)
    return false
  } catch (error) {
    console.error('[Brevo] sendTransactionalEmail exception:', error)
    return false
  }
}

// ─── 4. Ajouter un contact à une liste Brevo ─────────────────────────────────

/**
 * Ajoute un contact existant à une liste Brevo spécifique.
 * POST /contacts/lists/{listId}/contacts/add
 *
 * @param email  - Email du contact à ajouter
 * @param listId - ID de la liste Brevo cible
 */
export async function addContactToList(email: string, listId: number): Promise<boolean> {
  const headers = await buildBrevoHeaders()
  if (!headers) return false

  try {
    const body = {
      emails: [email],
    }

    const response = await fetch(`${BREVO_BASE_URL}/contacts/lists/${listId}/contacts/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    // 204 = succès sans contenu
    if (response.status === 204 || response.status === 200) {
      return true
    }

    const errorText = await response.text()
    console.error(`[Brevo] addContactToList erreur ${response.status}:`, errorText)
    return false
  } catch (error) {
    console.error('[Brevo] addContactToList exception:', error)
    return false
  }
}

// ─── 5. Tracker un événement Brevo ───────────────────────────────────────────

/**
 * Envoie un événement de tracking à Brevo (achat, inscription, panier abandonné...).
 * POST /events
 *
 * @param params - Email de l'utilisateur, nom de l'événement, propriétés optionnelles
 */
export async function trackEvent(params: BrevoEventParams): Promise<boolean> {
  const headers = await buildBrevoHeaders()
  if (!headers) return false

  try {
    const body: Record<string, unknown> = {
      email: params.email,
      event: params.event,
    }

    if (params.properties && Object.keys(params.properties).length > 0) {
      body.properties = params.properties
    }

    const response = await fetch(`${BREVO_BASE_URL}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (response.ok || response.status === 204) {
      return true
    }

    const errorText = await response.text()
    console.error(`[Brevo] trackEvent erreur ${response.status}:`, errorText)
    return false
  } catch (error) {
    console.error('[Brevo] trackEvent exception:', error)
    return false
  }
}

// ─── 6. Créer une campagne email ──────────────────────────────────────────────

/**
 * Crée une campagne email dans Brevo.
 * POST /emailCampaigns
 * Retourne l'ID de la campagne créée, ou null en cas d'erreur.
 *
 * @param params - Nom, sujet, contenu HTML, expéditeur, listes cibles, date programmée
 */
export async function createEmailCampaign(
  params: BrevoCreateCampaignParams
): Promise<string | null> {
  const headers = await buildBrevoHeaders()
  if (!headers) return null

  try {
    const body: Record<string, unknown> = {
      name: params.name,
      subject: params.subject,
      htmlContent: params.htmlContent,
      sender: params.sender,
      recipients: params.recipients,
      // Type de campagne : 'classic'
      type: 'classic',
    }

    // Date programmée (optionnelle) — format ISO 8601
    if (params.scheduledAt) {
      body.scheduledAt = params.scheduledAt
    }

    const response = await fetch(`${BREVO_BASE_URL}/emailCampaigns`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (response.status === 201) {
      const data = (await response.json()) as { id: number }
      return String(data.id)
    }

    const errorText = await response.text()
    console.error(`[Brevo] createEmailCampaign erreur ${response.status}:`, errorText)
    return null
  } catch (error) {
    console.error('[Brevo] createEmailCampaign exception:', error)
    return null
  }
}

// ─── 7. Récupérer les stats d'un contact ─────────────────────────────────────

/**
 * Récupère les informations et statistiques d'un contact Brevo par email.
 * GET /contacts/{email}
 * Retourne les données du contact ou null si introuvable.
 *
 * @param email - Adresse email du contact à interroger
 */
export async function getContactStats(email: string): Promise<BrevoContactStats | null> {
  const headers = await buildBrevoHeaders()
  if (!headers) return null

  try {
    const encodedEmail = encodeURIComponent(email)
    const response = await fetch(`${BREVO_BASE_URL}/contacts/${encodedEmail}`, {
      method: 'GET',
      headers,
    })

    if (response.status === 200) {
      const data = await response.json()
      return data as BrevoContactStats
    }

    if (response.status === 404) {
      // Contact non trouvé : cas normal, pas d'erreur à logger
      return null
    }

    const errorText = await response.text()
    console.error(`[Brevo] getContactStats erreur ${response.status}:`, errorText)
    return null
  } catch (error) {
    console.error('[Brevo] getContactStats exception:', error)
    return null
  }
}

// ─── 8. Lister les campagnes email ───────────────────────────────────────────

export interface BrevoCampaign {
  id: number
  name: string
  subject: string
  status: string
  type: string
  createdAt: string
  modifiedAt: string
  scheduledAt?: string
  statistics?: {
    globalStats?: {
      uniqueClicks?: number
      uniqueOpens?: number
      unsubscriptions?: number
      delivered?: number
      sent?: number
    }
  }
}

/**
 * Récupère la liste des campagnes email depuis Brevo.
 * GET /emailCampaigns?status=sent|scheduled|draft
 */
export async function listEmailCampaigns(status?: 'sent' | 'scheduled' | 'draft'): Promise<BrevoCampaign[]> {
  const headers = await buildBrevoHeaders()
  if (!headers) return []

  try {
    const params = new URLSearchParams({ limit: '50', offset: '0' })
    if (status) {
      params.set('status', status)
    }

    const response = await fetch(`${BREVO_BASE_URL}/emailCampaigns?${params.toString()}`, {
      method: 'GET',
      headers,
    })

    if (response.ok) {
      const data = await response.json() as { campaigns?: BrevoCampaign[] }
      return data.campaigns ?? []
    }

    const errorText = await response.text()
    console.error(`[Brevo] listEmailCampaigns erreur ${response.status}:`, errorText)
    return []
  } catch (error) {
    console.error('[Brevo] listEmailCampaigns exception:', error)
    return []
  }
}

// ─── 9. Récupérer les stats globales de la liste ─────────────────────────────

export interface BrevoListStats {
  id: number
  name: string
  totalBlacklisted: number
  totalSubscribers: number
  uniqueSubscribers: number
}

/**
 * Récupère les statistiques d'une liste Brevo (nombre d'abonnés, etc.).
 * GET /contacts/lists/{listId}
 */
export async function getListStats(listId: number): Promise<BrevoListStats | null> {
  const headers = await buildBrevoHeaders()
  if (!headers) return null

  try {
    const response = await fetch(`${BREVO_BASE_URL}/contacts/lists/${listId}`, {
      method: 'GET',
      headers,
    })

    if (response.ok) {
      const data = await response.json()
      return {
        id: data.id as number,
        name: data.name as string,
        totalBlacklisted: (data.totalBlacklisted as number) ?? 0,
        totalSubscribers: (data.totalSubscribers as number) ?? 0,
        uniqueSubscribers: (data.uniqueSubscribers as number) ?? 0,
      }
    }

    console.error(`[Brevo] getListStats erreur ${response.status}`)
    return null
  } catch (error) {
    console.error('[Brevo] getListStats exception:', error)
    return null
  }
}

// ─── 10. Emails Spécifiques Yayyam ──────────────────────────────────────────

export async function sendWelcomeEmail(email: string, storeName: string): Promise<boolean> {
  const apiKey = await getBrevoApiKey()
  if (!apiKey) {
    console.log(`[Brevo Fallback] Brevo email would be sent: Welcome to ${storeName} at ${email}`)
    return true
  }
  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Bienvenue sur Yayyam, ${storeName} !`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Bienvenue sur Yayyam ! 🎉</h2>
        <p>Félicitations pour la création de votre boutique <strong>${storeName}</strong> !</p>
        <p>Voici 3 étapes rapides pour bien démarrer :</p>
        <ul style="list-style: none; padding-left: 0;">
          <li style="margin-bottom: 10px;">📦 <strong>Ajoutez votre premier produit</strong> : Créez votre première fiche produit en quelques clics.</li>
          <li style="margin-bottom: 10px;">🔗 <strong>Partagez votre lien boutique sur WhatsApp</strong> : Envoyez le lien de votre boutique ou produit à vos clients.</li>
          <li style="margin-bottom: 10px;">💰 <strong>Attendez vos premières ventes !</strong> : Encaissez vos revenus directement.</li>
        </ul>
        <p style="margin-top: 30px;">
          <a href="https://yayyam.com/dashboard" style="background-color: #0F7A60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Accéder à mon tableau de bord</a>
        </p>
      </div>
    `
  })
}

export async function sendFirstSaleEmail(email: string, productName: string, amount: number): Promise<boolean> {
  const apiKey = await getBrevoApiKey()
  if (!apiKey) {
    console.log(`[Brevo Fallback] Brevo email would be sent: First sale of ${productName} for ${amount} F at ${email}`)
    return true
  }
  return sendTransactionalEmail({
    to: [{ email }],
    subject: "Félicitations ! Votre première vente sur Yayyam",
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Vous avez réalisé votre première vente ! 🎉</h2>
        <p>Félicitations, un client vient de commander sur votre boutique !</p>
        <ul style="list-style: none; padding-left: 0; background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
          <li style="margin-bottom: 8px;"><strong>Produit :</strong> ${productName}</li>
          <li><strong>Montant :</strong> ${amount.toLocaleString('fr-FR')} F</li>
        </ul>
        <p style="margin-top: 30px;">
          <a href="https://yayyam.com/dashboard/orders" style="background-color: #0F7A60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Gérer mes commandes</a>
        </p>
      </div>
    `
  })
}

// ─── 11. Lifecycle Automations ───────────────────────────────────────────────

export async function sendEmptyStoreEmail(email: string, vendorName: string): Promise<boolean> {
  const apiKey = await getBrevoApiKey()
  if (!apiKey) {
    console.log(`[Brevo Fallback] Action = Empty Store Reminder -> ${email}`)
    return true
  }
  return sendTransactionalEmail({
    to: [{ email }],
    subject: "C'est dommage de s'arrêter là... 🚀 (Ta boutique est vide)",
    htmlContent: vendorEmptyStoreEmail(vendorName)
  })
}

export async function sendMasterclassReminderEmail(email: string, vendorName: string): Promise<boolean> {
  const apiKey = await getBrevoApiKey()
  if (!apiKey) {
    console.log(`[Brevo Fallback] Action = Masterclass Reminder -> ${email}`)
    return true
  }
  return sendTransactionalEmail({
    to: [{ email }],
    subject: "Arrêtez de perdre des ventes. 🛑",
    htmlContent: vendorMasterclassReminderEmail(vendorName)
  })
}


