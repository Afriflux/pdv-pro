// ─── Page Générateur IA — Server Component ────────────────────────────────────

import AIGeneratorClient from './AIGeneratorClient'

export const metadata = {
  title: 'Générateur IA — PDV Pro',
  description: 'Générez une fiche produit complète et persuasive avec l\'IA en quelques secondes.',
}

export default function AIGeneratorPage() {
  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            ✨ Générateur IA de Fiche Produit
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Décrivez votre produit en quelques mots — obtenez une fiche complète et persuasive en secondes.
          </p>
        </div>

        {/* Badge "Propulsé par Claude AI" */}
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-black px-3 py-2 rounded-xl bg-[#0F7A60]/10 text-[#0F7A60] border border-[#0F7A60]/20 self-start">
          ✨ Propulsé par Claude AI · Anthropic
        </span>
      </div>

      {/* ── Contenu interactif (Client Component) ────────────────────────── */}
      <AIGeneratorClient />
    </div>
  )
}
