'use client'

// ─── Bouton Click-to-Call pour commandes COD ─────────────────────────────────
// Permet au vendeur d'appeler ou WhatsApp l'acheteur en un clic.

import { Phone, MessageCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CallButtonProps {
  phone: string           // Numéro de l'acheteur (ex: "+221771234567" ou "0033612345678")
  buyerName?: string      // Nom affiché dans le message WhatsApp
  orderId?: string        // ID commande (pour le message WhatsApp)
  variant?: 'call' | 'whatsapp' | 'both'  // Mode d'affichage (défaut: 'both')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Nettoie le numéro pour wa.me : supprime espaces, tirets, parenthèses et + */
function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[\s\-().+]/g, '')
}

/** Génère le message WhatsApp pré-rempli */
function buildWhatsAppMessage(buyerName?: string, orderId?: string): string {
  const greet  = buyerName ? `Bonjour ${buyerName}` : 'Bonjour'
  const ref    = orderId   ? ` concernant votre commande #${orderId.slice(0, 8)}` : ''
  return (
    `${greet}, je vous contacte${ref} sur Yayyam. ` +
    `Pouvez-vous confirmer votre disponibilité pour la livraison ?`
  )
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function CallButton({
  phone,
  buyerName,
  orderId,
  variant = 'both',
}: CallButtonProps) {
  const phoneClean  = formatPhoneForWhatsApp(phone)
  const waMessage   = buildWhatsAppMessage(buyerName, orderId)
  const waLink      = `https://wa.me/${phoneClean}?text=${encodeURIComponent(waMessage)}`

  const showCall    = variant === 'call'      || variant === 'both'
  const showWa      = variant === 'whatsapp'  || variant === 'both'

  return (
    <div className="inline-flex rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {/* ── Bouton Appel téléphonique ───────────────────────────── */}
      {showCall && (
        <a
          href={`tel:${phone}`}
          title={`Appeler ${buyerName ?? phone}`}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0F7A60] hover:bg-[#0D6A52] text-white text-xs font-bold transition-colors"
        >
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Appeler</span>
        </a>
      )}

      {/* Séparateur si les deux boutons sont affichés */}
      {showCall && showWa && (
        <div className="w-px bg-white/20" />
      )}

      {/* ── Bouton WhatsApp ─────────────────────────────────────── */}
      {showWa && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          title={`WhatsApp ${buyerName ?? phone}`}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1DB954] text-white text-xs font-bold transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>WhatsApp</span>
        </a>
      )}
    </div>
  )
}
