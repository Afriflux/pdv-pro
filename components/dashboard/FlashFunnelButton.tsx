'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateFlashFunnel } from '@/app/actions/flash-funnel'
import { Zap } from 'lucide-react'

export default function FlashFunnelButton({ productId, compact = false, className = '' }: { productId: string, compact?: boolean, className?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    
    try {
      const res = await generateFlashFunnel(productId)
      if (res?.success && res.pageId) {
        router.push(`/dashboard/pages/${res.pageId}/edit`)
      } else {
        alert(res?.error || "Erreur de génération du Funnel Flash")
        setLoading(false)
      }
    } catch (_err) {
      alert("Une erreur inattendue est survenue.")
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleGenerate}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl font-bold transition-all shadow-sm group relative overflow-hidden
        ${loading ? 'opacity-50 cursor-wait bg-gray-100 text-gray-400' : 'bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C] hover:text-white hover:shadow-lg hover:shadow-[#C9A84C]/20'}
        ${compact ? 'p-2' : 'px-4 py-2 text-[13px]'}
        ${className}
      `}
      title="Générer un Funnel Flash en 1 clic"
    >
      <Zap size={compact ? 18 : 16} className={`${loading ? "animate-pulse" : ""} ${!loading && !compact ? "group-hover:-translate-y-0.5 transition-transform" : ""}`} />
      {!compact && (loading ? "Flash..." : "Flash Funnel")}
    </button>
  )
}
