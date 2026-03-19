'use client'

// app/dashboard/tips/TipsAccordion.tsx
// Client Component — accordéon interactif pour les articles Tips

import { useState } from 'react'

interface Tip {
  number: number
  title: string
  desc: string
}

interface Article {
  id:    number
  emoji: string
  title: string
  intro: string
  color: string    // bg color ring
  tips:  Tip[]
}

interface TipsAccordionProps {
  articles: Article[]
}

export default function TipsAccordion({ articles }: TipsAccordionProps) {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggle = (id: number) => setOpenId(prev => prev === id ? null : id)

  return (
    <div className="space-y-4">
      {articles.map(article => {
        const isOpen = openId === article.id
        return (
          <div
            key={article.id}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
              isOpen ? 'border-[#0F7A60]/30 shadow-md' : 'border-gray-100 hover:shadow-md'
            }`}
          >
            {/* ── En-tête cliquable ── */}
            <button
              type="button"
              onClick={() => toggle(article.id)}
              className="w-full flex items-center gap-4 p-5 text-left"
            >
              <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-2xl ${article.color}`}>
                {article.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-[#1A1A1A] leading-snug">{article.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{article.intro}</p>
              </div>
              <span className={`text-gray-400 flex-shrink-0 transition-transform duration-300 text-lg ${isOpen ? 'rotate-180' : ''}`}>
                ↓
              </span>
            </button>

            {/* ── Contenu accordéon ── */}
            {isOpen && (
              <div className="px-5 pb-5 space-y-5 border-t border-gray-50">
                <p className="text-sm text-gray-600 leading-relaxed pt-4">{article.intro}</p>

                <div className="space-y-3">
                  {article.tips.map(tip => (
                    <div
                      key={tip.number}
                      className="flex items-start gap-3 bg-[#FAFAF7] rounded-xl p-4 border border-gray-100"
                    >
                      <span className="w-7 h-7 flex-shrink-0 rounded-full bg-[#0F7A60] text-white text-[11px] font-black flex items-center justify-center">
                        {tip.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#1A1A1A]">{tip.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => toggle(article.id)}
                  className="text-xs font-black text-[#0F7A60] hover:text-[#0D6B53] transition-colors"
                >
                  ↑ Réduire
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
