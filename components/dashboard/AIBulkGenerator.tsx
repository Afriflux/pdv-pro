'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

export interface GeneratedBulkProduct {
  name: string
  description: string
  price: number
  type: 'physical' | 'digital' | 'coaching'
  category: string
  stock: number | null
}

const CATEGORIE_OPTIONS = [
  { value: 'mode', label: 'Mode & Vêtements' },
  { value: 'beaute', label: 'Beauté & Cosmétique' },
  { value: 'digital', label: 'Produits Digitaux' },
  { value: 'alimentaire', label: 'Alimentaire' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'service', label: 'Services' },
  { value: 'autre', label: 'Autre' }
]

const MARKET_OPTIONS = [
  { value: 'senegal', label: '🇸🇳 Sénégal' },
  { value: 'cotedivoire', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'mali', label: '🇲🇱 Mali' },
  { value: 'general', label: '🌍 Général (Afrique)' }
]

export default function AIBulkGenerator({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [category, setCategory] = useState('mode')
  const [market, setMarket] = useState('senegal')
  const [count, setCount] = useState<number | string>(10)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<GeneratedBulkProduct[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setProducts([])
    setSelectedIds(new Set())

    try {
      const res = await fetch('/api/ai/generate-bulk-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count, category, market })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération')

      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products)
        setSelectedIds(new Set(data.products.map((_: any, i: number) => i)))
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (index: number) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(index)) newSet.delete(index)
    else newSet.add(index)
    setSelectedIds(newSet)
  }

  const toggleAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((_, i) => i)))
    }
  }

  const handleImport = async () => {
    const toImport = products.filter((_, i) => selectedIds.has(i))
    if (toImport.length === 0) return

    setImporting(true)
    try {
      // Nous utilisons l'API d'import CSV, mais nous passons un CSV généré en mémoire
      const csvLines = [
        'name,description,price,type,category,stock', // header exact attendu
        ...toImport.map(p => 
          `"${p.name.replace(/"/g, '""')}","${p.description.replace(/"/g, '""')}",${p.price},${p.type},"${p.category}",${p.stock || ''}`
        )
      ]
      const csvStr = csvLines.join('\n')
      const blob = new Blob([csvStr], { type: 'text/csv' })
      const formData = new FormData()
      formData.append('file', blob, 'ia_import.csv')

      const res = await fetch('/api/products/import-csv', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.imported > 0) {
        toast.success(`${data.imported} produit(s) importé(s) par l'IA !`)
        setProducts([])
        if (onImportSuccess) onImportSuccess()
      }
      
      if (data.errors && data.errors.length > 0) {
        toast.error(`${data.errors.length} produit(s) ignoré(s).`)
      }
    } catch (err) {
      toast.error("Erreur lors de l'import : " + err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="bg-white border border-[#0F7A60]/20 rounded-2xl overflow-hidden shadow-sm relative">
      <div className="absolute top-0 right-0 bg-[#0F7A60] pt-1 pb-1.5 px-3 rounded-bl-xl text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
        <Sparkles size={12} className="text-[#C9A84C]" /> CATALOGUE IA
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center text-[#0F7A60]">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-[#1A1A1A] text-lg">Générateur de Catalogue IA</h3>
            <p className="text-xs text-gray-500 mt-0.5">Remplissez votre boutique en quelques secondes avec l&apos;IA.</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Génère une collection compléte de produits de beauté naturels pour femme avec des beurres de karité et huiles essentielles..."
              className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:border-[#0F7A60] resize-none"
              disabled={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F7A60] appearance-none"
                  disabled={loading}
                >
                  {CATEGORIE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Quantité (1 à 20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  onBlur={() => {
                    const val = Number(count)
                    if (isNaN(val) || val < 1) setCount(1)
                    else if (val > 20) setCount(20)
                  }}
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F7A60]"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Marché cIble</label>
              <div className="flex bg-[#FAFAF7] border border-gray-200 rounded-xl overflow-x-auto hide-scrollbar p-1">
                {MARKET_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMarket(opt.value)}
                    disabled={loading}
                    className={`flex-1 min-w-[max-content] px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      market === opt.value 
                        ? 'bg-white text-[#1A1A1A] shadow-sm' 
                        : 'text-gray-500 hover:text-[#1A1A1A]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full mt-2 bg-[#0F7A60] hover:bg-[#0D6B53] disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Génération du catalogue massive en cours...</>
              ) : (
                <><Sparkles size={18} className="text-[#C9A84C]" /> Générer la collection</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-[#1A1A1A]">
                {products.length} produits générés par l&apos;IA
              </h4>
              <button onClick={() => setProducts([])} className="text-xs text-gray-400 hover:text-red-500 font-bold">
                Annuler
              </button>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF7] sticky top-0 border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-center w-10">
                      <input type="checkbox" checked={selectedIds.size === products.length} onChange={toggleAll} />
                    </th>
                    <th className="px-3 py-2 uppercase font-black tracking-wider text-gray-400 w-1/4">Nom</th>
                    <th className="px-3 py-2 uppercase font-black tracking-wider text-gray-400 w-1/3">Description</th>
                    <th className="px-3 py-2 uppercase font-black tracking-wider text-gray-400">Prix</th>
                    <th className="px-3 py-2 uppercase font-black tracking-wider text-gray-400">Caté.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {products.map((p, i) => (
                    <tr key={i} className={`hover:bg-gray-50 ${selectedIds.has(i) ? 'bg-green-50/30' : ''}`}>
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={selectedIds.has(i)} onChange={() => toggleSelect(i)} />
                      </td>
                      <td className="px-3 py-3 font-bold text-[#1A1A1A] truncate max-w-[150px]">{p.name}</td>
                      <td className="px-3 py-3 text-gray-500 truncate max-w-[200px]">{p.description}</td>
                      <td className="px-3 py-3 font-bold text-[#C9A84C] whitespace-nowrap">{p.price.toLocaleString()} F</td>
                      <td className="px-3 py-3 text-gray-400">{p.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleImport}
              disabled={importing || selectedIds.size === 0}
              className="w-full bg-[#1A1A1A] hover:bg-black disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {importing ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Importer la sélection ({selectedIds.size})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
