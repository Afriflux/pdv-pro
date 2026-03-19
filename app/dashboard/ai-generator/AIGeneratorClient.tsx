'use client'

// ─── Wrapper client pour le générateur IA ─────────────────────────────────────
// Gère l'état global : formulaire + résultat généré

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { GeneratedProduct } from '@/app/api/ai/generate-product/route'
import ProductGeneratorForm from '@/components/ai/ProductGeneratorForm'
import GeneratedProductPreview from '@/components/ai/GeneratedProductPreview'

export default function AIGeneratorClient() {
  const [generatedProduct, setGeneratedProduct] = useState<GeneratedProduct | null>(null)
  const [isLoading,        setIsLoading]        = useState(false)

  // Stocker le résultat reçu du formulaire
  const handleGenerated = (product: GeneratedProduct) => {
    setGeneratedProduct(product)
  }

  // Remettre à zéro pour regénérer (le formulaire reste pré-rempli)
  const handleRegenerate = () => {
    setGeneratedProduct(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* ── Colonne gauche : Formulaire (sticky) ─────────────────────────── */}
      <div className="lg:sticky lg:top-4">
        <ProductGeneratorForm
          onGenerated={handleGenerated}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </div>

      {/* ── Colonne droite : Résultat ou placeholder ─────────────────────── */}
      <div>
        {generatedProduct ? (
          <GeneratedProductPreview
            product={generatedProduct}
            onRegenerate={handleRegenerate}
          />
        ) : (
          /* Placeholder vide : affiché avant la première génération */
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center px-8 py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#0F7A60]/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#0F7A60]/40" />
            </div>
            <p className="font-black text-gray-400 text-base">
              Votre fiche apparaîtra ici
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Remplissez le formulaire et cliquez sur &quot;Générer&quot;
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
