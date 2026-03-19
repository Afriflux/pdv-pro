'use client'
import { useState } from 'react'

export default function CopyButton({ url, compact = false }: { url: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erreur lors de la copie', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex-shrink-0 text-gold hover:text-gold-light transition font-mono ${
        compact ? 'text-xs' : 'text-xs bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-lg hover:bg-gold/20'
      }`}
      title="Copier le lien"
      type="button"
    >
      {copied ? (compact ? '✓' : '✓ Copié !') : (compact ? '📋' : 'Copier')}
    </button>
  )
}
