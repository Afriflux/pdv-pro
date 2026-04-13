'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, Edit2, Plus } from 'lucide-react'
import { toast } from '@/lib/toast'
import { CATEGORIES_OPTIONS, MARKETS_OPTIONS } from '@/lib/constants/ai-options'

export type AIGeneratorMode = 'single-product' | 'bulk-products' | 'bulk-pages'

interface UniversalAIGeneratorProps {
  mode: AIGeneratorMode
  category?: string
  onGenerated?: (data: any) => void
  onImportSuccess?: () => void
}

export function UniversalAIGenerator({ mode, category: defaultCategory, onGenerated, onImportSuccess }: UniversalAIGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [category, setCategory] = useState(defaultCategory || 'mode')
  const [market, setMarket] = useState('senegal')
  const [count, setCount] = useState<number | string>(10)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [singleGenerated, setSingleGenerated] = useState<any | null>(null)
  const [bulkGenerated, setBulkGenerated] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)

  const isSingle = mode === 'single-product'
  const isBulkProd = mode === 'bulk-products'
  const isBulkPages = mode === 'bulk-pages'

  const getLabel = () => {
    if (isSingle) return { badge: 'Yayyam IA', title: 'Générer avec l\'IA', subtitle: 'Laissez notre IA écrire la fiche parfaite pour vendre plus.', placeholder: 'Ex: robe wax taille unique rouge et or, tissu respirant, livraison gratuite sur dakar...', btn: 'Générer la fiche produit' }
    if (isBulkProd) return { badge: 'CATALOGUE IA', title: 'Générateur de Catalogue IA', subtitle: 'Remplissez votre boutique en quelques secondes avec l\'IA.', placeholder: 'Ex: Génère une collection compléte de produits de beauté naturels pour femme avec des beurres de karité et huiles essentielles...', btn: 'Générer la collection' }
    if (isBulkPages) return { badge: 'GÉNÉRATEUR IA', title: 'Générateur de Pages IA', subtitle: 'Créez plusieurs landing pages en quelques secondes avec l\'IA.', placeholder: 'Ex: Génère 5 pages de vente pour ma nouvelle collection de livres numériques sur le dev perso...', btn: 'Générer mes pages' }
    return { badge: 'IA', title: 'Générateur IA', subtitle: '', placeholder: '', btn: 'Générer' }
  }

  const labels = getLabel()

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    setSingleGenerated(null)
    setBulkGenerated([])
    setSelectedIds(new Set())

    try {
      let endpoint = ''
      let payload: any = { prompt: isSingle ? undefined : prompt, market }
      
      if (isSingle) {
        endpoint = '/api/ai/generate-product'
        payload = { description: prompt, category, market }
      } else if (isBulkProd) {
        endpoint = '/api/ai/generate-bulk-products'
        payload = { prompt, count: parseInt(count as string) || 10, category, market }
      } else if (isBulkPages) {
        endpoint = '/api/ai/generate-bulk-pages'
        payload = { prompt, count: parseInt(count as string) || 10, market }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération. Veuillez réessayer.')

      if (isSingle) {
        if (data.success && data.product) setSingleGenerated(data.product)
        else throw new Error(data.error || 'Erreur inattendue')
      } else if (isBulkProd) {
        if (data.products && Array.isArray(data.products)) {
          setBulkGenerated(data.products)
          setSelectedIds(new Set(data.products.map((_: any, i: number) => i)))
        } else throw new Error('Erreur inattendue')
      } else if (isBulkPages) {
        if (data.pages && Array.isArray(data.pages)) {
          setBulkGenerated(data.pages)
          setSelectedIds(new Set(data.pages.map((_: any, i: number) => i)))
        } else throw new Error('Erreur inattendue')
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      if (!isSingle) toast.error(err.message || 'Une erreur est survenue.')
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
    if (selectedIds.size === bulkGenerated.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(bulkGenerated.map((_, i) => i)))
  }

  const handleImport = async () => {
    const toImport = bulkGenerated.filter((_, i) => selectedIds.has(i))
    if (toImport.length === 0) return

    setImporting(true)
    try {
      let endpoint = ''
      const formData = new FormData()

      if (isBulkProd) {
        endpoint = '/api/products/import-csv'
        const csvLines = [
          'name,description,price,type,category,stock',
          ...toImport.map(p => `"${p.name?.replace(/"/g, '""') || ''}","${p.description?.replace(/"/g, '""') || ''}",${p.price || 0},${p.type || 'physical'},"${p.category || category}",${p.stock || ''}`)
        ]
        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' })
        formData.append('file', blob, 'ia_import.csv')
      } else if (isBulkPages) {
        endpoint = '/api/pages/import-csv'
        const csvLines = [
          'Titre de la page,URL (slug),Template,Actif (oui/non)',
          ...toImport.map(p => `"${p.title?.replace(/"/g, '""') || ''}","${p.slug || ''}",${p.template || 1},oui`)
        ]
        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' })
        formData.append('file', blob, 'ia_pages_import.csv')
      }

      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()

      if (data.imported > 0) {
        toast.success(`${data.imported} élément(s) importé(s) par l'IA !`)
        setBulkGenerated([])
        if (onImportSuccess) onImportSuccess()
      }
      if (data.errors && data.errors.length > 0) {
        toast.error(`${data.errors.length} élément(s) ignoré(s).`)
      }
    } catch (err: any) {
      toast.error("Erreur lors de l'import : " + err)
    } finally {
      setImporting(false)
    }
  }

  // Si on est dans le cas single generated
  if (isSingle && singleGenerated) {
    return (
      <div className="bg-white border-2 border-[#0F7A60]/20 rounded-2xl overflow-hidden shadow-sm mb-8 relative p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute top-0 right-0 bg-[#0F7A60] pt-1 pb-1.5 px-3 rounded-bl-xl text-white text-xs font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
          <Sparkles size={12} className="text-[#C9A84C]" /> {labels?.badge}
        </div>
        <div className="bg-[#FAFAF7] border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-black text-[#0F7A60] mb-2">
            <Check size={16} /> Fiche générée avec succès
          </div>
          <div><p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Titre généré</p><p className="font-bold text-[#1A1A1A]">{singleGenerated.title}</p></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Description optimisée</p>
            <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar pr-2">{singleGenerated.description}</div>
          </div>
          <div className="grid grid-cols-1 gap-4 pt-2">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Angles Marketing clés</p>
              <ul className="text-sm text-gray-600 list-disc pl-4">{singleGenerated.marketingAngles?.map((angle: string, i: number) => <li key={i}>{angle}</li>)}</ul>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">SEO (Meta Title & Meta Description)</p>
              <div className="bg-white p-3 rounded-lg border border-gray-100 mt-1">
                <p className="text-blue-600 text-sm font-semibold truncate hover:underline cursor-pointer">{singleGenerated.seoTitle}</p>
                <p className="text-green-700 text-xs truncate">yayyam.com/p/votre-produit</p>
                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{singleGenerated.metaDescription}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSingleGenerated(null)} className="px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors flex items-center gap-2">
            <Edit2 size={16} /> Modifier
          </button>
          <button type="button" onClick={() => onGenerated && onGenerated(singleGenerated)} className="flex-1 bg-[#0F7A60] hover:bg-[#0D6B53] text-white font-black py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
            <Check size={18} /> Utiliser cette fiche
          </button>
        </div>
      </div>
    )
  }

  // Si on est dans le cas bulk generated
  if (!isSingle && bulkGenerated.length > 0) {
    return (
      <div className="bg-white border-2 border-[#0F7A60]/20 rounded-2xl overflow-hidden shadow-sm relative p-6 mb-6 space-y-4 animate-in fade-in duration-500">
        <div className="absolute top-0 right-0 bg-[#0F7A60] pt-1 pb-1.5 px-3 rounded-bl-xl text-white text-xs font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
          <Sparkles size={12} className="text-[#C9A84C]" /> {labels?.badge}
        </div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm text-[#1A1A1A]">{bulkGenerated.length} éléments générés par l&apos;IA</h4>
          <button onClick={() => setBulkGenerated([])} className="text-xs text-gray-400 hover:text-red-500 font-bold">Annuler</button>
        </div>
        <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF7] sticky top-0 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2 text-center w-10"><input type="checkbox" aria-label="Tout sélectionner" title="Tout sélectionner" checked={selectedIds.size === bulkGenerated.length} onChange={toggleAll} /></th>
                <th className="px-3 py-2 uppercase font-black tracking-wider text-gray-400">Titre</th>
                {isBulkProd ? (
                  <>
                    <th className="px-3 py-2 uppercase font-black tracking-wider text-gray-400">Desc.</th>
                    <th className="px-3 py-2 uppercase font-black tracking-wider text-gray-400">Prix</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 uppercase font-black tracking-wider text-gray-400">URL</th>
                    <th className="px-3 py-2 uppercase font-black tracking-wider text-gray-400">Template</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {bulkGenerated.map((p, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${selectedIds.has(i) ? 'bg-green-50/30' : ''}`}>
                  <td className="px-3 py-3 text-center"><input type="checkbox" aria-label={`Sélectionner ${p.title || p.name}`} title={`Sélectionner ${p.title || p.name}`} checked={selectedIds.has(i)} onChange={() => toggleSelect(i)} /></td>
                  <td className="px-3 py-3 font-bold text-[#1A1A1A] truncate max-w-[200px]">{p.title || p.name}</td>
                  {isBulkProd ? (
                    <>
                      <td className="px-3 py-3 text-gray-500 truncate max-w-[200px]">{p.description}</td>
                      <td className="px-3 py-3 font-bold text-[#C9A84C] whitespace-nowrap">{p.price?.toLocaleString()} F</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-3 text-gray-500 truncate max-w-[150px]">{p.slug}</td>
                      <td className="px-3 py-3 font-bold text-[#C9A84C] whitespace-nowrap">{p.template}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={handleImport} disabled={importing || selectedIds.size === 0} className="w-full bg-[#1A1A1A] hover:bg-black disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
          {importing ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Importer la sélection ({selectedIds.size})
        </button>
      </div>
    )
  }

  // Formulaire d'entrée
  return (
    <div className={`bg-white border-2 border-[#0F7A60]/20 rounded-2xl overflow-hidden shadow-sm relative ${isSingle ? 'mb-8' : 'mb-6'}`}>
      <div className="absolute top-0 right-0 bg-[#0F7A60] pt-1 pb-1.5 px-3 rounded-bl-xl text-white text-xs font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
        <Sparkles size={12} className="text-[#C9A84C]" /> {labels?.badge}
      </div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center text-[#0F7A60]"><Sparkles size={20} /></div>
          <div><h3 className="font-black text-[#1A1A1A] text-lg">{labels?.title}</h3><p className="text-xs text-gray-500 mt-0.5">{labels?.subtitle}</p></div>
        </div>

        <div className="space-y-5">
          <div>
            {!isSingle && <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Prompt global</label>}
            {isSingle && <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Décrivez votre produit en quelques mots</label>}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={labels?.placeholder}
              className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:border-[#0F7A60] focus:ring-1 focus:ring-[#0F7A60] transition-colors resize-none placeholder-gray-400"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isSingle || isBulkProd) && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                <select aria-label="Catégorie" title="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F7A60] transition-colors appearance-none" disabled={loading}>
                  {CATEGORIES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            )}
            
            {!isSingle && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Quantité (1 à 20)</label>
                <input type="number" aria-label="Quantité" title="Quantité" min="1" max="20" value={count} onChange={(e) => setCount(e.target.value)} onBlur={() => { const val = Number(count); if (isNaN(val) || val < 1) setCount(1); else if (val > 20) setCount(20); }} className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F7A60]" disabled={loading} />
              </div>
            )}

            <div className={!isSingle && !isBulkProd ? "md:col-span-2" : ""}>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Marché cible</label>
              <div className="flex bg-[#FAFAF7] border border-gray-200 rounded-xl overflow-x-auto hide-scrollbar p-1">
                {MARKETS_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setMarket(opt.value)} disabled={loading} className={`flex-1 min-w-[max-content] px-3 py-2 text-xs font-bold rounded-lg transition-colors ${market === opt.value ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-[#1A1A1A]'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-sm font-bold text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-100">⚠️ {error}</p>}

          <button type="button" onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full bg-[#0F7A60] hover:bg-[#0D6B53] disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:shadow-none">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Génération en cours...</> : <><Sparkles size={18} className={prompt.trim() ? "text-[#C9A84C]" : ""} /> {labels?.btn}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
