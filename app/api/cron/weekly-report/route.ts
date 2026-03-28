// ─── app/api/cron/weekly-report/route.ts ─────────────────────────────────────
// GET — Cron hebdomadaire : envoie un rapport de performance à chaque vendeur actif
// Sécurisé par CRON_SECRET en header Authorization

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/brevo/brevo-service'
import { logCronExecution } from '@/lib/cron/cronLogger'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoreWithUser {
  id:      string
  name:    string
  slug:    string
  user_id: string
}

interface OrderRow {
  id:            string
  vendor_amount: number
  buyer_name:    string
  items:         unknown
}

interface WeeklyStats {
  totalOrders:   number
  totalRevenue:  number
  bestProduct:   string
  newCustomers:  number
}

// ─── Email HTML rapport hebdomadaire ─────────────────────────────────────────

function buildWeeklyReportEmail(
  vendorName: string,
  storeName:  string,
  storeSlug:  string,
  stats:      WeeklyStats,
  weekLabel:  string
): string {
  const revenueFormatted = stats.totalRevenue.toLocaleString('fr-FR')

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rapport hebdomadaire — ${storeName}</title></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0D5C4A,#0F7A60);padding:40px 48px;">
          <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;">PDV<span style="color:#C9A84C;">Pro</span></h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Rapport hebdomadaire · ${weekLabel}</p>
        </td></tr>
        <!-- Corps -->
        <tr><td style="padding:48px;">
          <p style="font-size:15px;color:#1A1A1A;line-height:1.6;">Bonjour <strong>${vendorName}</strong> 👋</p>
          <p style="font-size:15px;color:#4B5563;line-height:1.6;margin-top:4px;">
            Voici le résumé de votre boutique <strong>${storeName}</strong> pour la semaine écoulée.
          </p>
          <!-- Stats cards -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr>
              <td width="48%" style="background:#F0FAF7;border-radius:12px;padding:20px;text-align:center;border:1px solid rgba(15,122,96,0.1);">
                <p style="margin:0;font-size:28px;font-weight:900;color:#0F7A60;">${stats.totalOrders}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Commandes</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#FDF9F0;border-radius:12px;padding:20px;text-align:center;border:1px solid rgba(201,168,76,0.15);">
                <p style="margin:0;font-size:28px;font-weight:900;color:#C9A84C;">${revenueFormatted}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Revenus (FCFA)</p>
              </td>
            </tr>
            <tr><td colspan="3" style="padding-top:12px;"></td></tr>
            <tr>
              <td width="48%" style="background:#F9FAFB;border-radius:12px;padding:20px;text-align:center;border:1px solid #E5E7EB;">
                <p style="margin:0;font-size:22px;font-weight:900;color:#1A1A1A;">${stats.newCustomers}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Nouveaux clients</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#F9FAFB;border-radius:12px;padding:20px;text-align:center;border:1px solid #E5E7EB;">
                <p style="margin:0;font-size:13px;font-weight:700;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${stats.bestProduct || '—'}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Meilleur produit</p>
              </td>
            </tr>
          </table>
          ${stats.totalOrders === 0 ? `
          <div style="background:#FDF9F0;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">
              💡 <strong>Aucune vente cette semaine ?</strong> Partagez votre boutique sur les réseaux sociaux 
              ou créez une promotion pour attirer vos premiers clients !
            </p>
          </div>` : ''}
          <div style="text-align:center;margin:32px 0;">
            <a href="https://pdvpro.com/dashboard/analytics" style="display:inline-block;background:#0F7A60;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px;">
              Voir mes statistiques →
            </a>
          </div>
          <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:24px;">
            Votre boutique : <a href="https://pdvpro.com/${storeSlug}" style="color:#0F7A60;text-decoration:none;">pdvpro.com/${storeSlug}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F9FAFB;padding:24px 48px;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
            PDV Pro · Rapport automatique hebdomadaire<br>
            <a href="https://pdvpro.com/dashboard/settings" style="color:#0F7A60;text-decoration:none;">Se désabonner</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Calculer les stats de la semaine écoulées ────────────────────────────────

async function computeWeeklyStats(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  storeId: string
): Promise<WeeklyStats> {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const { data: orders } = await supabaseAdmin
    .from('Order')
    .select('id, vendor_amount, buyer_name, items')
    .eq('store_id', storeId)
    .in('status', ['completed', 'paid'])
    .gte('created_at', since.toISOString())

  const rows = (orders ?? []) as OrderRow[]

  const totalOrders  = rows.length
  const totalRevenue = rows.reduce((sum, o) => sum + (Number(o.vendor_amount) || 0), 0)

  // Clients distincts par nom d'acheteur
  const uniqueCustomers = new Set(rows.map(o => o.buyer_name).filter(Boolean))
  const newCustomers = uniqueCustomers.size

  // Meilleur produit : extraire depuis les items JSON
  const productCount: Record<string, number> = {}
  for (const order of rows) {
    try {
      const items = Array.isArray(order.items) ? order.items : JSON.parse(String(order.items ?? '[]'))
      for (const item of items as Array<{ name?: string; product_name?: string }>) {
        const pName = item.name ?? item.product_name ?? 'Produit inconnu'
        productCount[pName] = (productCount[pName] ?? 0) + 1
      }
    } catch {
      // Ignorer les items malformés
    }
  }

  const bestProduct = Object.entries(productCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? ''

  return { totalOrders, totalRevenue, bestProduct, newCustomers }
}

// ─── GET /api/cron/weekly-report ─────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Authentification par CRON_SECRET
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabaseAdmin = createAdminClient()
  const sent:   number   = 0
  const errors: string[] = []
  let sentCount = sent

  try {
    // 2. Récupérer tous les stores actifs
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('Store')
      .select('id, name, slug, user_id')
      .eq('is_active', true)

    if (storesError) {
      await logCronExecution('weekly-report', 'error', storesError.message)
      return NextResponse.json(
        { error: `Erreur récupération stores : ${storesError.message}` },
        { status: 500 }
      )
    }

    const activeStores = (stores ?? []) as StoreWithUser[]

    // Libellé de la semaine
    const now = new Date()
    const weekLabel = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    // 3. Traiter chaque store
    for (const store of activeStores) {
      try {
        // Récupérer email du vendeur
        const { data: userData } = await supabaseAdmin
          .from('User')
          .select('email, name')
          .eq('id', store.user_id)
          .single()

        if (!userData?.email) {
          errors.push(`Store ${store.id} : email vendeur introuvable`)
          continue
        }

        // Calculer les stats de la semaine
        const stats = await computeWeeklyStats(supabaseAdmin, store.id)

        // Envoyer l'email rapport
        const ok = await sendTransactionalEmail({
          to:          [{ email: userData.email, name: (userData.name as string | null) ?? store.name }],
          subject:     `📊 Votre rapport hebdomadaire — ${store.name}`,
          htmlContent: buildWeeklyReportEmail(
            (userData.name as string | null) ?? store.name,
            store.name,
            store.slug,
            stats,
            weekLabel
          ),
        })

        if (ok) {
          sentCount++
          console.log(`[Cron weekly-report] Email envoyé → ${userData.email} (${store.name})`)
        } else {
          errors.push(`Store ${store.id} : échec envoi Brevo`)
        }

      } catch (err: unknown) {

        errors.push(`Store ${store.id} : ${err instanceof Error ? err.message : 'Erreur'}`)
      }
    }

    console.log(`[Cron weekly-report] Terminé — envoyés: ${sentCount}, erreurs: ${errors.length}`)

    await logCronExecution('weekly-report', 'success', `Envoyés: ${sentCount}, Erreurs: ${errors.length}`)

    return NextResponse.json(
      { success: true, sent: sentCount, errors, total: activeStores.length },
      { status: 200 }
    )

  } catch (error: unknown) {
    await logCronExecution('weekly-report', 'error', error instanceof Error ? error.message : 'Exception critique')
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
