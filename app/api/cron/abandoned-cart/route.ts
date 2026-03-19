// ─── app/api/cron/abandoned-cart/route.ts ────────────────────────────────────
// GET — Cron relance panier abandonné
// Cherche les commandes status='pending_payment' créées > 2h et < 24h
// Envoie un email de relance si buyer_email disponible et pas déjà contacté
// Anti-doublon : flag 'abandoned_cart_sent' dans metadata

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/brevo/brevo-service'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderWithStore {
  id:           string
  buyer_name:   string
  buyer_email:  string | null
  buyer_phone:  string | null
  total_amount: number
  items:        unknown
  metadata:     Record<string, unknown> | null
  created_at:   string
  store: Array<{ name: string; slug: string }> | null
}

// ─── Email HTML relance panier abandonné ─────────────────────────────────────

function buildAbandonedCartEmail(
  buyerName:   string,
  storeName:   string,
  storeSlug:   string,
  productName: string,
  totalAmount: number
): string {
  const amountFormatted = totalAmount.toLocaleString('fr-FR')
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Votre commande vous attend — ${storeName}</title></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0D5C4A,#0F7A60);padding:40px 48px;">
          <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;">PDV<span style="color:#C9A84C;">Pro</span></h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">${storeName}</p>
        </td></tr>
        <!-- Corps -->
        <tr><td style="padding:48px;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:56px;margin-bottom:16px;">🛒</div>
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1A1A1A;">Votre commande vous attend !</h2>
            <p style="margin:0;color:#6B7280;font-size:14px;">Vous avez laissé des articles dans votre panier</p>
          </div>
          <p style="font-size:15px;color:#1A1A1A;line-height:1.6;">Bonjour <strong>${buyerName}</strong>,</p>
          <p style="font-size:15px;color:#4B5563;line-height:1.6;">
            Vous avez laissé votre commande chez <strong>${storeName}</strong> en suspens.
            Ne laissez pas ces articles vous échapper !
          </p>
          <!-- Produit -->
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:20px 24px;margin:24px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <p style="margin:0;font-size:14px;font-weight:700;color:#1A1A1A;">${productName}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">Article en attente de paiement</p>
              </div>
              <div style="text-align:right;">
                <p style="margin:0;font-size:18px;font-weight:900;color:#0F7A60;">${amountFormatted} FCFA</p>
              </div>
            </div>
          </div>
          <!-- Urgence -->
          <div style="background:#FDF9F0;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">
              ⏰ <strong>Stock limité !</strong> Finalisez votre achat maintenant pour être sûr(e) de recevoir votre article.
            </p>
          </div>
          <div style="text-align:center;margin:28px 0;">
            <a href="https://pdvpro.com/${storeSlug}" style="display:inline-block;background:#0F7A60;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px;">
              Finaliser ma commande →
            </a>
          </div>
          <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:16px;">
            Si vous avez déjà effectué votre paiement, ignorez cet email.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F9FAFB;padding:24px 48px;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
            PDV Pro · Marketplace africaine 🌍 ·
            <a href="https://pdvpro.com/${storeSlug}" style="color:#0F7A60;text-decoration:none;">${storeName}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Extraire le premier produit depuis les items JSON ────────────────────────

function extractFirstProductName(items: unknown): string {
  try {
    const arr = Array.isArray(items) ? items : JSON.parse(String(items ?? '[]'))
    const first = arr[0] as { name?: string; product_name?: string } | undefined
    return first?.name ?? first?.product_name ?? 'Votre article'
  } catch {
    return 'Votre article'
  }
}

// ─── GET /api/cron/abandoned-cart ────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Authentification par CRON_SECRET
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabaseAdmin = createAdminClient()

  try {
    // 2. Fenêtre temporelle : > 2h et < 24h
    const now    = new Date()
    const twoH   = new Date(now.getTime() - 2  * 60 * 60 * 1000)
    const twentyFourH = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // 3. Récupérer les commandes abandonnées
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('Order')
      .select(`
        id, buyer_name, buyer_email, buyer_phone,
        total_amount, items, metadata, created_at,
        store:store_id ( name, slug )
      `)
      .eq('status', 'pending_payment')
      .lte('created_at', twoH.toISOString())
      .gte('created_at', twentyFourH.toISOString())

    if (ordersError) {
      return NextResponse.json(
        { error: `Erreur récupération commandes : ${ordersError.message}` },
        { status: 500 }
      )
    }

    const pendingOrders = (orders ?? []) as OrderWithStore[]
    let processed = 0
    let sent      = 0

    // 4. Traiter chaque commande
    for (const order of pendingOrders) {
      processed++

      // Anti-doublon : vérifier si déjà relancé
      const meta = (order.metadata ?? {}) as Record<string, unknown>
      if (meta.abandoned_cart_sent === true) {
        console.log(`[Cron abandoned-cart] Déjà relancé — order ${order.id}`)
        continue
      }

      // Pas d'email → impossible de relancer
      if (!order.buyer_email) {
        console.log(`[Cron abandoned-cart] Pas d'email — order ${order.id}`)
        continue
      }

      const storeName  = order.store?.[0]?.name ?? 'votre boutique'
      const storeSlug  = order.store?.[0]?.slug ?? ''
      const productName = extractFirstProductName(order.items)

      try {
        // Envoyer l'email de relance
        const ok = await sendTransactionalEmail({
          to:          [{ email: order.buyer_email, name: order.buyer_name }],
          subject:     `🛒 Votre commande chez ${storeName} vous attend !`,
          htmlContent: buildAbandonedCartEmail(
            order.buyer_name,
            storeName,
            storeSlug,
            productName,
            Number(order.total_amount) || 0
          ),
        })

        if (ok) {
          sent++
          console.log(`[Cron abandoned-cart] Email envoyé → ${order.buyer_email} (order ${order.id})`)

          // Marquer comme relancé dans metadata (anti-doublon)
          await supabaseAdmin
            .from('Order')
            .update({
              metadata: {
                ...meta,
                abandoned_cart_sent:    true,
                abandoned_cart_sent_at: now.toISOString(),
              },
            })
            .eq('id', order.id)

        } else {
          console.warn(`[Cron abandoned-cart] Échec Brevo — order ${order.id}`)
        }

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error(`[Cron abandoned-cart] Erreur order ${order.id} :`, msg)
      }
    }

    console.log(
      `[Cron abandoned-cart] Terminé — processées: ${processed}, emails envoyés: ${sent}`
    )

    return NextResponse.json(
      { success: true, processed, sent },
      { status: 200 }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
