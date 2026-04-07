'use client'

// ─── components/vendor/VendorContractModal.tsx ───────────────────────────────
// Modal de signature du contrat partenaire vendeur Yayyam
// POST /api/vendor/contract/accept → { storeId }

import { useState } from 'react'
import { toast } from '@/lib/toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VendorContractModalProps {
  storeName:  string
  vendorName: string
  storeId:    string
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

export default function VendorContractModal({
  storeName,
  vendorName,
  storeId,
  onAccepted,
  onClose,
}: VendorContractModalProps) {
  const [accepted, setAccepted] = useState(false)
  const [signing,  setSigning]  = useState(false)

  const today = formatDate()

  async function handleSign() {
    if (!accepted || signing) return
    setSigning(true)
    try {
      const res = await fetch('/api/vendor/contract/accept', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storeId }),
      })
      const data = await res.json() as { success?: boolean; error?: string }

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur lors de la signature')
      }

      toast.success('✅ Contrat signé ! Votre espace est maintenant actif.')
      onAccepted()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur interne')
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
              📜 Contrat Partenaire Vendeur Yayyam
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Veuillez lire attentivement avant de signer
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
              CONTRAT PARTENAIRE VENDEUR YAYYAM
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Entre</p>
                <p className="font-bold">Yayyam</p>
                <p className="text-gray-500">(la Plateforme)</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Et</p>
                <p className="font-bold">{storeName}</p>
                <p className="text-gray-500">exploité par {vendorName}</p>
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
              Le Vendeur s&#39;engage à utiliser Yayyam pour commercialiser ses produits et services
              dans le respect des présentes conditions générales d&#39;utilisation.
            </p>
          </article>

          {/* Article 2 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 2 — Commissions plateforme</h3>
            <p className="text-gray-600 mb-3">
              Le Vendeur accepte le modèle de commission dégressif Yayyam, calculé sur le chiffre
              d&#39;affaires mensuel hors taxes :
            </p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1.5">
              {[
                { range: '0 à 100 000 FCFA/mois',          rate: '7 %' },
                { range: '100 001 à 500 000 FCFA/mois',    rate: '6 %' },
                { range: '500 001 à 1 000 000 FCFA/mois',  rate: '5 %' },
                { range: 'Plus de 1 000 000 FCFA/mois',    rate: '4 %' },
                { range: 'Paiement à la livraison (COD)',   rate: '5 % fixe' },
              ].map(({ range, rate }) => (
                <div key={range} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{range}</span>
                  <span className="font-black text-[#0F7A60]">{rate}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Article 3 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 3 — Obligations du Vendeur</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600">
              <li>Vendre uniquement des produits et services licites</li>
              <li>Honorer toutes les commandes confirmées dans les délais annoncés</li>
              <li>Maintenir des informations exactes et à jour sur ses produits</li>
              <li>Ne pas tromper les acheteurs sur la nature ou la qualité des produits</li>
              <li>Traiter les remboursements légitimes dans les meilleurs délais</li>
            </ul>
          </article>

          {/* Article 4 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 4 — Retraits et paiements</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600">
              <li>Les fonds sont crédités sur le portefeuille Yayyam après confirmation de chaque commande</li>
              <li>Le montant minimum de retrait est de <strong>5 000 FCFA</strong></li>
              <li>Les retraits sont traités automatiquement via Wave ou Orange Money selon les coordonnées configurées</li>
            </ul>
          </article>

          {/* Article 5 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 5 — Propriété intellectuelle</h3>
            <p className="text-gray-600">
              Le Vendeur certifie détenir tous les droits nécessaires (propriété intellectuelle,
              droits d&#39;auteur, marques, etc.) sur les produits, images et contenus publiés
              sur sa boutique Yayyam. Yayyam ne saurait être tenu responsable
              en cas de violation de ces droits par le Vendeur.
            </p>
          </article>

          {/* Article 6 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 6 — Résiliation</h3>
            <p className="text-gray-600">
              Yayyam se réserve le droit de suspendre ou de fermer définitivement un compte vendeur
              en cas de fraude avérée, de plaintes répétées d&#39;acheteurs, de vente de produits
              illicites ou de non-respect des présentes conditions. Le Vendeur sera notifié
              par email avant toute action définitive, sauf en cas de fraude grave.
            </p>
          </article>

          {/* Article 7 */}
          <article>
            <h3 className="font-black text-[#1A1A1A] mb-2">Article 7 — Droit applicable</h3>
            <p className="text-gray-600">
              Ce contrat est régi par le droit sénégalais en vigueur.
              Tout litige relatif à son interprétation ou à son exécution sera soumis
              à la compétence exclusive des tribunaux compétents de Dakar, Sénégal.
            </p>
          </article>

        </div>

        {/* ── Pied — checkbox + boutons ── */}
        <div className="px-6 py-5 border-t border-gray-100 flex-shrink-0 space-y-4 bg-[#FAFAF7] rounded-b-2xl">
          {/* Checkbox acceptation */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                id="vendor-contract-accept"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0F7A60] cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors select-none">
              J&#39;ai lu attentivement et j&#39;accepte les termes du{' '}
              <strong>Contrat Partenaire Vendeur Yayyam</strong>.
              Je certifie que les informations fournies sont exactes
              et m&#39;engage à respecter toutes les obligations définies ci-dessus.
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
                Plus tard
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
                  <span>Signature en cours...</span>
                </>
              ) : (
                '✍️ Signer et activer mon espace'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
