'use client'

import { useState, useEffect } from 'react'
import { Sparkles, BookOpen, AlertTriangle, ExternalLink, ThumbsUp, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { getActiveTips, markTipAsRead as markTipAsReadAction } from '@/app/actions/tips'

interface TipsClientProps {
  userId: string
  isPro: boolean
}

interface Tip {
  id: string
  type: 'guide' | 'news' | 'alert' | string
  title: string
  content: string
  cta_label?: string | null
  cta_url?: string | null
  target_plan?: string | null
  pinned: boolean
  active: boolean
  created_at: string
}

export default function TipsClient({ userId, isPro }: TipsClientProps) {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [readTips, setReadTips] = useState<string[]>([])
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const loadTips = async () => {
      setLoading(true)
      try {
        const allTips = await getActiveTips()
        const currentPlan = isPro ? 'pro' : 'gratuit'
        const filtered = allTips.filter((t: any) => t.target_plan === null || t.target_plan === currentPlan)
        setTips(filtered)

        // 2. Récupérer les ID des tips déjà lues
        const { data } = await supabase
          .from('TipRead')
          .select('tip_id')
          .eq('user_id', userId)

        if (data) {
          setReadTips(data.map(d => d.tip_id))
        }
      } catch (error) {
        console.error('Error loading tips:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTips()
  }, [userId, isPro, supabase])

  const markAsRead = async (tipId: string) => {
    if (readTips.includes(tipId)) return

    // Maj optimiste
    setReadTips(prev => [...prev, tipId])

    try {
      await markTipAsReadAction(tipId)
    } catch {
      // Échec silencieux
    }
  }

  const handleOpenTip = (tip: Tip) => {
    setSelectedTip(tip)
    markAsRead(tip.id)
  }

  const unreadCount = tips.filter(t => !readTips.includes(t.id)).length

  return (
    <div>
      {/* ── ALERTE HAUT ── */}
      {unreadCount > 0 && (
        <div className="bg-gold/10 border border-gold/30 p-4 rounded-xl flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gold/20 p-2 rounded-full">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <p className="font-bold text-gold">Vous avez {unreadCount} nouvelle(s) notification(s) !</p>
              <p className="text-sm text-gold/80">Lisez nos guides stratégiques pour booster vos ventes.</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Chargement des conseils...</p>
        </div>
      ) : tips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-4xl mb-4">✨</span>
          <p className="text-gray-400 font-medium">Aucun conseil pour le moment. Revenez bientôt !</p>
        </div>
      ) : (
        /* ── GRILLE DES TIPS ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tips.map((tip) => {
          const isRead = readTips.includes(tip.id)
          const isNews = tip.type === 'news'
          const isAlert = tip.type === 'alert'

          return (
            <div 
              key={tip.id}
              onClick={() => handleOpenTip(tip)}
              className={`relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-full
                ${!isRead ? 'border-gold/30 shadow-md transform -translate-y-1' : 'border-gray-200 hover:border-gold/30'}
                ${tip.pinned && !isRead ? 'ring-2 ring-gold ring-offset-2' : ''}
              `}
            >
              {/* Badge type */}
              <div className={`p-4 pb-2 flex items-center justify-between`}>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5
                  ${isNews ? 'bg-blue-100 text-blue-700' : isAlert ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                `}>
                  {isNews ? <Sparkles size={12}/> : isAlert ? <AlertTriangle size={12}/> : <BookOpen size={12}/>}
                  {tip.type}
                </span>

                {!isRead && (
                  <span className="w-2.5 h-2.5 bg-gold rounded-full animate-pulse"></span>
                )}
              </div>

              {/* Contenu Card */}
              <div className="p-4 pt-1 flex-1 flex flex-col">
                <h3 className={`text-lg font-bold mb-2 leading-tight ${!isRead ? 'text-ink' : 'text-gray-700'}`}>
                  {tip.title}
                </h3>
                <p className={`text-sm line-clamp-3 mb-4 flex-1 ${!isRead ? 'text-gray-600' : 'text-gray-500'}`}>
                  {tip.content}
                </p>
                <div className="text-xs text-gray-400 font-medium mt-auto">
                  {new Date(tip.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* ── MODALE LECTURE ── */}
      {selectedTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-deep/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transform transition-all">
            {/* Header Modale */}
            <div className={`p-6 pb-4 border-b ${
              selectedTip.type === 'news' ? 'bg-blue-50 border-blue-100' : 
              selectedTip.type === 'alert' ? 'bg-red-50 border-red-100' : 'bg-gold/10 border-gold/20'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 w-fit
                  ${selectedTip.type === 'news' ? 'bg-blue-200 text-blue-800' : 
                    selectedTip.type === 'alert' ? 'bg-red-200 text-red-800' : 'bg-gold/20 text-gold/80'}
                `}>
                  {selectedTip.type === 'news' ? <Sparkles size={12}/> : selectedTip.type === 'alert' ? <AlertTriangle size={12}/> : <BookOpen size={12}/>}
                  {selectedTip.type}
                </span>
                <button 
                  onClick={() => setSelectedTip(null)}
                  className="text-gray-400 hover:text-ink bg-white hover:bg-gray-100 p-1.5 rounded-full transition"
                  title="Fermer"
                >
                  <X size={20} />
                </button>
              </div>
              <h2 className="text-2xl font-black text-ink leading-tight">
                {selectedTip.title}
              </h2>
            </div>
            
            {/* Corps Modale */}
            <div className="p-6 text-gray-700 leading-relaxed">
              <p>{selectedTip.content}</p>
            </div>

            {/* Footer Modale */}
            <div className="p-6 pt-0 flex items-center justify-between gap-4">
              <button 
                onClick={() => setSelectedTip(null)}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-ink transition"
              >
                <ThumbsUp size={16} /> J&apos;ai compris
              </button>

              {selectedTip.cta_url && selectedTip.cta_label && (
                <a 
                  suppressHydrationWarning
                  href={selectedTip.cta_url}
                  className="bg-emerald-deep hover:bg-gray-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  {selectedTip.cta_label}
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
