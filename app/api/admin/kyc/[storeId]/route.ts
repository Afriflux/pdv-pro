// ─── app/api/admin/kyc/[storeId]/route.ts ────────────────────────────────────
// Route PATCH — Valider ou rejeter un dossier KYC (admin uniquement)
// Actions : 'approve' → kyc_status = 'verified'
//           'reject'  → kyc_status = 'rejected' + rejection_reason dans kyc_documents

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail } from '@/lib/brevo/brevo-service'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PatchBody {
  action: 'approve' | 'reject'
  reason?: string
}

interface KYCDocuments {
  full_name?:        string
  id_card_url?:      string
  id_card_back_url?: string
  domicile_url?:     string
  submitted_at?:     string
  rejection_reason?: string
}

// ─── Emails HTML inline ───────────────────────────────────────────────────────

function buildApprovalEmail(vendorName: string, storeName: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KYC Validé — PDV Pro</title></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header émeraude -->
        <tr><td style="background:linear-gradient(135deg,#0D5C4A,#0F7A60);padding:40px 48px;">
          <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">PDV<span style="color:#C9A84C;">Pro</span></h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Plateforme de vente africaine</p>
        </td></tr>
        <!-- Corps -->
        <tr><td style="padding:48px;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:56px;margin-bottom:16px;">✅</div>
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#0F7A60;">Identité vérifiée !</h2>
            <p style="margin:0;color:#6B7280;font-size:15px;">Félicitations, votre dossier KYC a été approuvé</p>
          </div>
          <p style="font-size:15px;color:#1A1A1A;line-height:1.6;">Bonjour <strong>${vendorName}</strong>,</p>
          <p style="font-size:15px;color:#4B5563;line-height:1.6;">
            Bonne nouvelle ! Notre équipe a examiné votre dossier d'identité pour la boutique
            <strong>${storeName}</strong> et l'a validé avec succès.
          </p>
          <!-- Badge vérifié -->
          <div style="background:#F0FAF7;border:1px solid rgba(15,122,96,0.2);border-radius:12px;padding:20px 24px;margin:24px 0;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:24px;">🛡️</span>
              <div>
                <p style="margin:0;font-size:14px;font-weight:700;color:#0F7A60;">Vendeur vérifié PDV Pro</p>
                <p style="margin:4px 0 0;font-size:13px;color:#6B7280;">Votre badge de vérification est maintenant actif sur votre boutique</p>
              </div>
            </div>
          </div>
          <p style="font-size:14px;color:#4B5563;line-height:1.6;">
            Vous pouvez désormais effectuer des retraits et vos clients verront le badge 
            <strong>Vendeur Vérifié</strong> sur votre boutique, renforçant leur confiance.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="https://pdvpro.com/dashboard" style="display:inline-block;background:#0F7A60;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px;">
              Accéder à mon dashboard →
            </a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F9FAFB;padding:24px 48px;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
            PDV Pro · Plateforme de vente africaine 🌍<br>
            <a href="https://pdvpro.com" style="color:#0F7A60;text-decoration:none;">pdvpro.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildRejectionEmail(vendorName: string, storeName: string, reason: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KYC Refusé — PDV Pro</title></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header émeraude -->
        <tr><td style="background:linear-gradient(135deg,#0D5C4A,#0F7A60);padding:40px 48px;">
          <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">PDV<span style="color:#C9A84C;">Pro</span></h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Plateforme de vente africaine</p>
        </td></tr>
        <!-- Corps -->
        <tr><td style="padding:48px;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:56px;margin-bottom:16px;">❌</div>
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#DC2626;">Dossier non accepté</h2>
            <p style="margin:0;color:#6B7280;font-size:15px;">Votre dossier KYC a besoin de corrections</p>
          </div>
          <p style="font-size:15px;color:#1A1A1A;line-height:1.6;">Bonjour <strong>${vendorName}</strong>,</p>
          <p style="font-size:15px;color:#4B5563;line-height:1.6;">
            Après examen de votre dossier d'identité pour la boutique <strong>${storeName}</strong>,
            notre équipe n'a pas pu le valider.
          </p>
          <!-- Raison du rejet -->
          <div style="background:#FEF2F2;border:1px solid rgba(220,38,38,0.2);border-radius:12px;padding:20px 24px;margin:24px 0;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.05em;">
              Motif du refus
            </p>
            <p style="margin:0;font-size:14px;color:#7F1D1D;line-height:1.6;">${reason}</p>
          </div>
          <p style="font-size:14px;color:#4B5563;line-height:1.6;">
            Vous pouvez <strong>soumettre un nouveau dossier</strong> en corrigeant les points mentionnés ci-dessus.
            Notre équipe le retraitera dans les meilleurs délais.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="https://pdvpro.com/dashboard/kyc" style="display:inline-block;background:#0F7A60;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:12px;">
              Soumettre un nouveau dossier →
            </a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F9FAFB;padding:24px 48px;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
            PDV Pro · Plateforme de vente africaine 🌍<br>
            <a href="https://pdvpro.com" style="color:#0F7A60;text-decoration:none;">pdvpro.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── PATCH /api/admin/kyc/[storeId] ──────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { storeId: string } }
): Promise<NextResponse> {
  try {
    const { storeId } = params

    // 1. Auth admin (super_admin ou gestionnaire)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: adminUser } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['super_admin', 'gestionnaire']
    if (!adminUser?.role || !allowedRoles.includes(adminUser.role as string)) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé — rôle insuffisant' },
        { status: 403 }
      )
    }

    // 2. Parser le body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Body JSON invalide' }, { status: 400 })
    }

    const { action, reason } = body as PatchBody

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action invalide — 'approve' ou 'reject' attendu" },
        { status: 400 }
      )
    }

    if (action === 'reject' && !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Une raison de rejet est obligatoire' },
        { status: 400 }
      )
    }

    // 3. Récupérer le Store + données KYC
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('Store')
      .select('id, name, user_id, kyc_documents')
      .eq('id', storeId)
      .single()

    if (storeError || !storeData) {
      return NextResponse.json({ success: false, error: 'Boutique introuvable' }, { status: 404 })
    }

    // 4. Récupérer l'email du vendeur depuis la table User
    const { data: userData } = await supabaseAdmin
      .from('User')
      .select('email, name')
      .eq('id', storeData.user_id)
      .single()

    const vendorEmail = userData?.email ?? null
    const vendorName  = (userData?.name as string | null) ?? storeData.name

    // 5. Appliquer l'action

    if (action === 'approve') {
      // ── Approbation ─────────────────────────────────────────────────────────

      const { error: updateError } = await supabaseAdmin
        .from('Store')
        .update({
          kyc_status: 'verified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId)

      if (updateError) {
        console.error('[KYC approve] Erreur update:', updateError.message)
        return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
      }

      console.log(`[KYC approve] Boutique "${storeData.name}" (${storeId}) → verified ✅`)

      // Email de validation (fire-and-forget)
      if (vendorEmail) {
        sendTransactionalEmail({
          to:          [{ email: vendorEmail, name: vendorName }],
          subject:     '✅ Votre identité a été vérifiée sur PDV Pro !',
          htmlContent: buildApprovalEmail(vendorName, storeData.name as string),
        }).catch(() => {})
      }

      // ── Audit Log ────────────────────────────────────────────────────────
      await supabaseAdmin.from('AdminLog').insert({
        admin_id: user.id,
        action: 'APPROVE_KYC',
        target_type: 'store',
        target_id: storeId,
        details: { store_name: storeData.name }
      })

    } else {
      // ── Rejet ────────────────────────────────────────────────────────────────

      // Mettre à jour kyc_documents en ajoutant rejection_reason
      const existingDocs = (storeData.kyc_documents as KYCDocuments | null) ?? {}
      const updatedDocs: KYCDocuments = {
        ...existingDocs,
        rejection_reason: reason!.trim(),
      }

      const { error: updateError } = await supabaseAdmin
        .from('Store')
        .update({
          kyc_status:    'rejected',
          kyc_documents: updatedDocs,
          updated_at:    new Date().toISOString(),
        })
        .eq('id', storeId)

      if (updateError) {
        console.error('[KYC reject] Erreur update:', updateError.message)
        return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
      }

      console.log(
        `[KYC reject] Boutique "${storeData.name}" (${storeId}) → rejected ❌ · raison: ${reason}`
      )

      // Email de rejet (fire-and-forget)
      if (vendorEmail) {
        sendTransactionalEmail({
          to:          [{ email: vendorEmail, name: vendorName }],
          subject:     '❌ Votre dossier KYC a été refusé — PDV Pro',
          htmlContent: buildRejectionEmail(vendorName, storeData.name as string, reason!.trim()),
        }).catch(() => {})
      }

      // ── Audit Log ────────────────────────────────────────────────────────
      await supabaseAdmin.from('AdminLog').insert({
        admin_id: user.id,
        action: 'REJECT_KYC',
        target_type: 'store',
        target_id: storeId,
        details: { store_name: storeData.name, reason: reason!.trim() }
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: unknown) {

    console.error('[KYC admin PATCH] Erreur non gérée:', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
