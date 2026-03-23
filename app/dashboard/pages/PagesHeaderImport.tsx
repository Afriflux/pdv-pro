'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, X, Sparkles } from 'lucide-react'
import ImportCSVPages from './ImportCSVPages'
import AIBulkPagesGenerator from '@/components/dashboard/AIBulkPagesGenerator'

type ActiveView = 'none' | 'csv' | 'ia'

export default function PagesHeaderImport() {
  const [activeView, setActiveView] = useState<ActiveView>('none')

  const refreshPage = () => {
    // router.refresh() does soft refresh. We want hard refresh to reset the list securely.
    window.location.reload()
  }

  return (
    <>
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 shadow-sm px-6 py-5 sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <Link href="/dashboard" className="text-slate hover:text-ink transition flex-shrink-0 text-lg">
                ←
              </Link>
              <h1 className="font-display text-ink text-xl font-bold">Pages de vente</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Bouton Générateur IA */}
            <button
              onClick={() => setActiveView(v => v === 'ia' ? 'none' : 'ia')}
              title="Générer des pages via IA"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm
                transition border flex-1 sm:flex-none justify-center ${
                activeView === 'ia'
                  ? 'bg-[#FAFAF7] border-gray-200 text-gray-500 hover:bg-gray-100'
                  : 'bg-[#F2FAF5] border-[#0F7A60]/20 text-[#0F7A60] hover:bg-[#0F7A60]/10'
              }`}
            >
              {activeView === 'ia' ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-[#0F7A60]" />}
              {activeView === 'ia' ? 'Fermer' : 'Générateur IA'}
            </button>
            {/* Bouton Import CSV */}
            <button
              onClick={() => setActiveView(v => v === 'csv' ? 'none' : 'csv')}
              title="Importer des pages via CSV"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                transition border flex-1 sm:flex-none justify-center ${
                activeView === 'csv'
                  ? 'bg-[#FAFAF7] border-gray-200 text-gray-500 hover:bg-gray-100'
                  : 'bg-white border-gray-200 text-slate hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {activeView === 'csv' ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {activeView === 'csv' ? 'Fermer' : 'Import CSV'}
            </button>

            {/* Bouton Principal */}
            <Link
              href="/dashboard/pages/new"
              className="bg-gradient-to-br from-[#0F7A60] to-[#0D5C4A] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:to-[#0A4A3A] transition-all duration-300 shadow-lg shadow-[#0F7A60]/20 hover:shadow-xl hover:shadow-[#0F7A60]/40 flex items-center justify-center gap-2 flex-1 sm:flex-none relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              <span className="font-bold">+</span> Nouvelle page
            </Link>
          </div>
        </div>
      </header>

      {/* ── Section Import CSV (conditionnelle) ── */}
      {activeView === 'csv' && (
        <div className="px-6 py-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <ImportCSVPages onImportSuccess={refreshPage} />
        </div>
      )}

      {/* ── Section Générateur IA (conditionnelle) ── */}
      {activeView === 'ia' && (
        <div className="px-6 py-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <AIBulkPagesGenerator onImportSuccess={refreshPage} />
        </div>
      )}
    </>
  )
}
