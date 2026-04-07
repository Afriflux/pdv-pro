'use client'

// ─── components/affiliate/AffiliateContractModal.tsx ──────────────────────────
// Modal de signature du contrat d'affiliation Yayyam
// Appelle la server action `acceptAffiliateContract`

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { acceptAffiliateContract } from '@/app/portal/settings/actions'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AffiliateContractModalProps {
  affiliateName: string
  onAccepted: () => void       // callback après signature réussie
  onClose?:   () => void       // optionnel — si absent, modal non fermable
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AffiliateContractModal({
  affiliateName,
  onAccepted,
  onClose,
}: AffiliateContractModalProps) {
  const [accepted, setAccepted] = useState(false)
  const [signing,  setSigning]  = useState(false)

  const today = formatDate()

  async function handleSign() {
    if (!accepted || signing) return
    setSigning(true)
    try {
      const res = await acceptAffiliateContract()

      if (res.error) {
        throw new Error(res.error)
      }

      toast.success('✅ Contrat signé ! Votre espace affilié est maintentant débloqué.')
      onAccepted()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur interne lors de la signature')
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* ── En-tête ── */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#1A1A1A]">
              🤝 Contrat Partenaire Affilié Yayyam
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Veuillez lire attentivement nos conditions de promotion avant de signer
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors text-sm"
              aria-label="Fermer"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Corps scrollable ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-gray-700 leading-relaxed">

          {/* Parties */}
          <div className="bg-[#FAFAF7] rounded-xl p-5 border border-gray-100">
            <p className="font-black text-[#1A1A1A] text-center text-xs uppercase tracking-widest mb-4">
              CONTRAT PARTENAIRE AFFILIÉ YAYYAM
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Entre</p>
                <p className="font-bold">Yayyam</p>
                <p className="text-gray-500">(la Plateforme)</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Et l'Affilié</p>
                <p className="font-bold">{affiliateName}</p>
                <p className="text-gray-500">(le Promoteur)</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                <span className="font-bold uppercase tracking-wider">Date : </span>
                {today}
              </p>
            </div>
          </div>

          {/* Article 1 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 1 — Objet</h3>
            <p className="text-gray-600">
              Le présent accord régit la relation d'affiliation entre Yayyam et l'Affilié. 
              Ce dernier s'engage à faire la promotion des offres et produits hébergés sur la plateforme afin de générer des ventes.
            </p>
          </article>

          {/* Article 2 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 2 — Rémunération et Commissions</h3>
            <p className="text-gray-600 mb-3">
              L'Affilié percevra une commission pour chaque vente finale et validée (notamment dans le cadre d'un modèle COD) 
              acquise via son lien ou code de parrainage exclusif. Le taux de commission est défini par le Vendeur ou la Plateforme.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600">
              <li>Les commandes annulées, retournées ou non livrées ne génèrent aucune commission.</li>
              <li>Les fonds attribués sont visibles instantanément dans le Portefeuille de l'Affilié après validation.</li>
            </ul>
          </article>

          {/* Article 3 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 3 — Éthique de Promotion</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600">
              <li><strong>Interdiction absolue du SPAM :</strong> L'envoi massif ou non sollicité d'e-mails est proscrit.</li>
              <li>L'Affilié s'interdit de sur-vendre un produit en omettant délibérément la vérité ou en formulant de fausses promesses afin d'obtenir le clic.</li>
              <li>Il est interdit de soumissionner ou de réaliser des enchères publicitaires trompeuses sur le nom de marque exclusif "Yayyam" ou celui de ses vendeurs à l'insu de la plateforme.</li>
            </ul>
          </article>

          {/* Article 4 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 4 — Paiement des Retraits</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600">
              <li>Le système de retrait suit un échéancier strict afin de garantir la disponibilité des fonds en accord avec nos vendeurs partenaires.</li>
              <li>L'Affilié doit configurer une adresse de paiement valide et maintenir ses informations personnelles à jour dans son interface.</li>
            </ul>
          </article>

          {/* Article 5 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 5 — Clause de Non-Concurrence ou de Débauchage</h3>
            <p className="text-gray-600">
              Durant sa relation avec Yayyam, l'Affilié respecte le réseau en ne tentant pas de débaucher de manière déloyale des acheteurs existants du système pour le compte d'une entité tierce sans motif et accord légitimes.
            </p>
          </article>

          {/* Article 6 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 6 — Résiliation et Sanction</h3>
            <p className="text-gray-600">
              Yayyam peut acter la clôture ou la suspension provisoire du compte affilié sur-le-champ (incluant les gains générés si la fraude est avérée) s'il est démontré :
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600 mt-2">
              <li>Génération de fausses commandes.</li>
              <li>Blanchiment d'argent et fraude coordonnée à la carte bancaire.</li>
              <li>Manquements majeurs à l'Article 3 (SPAM massif signalé).</li>
            </ul>
          </article>
        </div>

        {/* ── Pied — checkbox + boutons ── */}
        <div className="px-6 py-5 border-t border-gray-100 flex-shrink-0 space-y-4 bg-[#FAFAF7] rounded-b-2xl">
          {/* Checkbox acceptation */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                id="affiliate-contract-accept"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0F7A60] cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors select-none">
              Je confirme avoir lu en totalité et compris les termes du{' '}
              <strong>Contrat Partenaire Affilié Yayyam</strong>.
              En cochant cette case, j'accepte de respecter l'ensemble des règles de bonnes pratiques de promotion instaurées par la plateforme.
            </p>
          </label>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="order-2 sm:order-1 px-4 py-2.5 text-sm font-bold text-gray-500 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-all"
              >
                Fermer
              </button>
            )}
            <button
              type="button"
              onClick={handleSign}
              disabled={!accepted || signing}
              className="order-1 sm:order-2 px-6 py-2.5 text-sm font-bold text-white
                bg-[#0F7A60] hover:bg-[#0D6B53]
                disabled:opacity-40 disabled:cursor-not-allowed
                rounded-xl transition-all shadow-sm shadow-[#0F7A60]/20
                flex items-center justify-center gap-2"
            >
              {signing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Validation en cours...</span>
                </>
              ) : (
                '✍️ Signer la Charte Affilié'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
