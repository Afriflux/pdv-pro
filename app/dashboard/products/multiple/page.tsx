import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import MultiProductGrid from '@/components/products/MultiProductGrid'

// ----------------------------------------------------------------
// Metadata
// ----------------------------------------------------------------
export const metadata: Metadata = {
  title: 'Ajout Multiple — PDV Pro',
  description: 'Gérez et créez plusieurs produits simultanément sur votre boutique.',
}

// ----------------------------------------------------------------
// Page (Server Component)
// ----------------------------------------------------------------
export default function BatchProductPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      {/* ── BREADCRUMB ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Link 
              href="/dashboard" 
              className="text-gray-400 hover:text-[#0F7A60] transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <Link 
              href="/dashboard/products" 
              className="text-gray-400 hover:text-[#0F7A60] transition-colors"
            >
              Produits
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-[#0F7A60]">Ajout multiple</span>
          </nav>
        </div>
      </div>

      {/* ── TITLE SECTION ── */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Ajouter plusieurs produits à la fois
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Remplissez les fiches et enregistrez tout en un clic.
          </p>
        </div>
      </div>

      {/* ── GRID COMPONENT ── */}
      <section className="pb-24">
        <MultiProductGrid />
      </section>
    </main>
  )
}
