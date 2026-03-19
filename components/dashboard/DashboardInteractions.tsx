'use client'

import { useState } from 'react'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    alert('Lien de vente copié !')
  }

  return (
    <button 
      onClick={handleCopy}
      className={`p-2.5 rounded-xl transition ${copied ? 'bg-emerald/20 text-emerald' : 'bg-white/10 hover:bg-white/20'}`}
      title="Copier le lien"
    >
      {copied ? '✅' : '📋'}
    </button>
  )
}
