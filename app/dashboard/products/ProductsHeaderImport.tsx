// ProductsHeaderImport — Header client avec bascule Import CSV
// Remplace le header statique pour permettre l'affichage conditionnel de ImportCSV

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, X, Sparkles } from 'lucide-react'
import ImportCSV from './ImportCSV'
import { UniversalAIGenerator } from '@/components/shared/ai/UniversalAIGenerator'

type ActiveView = 'none' | 'csv' | 'ia'

export default function ProductsHeaderImport() {
  const [activeView, setActiveView] = useState<ActiveView>('none')

  return (
    <div className="w-full relative z-10 px-6 lg:px-10">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 mb-8 border-b border-gray-200/40 relative z-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-rose-500 shadow-[0_8px_30px_rgb(244,63,94,0.12)] border border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            </div>
            <div>
              <h1 className="text-xl lg:text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Catalogue de Produits</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Gérez votre inventaire, importez en masse ou générez avec l'IA.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            {/* Bouton Générateur IA */}
            <button
              onClick={() => setActiveView(v => v === 'ia' ? 'none' : 'ia')}
              title="Générer un catalogue via IA"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm
                transition border flex-1 sm:flex-none justify-center ${
                activeView === 'ia'
                  ? 'bg-[#FAFAF7] border-gray-200 text-gray-500 hover:bg-gray-100'
                  : 'bg-white border-gray-200 text-[#0F7A60] hover:border-[#0F7A60] hover:bg-[#0F7A60]/5'
              }`}
            >
              {activeView === 'ia' ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-[#C9A84C]" />}
              {activeView === 'ia' ? 'Fermer' : 'Générateur IA'}
            </button>
            {/* Bouton Import CSV */}
            <button
              onClick={() => setActiveView(v => v === 'csv' ? 'none' : 'csv')}
              title="Importer des produits via CSV"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                transition border flex-1 sm:flex-none justify-center ${
                activeView === 'csv'
                  ? 'bg-[#FAFAF7] border-gray-200 text-gray-500 hover:bg-gray-100'
                  : 'bg-white border-gray-200 text-[#0F7A60] hover:border-[#0F7A60] hover:bg-[#0F7A60]/5'
              }`}
            >
              {activeView === 'csv' ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {activeView === 'csv' ? 'Fermer' : 'Import CSV'}
            </button>
            <Link
              href="/dashboard/products/new"
              className="bg-gradient-to-br from-[#0F7A60] to-[#0D5C4A] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:to-[#0A4A3A] transition-all duration-300 shadow-lg shadow-[#0F7A60]/20 hover:shadow-xl hover:shadow-[#0F7A60]/40 flex items-center justify-center gap-2 flex-1 sm:flex-none relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              <span className="font-bold">+</span> Nouveau produit
            </Link>
          </div>
        </header>

        {/* ── Section Import CSV (conditionnelle) ── */}
        {activeView === 'csv' && (
          <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <ImportCSV />
          </div>
        )}

        {/* ── Section Générateur IA (conditionnelle) ── */}
        {activeView === 'ia' && (
          <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <UniversalAIGenerator 
              mode="bulk-products" 
              onImportSuccess={() => {
              window.location.reload()
            }} />
          </div>
        )}
      </div>
    </div>
  )
}
