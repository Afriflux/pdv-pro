'use client'

import { Copy } from 'lucide-react'
import { toast } from '@/lib/toast'

export function PromoCopyButton({ code }: { code: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    toast.success('Code promo copié !')
  }

  return (
    <div 
      onClick={handleCopy}
      className="flex items-center justify-between bg-white border border-emerald/20 px-4 py-3 rounded-lg font-mono text-emerald-rich font-black tracking-widest cursor-pointer hover:bg-emerald/5 transition shadow-sm"
    >
      <span>{code}</span>
      <Copy size={16} className="text-emerald/50" />
    </div>
  )
}
