'use client'

// ─── components/affiliate/AffiliateContractBanner.tsx ───────────────────────
// Bandeau d'alerte amber affiché en haut du portail affilié tant que le contrat n'est pas signé.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AffiliateContractModal from '@/components/affiliate/AffiliateContractModal'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AffiliateContractBannerProps {
  affiliateName: string
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AffiliateContractBanner({
  affiliateName,
}: AffiliateContractBannerProps) {
  const router = useRouter()
  const [signed,     setSigned]     = useState(false)
  const [showModal,  setShowModal]  = useState(false)

  // Bandeau masqué après signature
  if (signed) return null

  return (
    <>
      {/* ── Bandeau amber ── */}
      <div
        role="alert"
        className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          {/* Message */}
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="text-xl flex-shrink-0" aria-hidden="true">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-900 leading-tight">
                Votre contrat de promotion n&apos;est pas signé.
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                La signature de la charte de bonne conduite est obligatoire pour opérer.
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 px-4 py-2 text-xs font-bold text-white
              bg-[#0F7A60] hover:bg-[#0D6B53]
              rounded-xl transition-all shadow-sm shadow-[#0F7A60]/20
              self-start sm:self-auto"
          >
            Signer la Charte →
          </button>

        </div>
      </div>

      {/* ── Modal contrat affilié ── */}
      {showModal && (
        <AffiliateContractModal
          affiliateName={affiliateName}
          onAccepted={() => {
            setSigned(true)
            setShowModal(false)
            // Rafraîchir les Server Components pour retirer la bannière via le SSR
            router.refresh()
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
