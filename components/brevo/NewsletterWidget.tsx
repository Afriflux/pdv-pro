'use client'

// ─── components/brevo/NewsletterWidget.tsx ───────────────────────────────────
// Widget d'inscription newsletter affiché sur les pages boutique /[slug]
// Envoie le formulaire vers POST /api/brevo/subscribe
// États : idle → loading → success | error

import { useState } from 'react'
import { toast } from '@/lib/toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewsletterWidgetProps {
  storeId:   string
  storeName: string
  listId?:   number
}

type Status = 'idle' | 'loading' | 'success' | 'error'

// ─── Composant ───────────────────────────────────────────────────────────────

export default function NewsletterWidget({
  storeId,
  storeName,
  listId,
}: NewsletterWidgetProps) {
  const [email, setEmail]   = useState<string>('')
  const [status, setStatus] = useState<Status>('idle')

  // ── Validation email basique ──────────────────────────────────────────────
  function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  }

  // ── Soumission du formulaire ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    // Validation côté client
    if (!email.trim()) {
      toast.error('Veuillez saisir votre adresse email.')
      return
    }
    if (!isValidEmail(email)) {
      toast.error('Adresse email invalide.')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/brevo/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:     email.trim(),
          storeName,
          storeId,
          ...(listId !== undefined ? { listId } : {}),
        }),
      })

      const data = await response.json() as { success?: boolean; error?: string }

      if (response.ok && data.success) {
        setStatus('success')
        setEmail('')
        toast.success(`Abonnement confirmé ! Vous recevrez les offres de ${storeName}.`)
      } else {
        throw new Error(data.error ?? 'Erreur lors de l\'inscription.')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur interne. Réessayez.'
      setStatus('error')
      toast.error(message)
      // Réinitialiser vers idle après 3 secondes pour permettre une nouvelle tentative
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">

      {/* En-tête */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg" aria-hidden="true">📧</span>
        <h3 className="text-sm font-black text-[#1A1A1A] tracking-tight">
          Restez informé(e) !
        </h3>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Recevez en avant-première les offres et nouveautés de{' '}
        <span className="font-semibold text-[#0F7A60]">{storeName}</span>.
      </p>

      {/* État succès */}
      {status === 'success' ? (
        <div className="flex items-center gap-2 bg-[#F0FAF7] border border-[#0F7A60]/20 rounded-xl px-4 py-3">
          <span className="text-base" aria-hidden="true">✅</span>
          <p className="text-sm font-semibold text-[#0F7A60]">
            Inscription confirmée ! Merci.
          </p>
        </div>
      ) : (
        /* Formulaire */
        <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
          {/* Input email */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            disabled={status === 'loading'}
            autoComplete="email"
            aria-label="Votre adresse email"
            className="
              flex-1 min-w-0
              px-3 py-2.5
              text-sm text-[#1A1A1A]
              bg-[#FAFAF7] border border-gray-200 rounded-xl
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-[#0F7A60]/30 focus:border-[#0F7A60]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
            "
          />

          {/* Bouton S'abonner */}
          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            aria-label="S'abonner à la newsletter"
            className="
              flex-shrink-0
              px-4 py-2.5
              text-sm font-bold text-white
              bg-[#0F7A60] hover:bg-[#0D6B53] active:bg-[#0B5E49]
              rounded-xl shadow-sm
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
              whitespace-nowrap
            "
          >
            {status === 'loading' ? (
              /* Spinner inline */
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>...</span>
              </span>
            ) : (
              "S'abonner"
            )}
          </button>
        </form>
      )}

      {/* Message d'erreur inline discret */}
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-500 font-medium">
          Une erreur est survenue. Réessayez dans quelques instants.
        </p>
      )}

      {/* Note de confidentialité */}
      <p className="mt-3 text-xs text-gray-400 leading-relaxed">
        Pas de spam. Désabonnement en un clic à tout moment.
      </p>
    </div>
  )
}
