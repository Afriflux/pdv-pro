'use client'

// ─── components/vendor/ContractBanner.tsx ────────────────────────────────────
// Bandeau d'alerte amber affiché en haut du dashboard si le contrat n'est pas signé
// Disparaît après signature (état local `signed`)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VendorContractModal from '@/components/vendor/VendorContractModal'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContractBannerProps {
  storeId:    string
  storeName:  string
  vendorName: string
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ContractBanner({
  storeId,
  storeName,
  vendorName,
}: ContractBannerProps) {
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
                Votre contrat partenaire n&apos;est pas signé.
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Vos clients ne peuvent pas finaliser leurs achats.
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
            Signer maintenant →
          </button>

        </div>
      </div>

      {/* ── Modal contrat ── */}
      {showModal && (
        <VendorContractModal
          storeId={storeId}
          storeName={storeName}
          vendorName={vendorName}
          onAccepted={() => {
            setSigned(true)
            setShowModal(false)
            // Rafraîchir les Server Components pour mettre à jour le layout
            router.refresh()
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
