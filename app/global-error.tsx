'use client'

/**
 * global-error.tsx — Captures errors that occur in the ROOT LAYOUT itself.
 * Unlike error.tsx, this must provide its own <html> and <body> tags
 * because the root layout has already failed when this renders.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#FAFAF7' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 32, padding: 48, boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <div style={{ width: 72, height: 72, background: '#FEF2F2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>
              ⚠️
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
              Erreur Critique
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px', lineHeight: 1.6, fontWeight: 500 }}>
              Une erreur inattendue s'est produite. Notre équipe technique a été alertée.
              Veuillez recharger la page.
            </p>
            <button
              onClick={() => reset()}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 12,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              🔄 Réessayer
            </button>
            <a
              href="/"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 24px',
                background: '#f9fafb',
                color: '#1a1a1a',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              🏠 Retour à l'accueil
            </a>
          </div>
          <p style={{ marginTop: 32, fontSize: 13, color: '#9ca3af', fontWeight: 800, letterSpacing: '-0.3px' }}>
            Yayyam<span style={{ color: '#10b981' }}>.</span>
          </p>
        </div>
      </body>
    </html>
  )
}
