'use client'

// ─── Prévisualisation de la fiche produit générée par l'IA ───────────────────

import { toast } from 'sonner'
import { Copy, RefreshCw, Sparkles } from 'lucide-react'
import type { GeneratedProduct } from '@/app/api/ai/generate-product/route'

interface GeneratedProductPreviewProps {
  product: GeneratedProduct
  onRegenerate: () => void
}

// ─── Helper : copier dans le presse-papier avec toast ─────────────────────────
async function copyToClipboard(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copié !`)
  } catch {
    toast.error('Impossible de copier. Essayez manuellement.')
  }
}

export default function GeneratedProductPreview({
  product,
  onRegenerate,
}: GeneratedProductPreviewProps) {

  // ── Construire le texte complet pour "Tout copier" ────────────────────────
  const buildFullText = (): string => {
    const benefitsList = product.benefits.map((b) => `- ${b}`).join('\n')
    const faqList = product.faq
      .map((f) => `Q: ${f.question}\nR: ${f.answer}`)
      .join('\n\n')
    const anglesList = product.marketingAngles.map((a) => `- ${a}`).join('\n')

    return `TITRE: ${product.title}

DESCRIPTION:
${product.description}

BÉNÉFICES:
${benefitsList}

FAQ:
${faqList}

ANGLES MARKETING:
${anglesList}

CTA: ${product.callToAction}
SEO TITLE: ${product.seoTitle}
META: ${product.metaDescription}`
  }

  // ── Classes partagées ─────────────────────────────────────────────────────
  const sectionClass = 'px-6 py-5 border-t border-gray-100'
  const labelClass   = 'text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block'
  const copyBtnClass =
    'inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#0F7A60] transition-colors px-2 py-1 rounded-lg hover:bg-[#0F7A60]/5'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#0F7A60]" />
          <h2 className="font-black text-[#0F7A60] text-lg">Fiche générée !</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Tout copier */}
          <button
            type="button"
            onClick={() => copyToClipboard(buildFullText(), 'Fiche complète')}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-[#0F7A60] hover:text-[#0F7A60] transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            Tout copier
          </button>
          {/* Regénérer */}
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regénérer
          </button>
        </div>
      </div>

      {/* ── Titre optimisé ───────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <span className={labelClass}>Titre optimisé</span>
            <p className="text-xl font-black text-gray-900 leading-tight">
              {product.title}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(product.title, 'Titre')}
            className={copyBtnClass}
            title="Copier le titre"
          >
            <Copy className="w-3.5 h-3.5" />
            Copier
          </button>
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <span className={labelClass}>Description</span>
            <p className="text-sm text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(product.description, 'Description')}
            className={`${copyBtnClass} flex-shrink-0`}
            title="Copier la description"
          >
            <Copy className="w-3.5 h-3.5" />
            Copier
          </button>
        </div>
      </div>

      {/* ── Bénéfices ───────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={labelClass}>Bénéfices clés</span>
          <button
            type="button"
            onClick={() =>
              copyToClipboard(
                product.benefits.map((b) => `• ${b}`).join('\n'),
                'Bénéfices'
              )
            }
            className={copyBtnClass}
            title="Copier les bénéfices"
          >
            <Copy className="w-3.5 h-3.5" />
            Copier tout
          </button>
        </div>
        <ul className="space-y-2">
          {product.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-[#0F7A60] font-black mt-0.5 flex-shrink-0">●</span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={labelClass}>FAQ</span>
          <button
            type="button"
            onClick={() =>
              copyToClipboard(
                product.faq
                  .map((f) => `Q: ${f.question}\nR: ${f.answer}`)
                  .join('\n\n'),
                'FAQ'
              )
            }
            className={copyBtnClass}
            title="Copier la FAQ"
          >
            <Copy className="w-3.5 h-3.5" />
            Copier
          </button>
        </div>
        <div className="space-y-4">
          {product.faq.map((item, i) => (
            <div key={i}>
              <p className="text-sm font-bold text-gray-900">{item.question}</p>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Call to Action ───────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className={labelClass}>Call to action</span>
          <button
            type="button"
            onClick={() => copyToClipboard(product.callToAction, 'CTA')}
            className={copyBtnClass}
            title="Copier le CTA"
          >
            <Copy className="w-3.5 h-3.5" />
            Copier
          </button>
        </div>
        <div className="inline-flex items-center px-5 py-3 bg-[#0F7A60] text-white rounded-xl font-black text-sm shadow-lg shadow-[#0F7A60]/20">
          {product.callToAction}
        </div>
      </div>

      {/* ── Angles Marketing ────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <span className={labelClass}>Angles marketing</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {product.marketingAngles.map((angle, i) => {
            const colors = [
              'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20',
              'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20',
              'bg-gray-100 text-gray-600 border-gray-200',
            ]
            return (
              <span
                key={i}
                className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${colors[i % 3]}`}
              >
                {angle}
              </span>
            )
          })}
        </div>
      </div>

      {/* ── SEO ─────────────────────────────────────────────────────────── */}
      <div className={`${sectionClass} bg-gray-50`}>
        <span className={labelClass}>SEO</span>
        <div className="space-y-3">
          {/* Titre SEO */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 font-bold mb-1">
                Titre SEO{' '}
                <span
                  className={
                    product.seoTitle.length > 60 ? 'text-red-400' : 'text-green-500'
                  }
                >
                  ({product.seoTitle.length}/60)
                </span>
              </p>
              <p className="text-sm font-semibold text-gray-800">{product.seoTitle}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(product.seoTitle, 'Titre SEO')}
              className={copyBtnClass}
              title="Copier le titre SEO"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Meta description */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 font-bold mb-1">
                Meta description{' '}
                <span
                  className={
                    product.metaDescription.length > 160 ? 'text-red-400' : 'text-green-500'
                  }
                >
                  ({product.metaDescription.length}/160)
                </span>
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.metaDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(product.metaDescription, 'Meta description')}
              className={copyBtnClass}
              title="Copier la meta description"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
