'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms/send'

/**
 * Récupère les stats et logs du Dashboard SMS pour le vendeur connecté
 */
export async function getSmsDashboard(storeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  const store = await prisma.store.findUnique({ where: { id: storeId, user_id: user.id } })
  if (!store) throw new Error("Boutique introuvable")

  const credits = await prisma.smsCredit.findUnique({ where: { store_id: storeId } })
  const campaigns = await prisma.smsCampaign.findMany({ 
    where: { store_id: storeId }, 
    orderBy: { created_at: 'desc' },
    take: 10
  })
  
  // Aggrégation pour les statistiques
  const logsCount = await prisma.smsLog.count({ where: { store_id: storeId } })
  const sentCount = await prisma.smsLog.count({ where: { store_id: storeId, status: 'sent' } })

  return {
    credits: credits?.credits || 0,
    used: credits?.used || 0,
    campaigns,
    stats: {
      totalLogs: logsCount,
      successRate: logsCount > 0 ? Math.round((sentCount / logsCount) * 100) : 0
    }
  }
}

/**
 * Achète des crédits SMS (Pour l'instant un Stub, devra rediriger vers le lien de paiement Yayyam/CinetPay)
 */
export async function purchaseSmsCredits(storeId: string, quantity: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  // Vérification de sécurité
  const store = await prisma.store.findUnique({ where: { id: storeId, user_id: user.id } })
  if (!store) throw new Error("Non autorisé")

  // TODO: Intégrer l'API de Payment de Yayyam. 
  // Pour le MVP on va faire une attribution directe pour les tests en Local.
  
  if (process.env.NODE_ENV === 'development') {
    const record = await prisma.smsCredit.upsert({
      where: { store_id: storeId },
      update: { credits: { increment: quantity } },
      create: { store_id: storeId, credits: quantity, used: 0 }
    })
    return { success: true, message: `Achat simulé: +${quantity} SMS crédités.`, data: record }
  }

  // Comportement normal : rediriger vers paiement
  // Ceci générera un lien de paiement pour acheter un "pack de sms"
  return { success: false, error: 'Module de paiement externe en attente d\'intégration' }
}

/**
 * Crée un brouillon de campagne
 */
export async function createSmsCampaign(storeId: string, name: string, message: string, recipients: { phone: string, name?: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  const campaign = await prisma.smsCampaign.create({
    data: {
      store_id: storeId,
      name,
      message,
      recipients: recipients,
      status: 'draft'
    }
  })

  return { success: true, campaign }
}

/**
 * Envoie une campagne en Batch à tous ses destinataires en respectant le crédit
 */
export async function sendSmsCampaign(campaignId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  const campaign = await prisma.smsCampaign.findUnique({
    where: { id: campaignId },
    include: { store: true }
  })

  if (!campaign || campaign.store.user_id !== user.id) {
    throw new Error("Campagne introuvable ou non autorisée")
  }

  // Extraire les destinataires
  const recipients = campaign.recipients as { phone: string, name?: string }[]
  if (!recipients || recipients.length === 0) {
    throw new Error("Aucun destinataire")
  }

  // Vérifier qu'il y a assez de crédit
  const creditRecord = await prisma.smsCredit.findUnique({ where: { store_id: campaign.store_id } })
  if (!creditRecord || creditRecord.credits < recipients.length) {
    throw new Error(`Crédit insuffisant. Solde : ${creditRecord?.credits || 0}, Destinataires : ${recipients.length}`)
  }

  // Passer en statut sending
  await prisma.smsCampaign.update({
    where: { id: campaignId },
    data: { status: 'sending', sent_at: new Date() }
  })

  let successCount = 0
  let failedCount = 0

  // Boucler (En production on utiliserait une file d'attente comme Redis/BullMQ)
  for (const person of recipients) {
    if (!person.phone) continue

    // Remplacement des variables simples
    let finalBody = campaign.message
    if (person.name) finalBody = finalBody.replace('{prenom}', person.name)
    finalBody = finalBody.replace('{boutique}', campaign.store.name)
    
    // Le lien devra sûrement être la boutique
    finalBody = finalBody.replace('{lien}', `https://${process.env.NEXT_PUBLIC_APP_DOMAIN || 'yayyam.com'}/${campaign.store.slug}`)

    const res = await sendSMS({
      to: person.phone,
      body: finalBody,
      storeId: campaign.store_id,
      type: 'campaign',
      campaignId: campaign.id
    })

    if (res.success) successCount++
    else failedCount++
  }

  // Terminer la campagne
  const completedCampaign = await prisma.smsCampaign.update({
    where: { id: campaignId },
    data: {
      status: 'completed',
      total_sent: successCount,
      total_failed: failedCount
    }
  })

  return { success: true, campaign: completedCampaign }
}
