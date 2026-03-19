// ProductsHeaderImport — Header client avec bascule Import CSV
// Remplace le header statique pour permettre l'affichage conditionnel de ImportCSV

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, X } from 'lucide-react'
import ImportCSV from './ImportCSV'

export default function ProductsHeaderImport() {
  const [showImport, setShowImport] = useState(false)

  return (
    <>
      {/* ── Header ── */}
      <header className="bg-white border-b border-line shadow-sm px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <Link href="/dashboard" className="text-slate hover:text-ink transition flex-shrink-0 text-lg">
                ←
              </Link>
              <h1 className="font-display text-ink text-xl font-bold">Mes Produits</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Bouton Import CSV */}
            <button
              onClick={() => setShowImport(v => !v)}
              title="Importer des produits via CSV"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                transition border flex-1 sm:flex-none justify-center ${
                showImport
                  ? 'bg-[#FAFAF7] border-gray-200 text-gray-500 hover:bg-gray-100'
                  : 'bg-white border-gray-200 text-[#0F7A60] hover:border-[#0F7A60] hover:bg-[#0F7A60]/5'
              }`}
            >
              {showImport ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {showImport ? 'Fermer' : 'Import CSV'}
            </button>
            <Link
              href="/dashboard/products/new"
              className="bg-gold text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gold-light
                transition shadow-md shadow-gold/20 flex items-center justify-center gap-2 flex-1 sm:flex-none"
            >
              <span>+</span> Nouveau produit
            </Link>
          </div>
        </div>
      </header>

      {/* ── Section Import CSV (conditionnelle) ── */}
      {showImport && (
        <div className="px-6 py-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <ImportCSV />
        </div>
      )}
    </>
  )
}
