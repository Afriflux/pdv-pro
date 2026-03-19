// ─── app/dashboard/kyc/page.tsx ──────────────────────────────────────────────
// Server Component — charge le statut KYC du vendeur
// et délègue le rendu au composant client KYCForm

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KYCForm from './KYCForm'

export default async function KYCPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Charger les données KYC du store du vendeur connecté
  const { data: store } = await supabase
    .from('Store')
    .select('id, kyc_status, kyc_document_type, id_card_url, kyc_documents')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  const { kyc_status, kyc_documents } = store

  // Extraire la raison de rejet depuis kyc_documents si présente
  const kycDocuments  = kyc_documents as Record<string, string> | null
  const rejectionReason = kycDocuments?.rejection_reason ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── En-tête ── */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-[#0F7A60]/10 text-[#0F7A60]">
            <span className="text-xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Vérification KYC</h1>
        </div>
        <p className="text-sm text-gray-400 ml-12">
          Vérifiez votre identité pour débloquer les retraits et renforcer la confiance de vos clients.
        </p>
      </header>

      {/* ── Statut : Compte vérifié ── */}
      {kyc_status === 'verified' && (
        <div className="bg-[#F0FAF7] border border-[#0F7A60]/20 rounded-2xl p-8 text-center">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-black text-[#0F7A60] mb-2">Compte vérifié</h2>
          <p className="text-sm text-[#0F7A60]/70">
            Votre identité a été vérifiée avec succès par notre équipe.
            Votre badge &ldquo;Vendeur vérifié&rdquo; est actif sur votre boutique.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-[#0F7A60] text-white text-sm font-bold px-4 py-2 rounded-full">
            <span>✓</span>
            <span>Vendeur vérifié PDV Pro</span>
          </div>
        </div>
      )}

      {/* ── Statut : En cours de vérification ── */}
      {kyc_status === 'submitted' && (
        <div className="bg-[#FDF9F0] border border-[#C9A84C]/20 rounded-2xl p-8 text-center">
          <p className="text-5xl mb-4">⏳</p>
          <h2 className="text-xl font-black text-[#C9A84C] mb-2">En cours de vérification</h2>
          <p className="text-sm text-gray-500">
            Votre dossier KYC a été soumis et est en cours d&apos;examen par notre équipe.
            La vérification prend généralement <strong>24 à 48 heures</strong>.
          </p>
          <div className="mt-5 bg-white border border-[#C9A84C]/20 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-gray-500">📋 Documents soumis</p>
            {kycDocuments?.id_card_url && (
              <p className="text-xs text-gray-700 flex items-center gap-2">
                <span className="text-[#0F7A60]">✓</span> Pièce d&apos;identité (recto)
              </p>
            )}
            {kycDocuments?.id_card_back_url && (
              <p className="text-xs text-gray-700 flex items-center gap-2">
                <span className="text-[#0F7A60]">✓</span> Pièce d&apos;identité (verso)
              </p>
            )}
            {kycDocuments?.domicile_url && (
              <p className="text-xs text-gray-700 flex items-center gap-2">
                <span className="text-[#0F7A60]">✓</span> Justificatif de domicile
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Statut : Formulaire (pending / null / rejected) ── */}
      {(kyc_status === null || kyc_status === 'pending' || kyc_status === 'rejected') && (
        <KYCForm
          storeId={store.id}
          initialStatus={kyc_status ?? null}
          rejectionReason={rejectionReason}
        />
      )}
    </div>
  )
}
