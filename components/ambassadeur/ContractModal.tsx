'use client'

// ─── components/ambassadeur/ContractModal.tsx ─────────────────────────────────
// Modal de signature du contrat ambassadeur Yayyam
// Affiche le contrat pré-rempli + checkbox d'acceptation + bouton signer

import { useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContractModalProps {
  ambassadorName:   string
  ambassadorCode:   string
  commissionAmount: number
  onAccept:         () => void
  onClose:          () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ContractModal({
  ambassadorName,
  ambassadorCode,
  commissionAmount,
  onAccept,
  onClose,
}: ContractModalProps) {
  const [accepted, setAccepted] = useState(false)
  const [signing,  setSigning]  = useState(false)

  const today = formatDate()

  async function handleSign() {
    if (!accepted) return
    setSigning(true)
    try {
      await onAccept()
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* ── En-tête ── */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#1A1A1A]">📜 Contrat Ambassadeur Yayyam</h2>
            <p className="text-xs text-gray-400 mt-0.5">Veuillez lire attentivement avant de signer</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            aria-label="Fermer le modal"
          >
            ✕
          </button>
        </div>

        {/* ── Corps — contrat ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-gray-700 space-y-5 leading-relaxed">

          {/* Parties */}
          <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100">
            <p className="font-black text-[#1A1A1A] text-center mb-3 uppercase tracking-wider text-xs">
              CONTRAT D&apos;AMBASSADEUR YAYYAM
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Entre</p>
                <p className="font-bold">Yayyam (la Plateforme)</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Et</p>
                <p className="font-bold">{ambassadorName} <span className="text-gray-400">(l&#39;Ambassadeur)</span></p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Date</p>
                <p className="font-bold">{today}</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Code ambassadeur</p>
                <p className="font-mono font-black text-[#0F7A60]">{ambassadorCode}</p>
              </div>
            </div>
          </div>

          {/* Article 1 */}
          <div>
            <p className="font-black text-[#1A1A1A] mb-1">Article 1 — Objet</p>
            <p className="text-gray-600">
              L&#39;Ambassadeur s&#39;engage à promouvoir Yayyam et à recruter des vendeurs actifs sur la plateforme en
              utilisant son code ambassadeur unique <strong className="font-mono">{ambassadorCode}</strong>.
            </p>
          </div>

          {/* Article 2 */}
          <div>
            <p className="font-black text-[#1A1A1A] mb-1">Article 2 — Rémunération</p>
            <p className="text-gray-600 mb-2">
              L&#39;Ambassadeur percevra{' '}
              <strong>{commissionAmount.toLocaleString('fr-FR')} FCFA</strong>{' '}
              par filleul ayant rempli les conditions suivantes dans son premier mois :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
              <li>KYC vérifié (identité confirmée sur Yayyam)</li>
              <li>Minimum <strong>50 000 FCFA</strong> de CA réalisé</li>
              <li><strong>1 mois</strong> d&#39;existence sur la plateforme</li>
            </ul>
            <p className="text-xs text-amber-700 font-bold mt-2 bg-amber-50 px-3 py-1.5 rounded-lg">
              ⚠️ Ces trois conditions doivent être remplies simultanément pour déclencher le versement.
            </p>
          </div>

          {/* Article 3 */}
          <div>
            <p className="font-black text-[#1A1A1A] mb-1">Article 3 — Obligations de l&#39;Ambassadeur</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
              <li>Ne recruter que des vendeurs réels et actifs</li>
              <li>Respecter la charte de communication Yayyam</li>
              <li>Ne pas fausser les conditions de validation des filleuls</li>
              <li>Maintenir son KYC vérifié sur la plateforme</li>
            </ul>
          </div>

          {/* Article 4 */}
          <div>
            <p className="font-black text-[#1A1A1A] mb-1">Article 4 — Résiliation</p>
            <p className="text-gray-600">
              Yayyam se réserve le droit de résilier ce contrat et de désactiver le badge ambassadeur
              en cas de fraude, de recrutement fictif ou de non-respect des présentes conditions.
              Toute commission en cours sera gelée jusqu&#39;à résolution du litige.
            </p>
          </div>

          {/* Article 5 */}
          <div>
            <p className="font-black text-[#1A1A1A] mb-1">Article 5 — Durée</p>
            <p className="text-gray-600">
              Ce contrat est valide tant que le programme ambassadeur est actif sur Yayyam
              et que le badge ambassadeur est maintenu actif par l&#39;équipe Yayyam.
            </p>
          </div>

          {/* Article 6 */}
          <div>
            <p className="font-black text-[#1A1A1A] mb-1">Article 6 — Paiement</p>
            <p className="text-gray-600">
              Les commissions sont versées automatiquement via Wave ou Orange Money (selon les
              informations renseignées dans le profil ambassadeur), dès validation des conditions filleul.
            </p>
          </div>

        </div>

        {/* ── Pied — checkbox + bouton ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 space-y-4">
          {/* Checkbox acceptation */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0F7A60] cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
              J&#39;ai lu attentivement et j&#39;accepte les termes du{' '}
              <strong>Contrat Ambassadeur Yayyam</strong>.
              Je certifie que les informations fournies sont exactes et m&#39;engage à respecter toutes les obligations définies ci-dessus.
            </p>
          </label>

          {/* Boutons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSign}
              disabled={!accepted || signing}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F7A60] hover:bg-[#0D6B53]
                disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all
                flex items-center gap-2 shadow-sm"
            >
              {signing ? (
                <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg><span>Signature en cours...</span></>
              ) : (
                '✍️ Signer et rejoindre le programme'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
