// Moteur Asynchrone (QStash sans SDK for zero-dependency / Edge support)

const QSTASH_URL = "https://qstash.upstash.io/v2/publish"
const QSTASH_TOKEN = process.env.QSTASH_TOKEN // À ajouter dans .env (ex: ey...)

type JobPayload = {
  type: string
  data: any
}

interface PublishOptions {
  delay?: string // Format: '2h', '30d', '5m'
  notBefore?: number // Unix timestamp
}

export async function publishJob(endpoint: string, payload: JobPayload, options?: PublishOptions) {
  if (!QSTASH_TOKEN) {
    console.warn("⚠️ QSTASH_TOKEN manquant: Exécution immédiate (Mode Dégradé)")
    // Fallback : Exécution asynchrone non-fiable (Next.js background block)
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(e => console.error("Job fallback failed", e))
    return null
  }

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${QSTASH_TOKEN}`,
    "Content-Type": "application/json",
  }

  // Configurations de délai (https://upstash.com/docs/qstash/features/delay)
  if (options?.delay) {
    headers["Upstash-Delay"] = options.delay
  }
  if (options?.notBefore) {
    headers["Upstash-Not-Before"] = String(options.notBefore)
  }

  try {
    const res = await fetch(`${QSTASH_URL}/${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Erreur QStash (${res.status}): ${errorText}`)
    }

    const data = await res.json()
    console.log(`[Queue] Job programmé: ${data.messageId} (Type: ${payload.type})`)
    return data.messageId
  } catch (error) {
    console.error("[Queue] Echec de la publication:", error)
    throw error
  }
}

/**
 * Fonction helper pour envoyer un rappel (Panier Abandonné)
 */
export async function scheduleAbandonedCartReminder(leadId: string, delay = '2h') {
  const endpoint = `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/abandoned-cart`
  return publishJob(endpoint, { type: 'abandoned_cart', data: { lead_id: leadId } }, { delay })
}

/**
 * Fonction helper pour programmer la fin d'abonnement Telegram
 */
export async function scheduleTelegramKick(userId: string, groupId: string, days: number) {
  const endpoint = `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/telegram-kick`
  return publishJob(endpoint, { type: 'telegram_kick', data: { user_id: userId, group_id: groupId } }, { delay: `${days}d` })
}
