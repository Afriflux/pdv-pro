'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface AmbassadorCopyButtonProps {
  text: string
  label?: string
}

export default function AmbassadorCopyButton({ text, label = 'Copier' }: AmbassadorCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback pour les anciens navigateurs
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
        copied
          ? 'bg-white/20 text-white/90'
          : 'bg-white/15 hover:bg-white/25 text-white/80 hover:text-white border border-white/20'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Copié !
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {label}
        </>
      )}
    </button>
  )
}
