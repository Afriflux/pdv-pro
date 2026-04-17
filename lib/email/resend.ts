import { createClient } from '@/lib/supabase/server'
import { sendTransactionalEmail } from '@/lib/brevo/brevo-service'

/**
 * Lit la clé API Resend depuis PlatformConfig (BDD).
 * Fallback : process.env.RESEND_API_KEY
 */
export async function getResendApiKey(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('PlatformConfig')
      .select('value')
      .eq('key', 'RESEND_API_KEY')
      .maybeSingle()

    if (data?.value && typeof data.value === 'string' && data.value.trim() !== '') {
      return data.value.trim()
    }
  } catch {
    // Silent fail
  }

  const envKey = process.env.RESEND_API_KEY
  if (envKey && envKey.trim() !== '') {
    return envKey.trim()
  }

  return null
}

interface ResendPayload {
  to: string[]
  subject: string
  html: string
  from?: string
}

async function sendResendAPI(payload: ResendPayload): Promise<boolean> {
  const apiKey = await getResendApiKey()
  
  // Fonction de fallback automatique vers Brevo
  const fallbackToBrevo = async () => {
    console.warn('[Resend Fallback] Bascule sur Brevo pour :', payload.subject)
    const senderName = payload.from?.split('<')[0]?.trim() || 'Yayyam'
    const senderEmail = payload.from?.match(/<([^>]+)>/)?.[1] || 'hello@yayyam.com'
    
    return sendTransactionalEmail({
      to: [{ email: payload.to[0] }],
      subject: payload.subject,
      htmlContent: payload.html,
      sender: { name: senderName, email: senderEmail }
    })
  }

  if (!apiKey) {
    return fallbackToBrevo()
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: payload.from || 'Yayyam <hello@yayyam.com>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Resend Error]', response.status, errorText)
      return fallbackToBrevo()
    }
    return true
  } catch (error) {
    console.error('[Resend Fetch Exception]', error)
    return fallbackToBrevo()
  }
}

// ─── Emails Transactionnels Core ──────────────────────────────────────────────────

export async function sendDigitalDeliveryEmail(email: string, productName: string, downloadUrl: string, storeName: string): Promise<boolean> {
  return sendResendAPI({
    to: [email],
    from: `${storeName || 'Yayyam'} <delivery@yayyam.com>`,
    subject: `[Accès] Votre commande : ${productName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Merci pour votre achat ! 🎁</h2>
        <p>Votre produit <strong>${productName}</strong> est prêt à être récupéré.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <p style="margin-bottom: 20px; color: #4B5563;">Cliquez sur le bouton ci-dessous pour accéder immédiatement à votre contenu :</p>
          <a href="${downloadUrl}" style="background-color: #0F7A60; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder à mon produit</a>
        </div>
        <p style="font-size: 12px; color: #6B7280; margin-top: 30px; text-align: center;">Si le bouton ne fonctionne pas, copiez ce lien : ${downloadUrl}</p>
      </div>
    `
  })
}

export async function sendInvoiceEmail(email: string, orderId: string, total: number, storeName: string): Promise<boolean> {
  return sendResendAPI({
    to: [email],
    from: `${storeName || 'Yayyam'} <billing@yayyam.com>`,
    subject: `Reçu pour votre commande #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Reçu de paiement 💳</h2>
        <p>Votre paiement de <strong>${total.toLocaleString('fr-FR')} FCFA</strong> a bien été traité avec succès par <strong>${storeName || 'Yayyam'}</strong>.</p>
        <p>Référence : #${orderId.toUpperCase()}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 13px; color: #6B7280;">Vous pouvez retrouver l'historique complet de vos achats et vos factures PDF depuis votre espace Acheteur Yayyam sécurisé.</p>
        <p style="margin-top: 20px;">
          <a href="https://yayyam.com/client/orders" style="color: #0F7A60; text-decoration: underline; font-weight: bold;">Voir ma commande</a>
        </p>
      </div>
    `
  })
}
