'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  PackagePlus,
  ArrowLeft
} from 'lucide-react'
import { toast } from '@/lib/toast'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface ProductDraft {
  id: string
  name: string
  price: string
  stock: string
  description: string
  category: string
  errors: {
    name?: string
    price?: string
  }
}

// ----------------------------------------------------------------
// Composant Principal
// ----------------------------------------------------------------
export default function MultiProductGrid() {
  const router = useRouter()
  
  // État initial : une seule carte vide
  const [drafts, setDrafts] = useState<ProductDraft[]>([createEmptyDraft()])
  const [loading, setLoading] = useState(false)

  // 1. Création d'un brouillon vide avec ID unique
  function createEmptyDraft(): ProductDraft {
    return {
      id: crypto.randomUUID(),
      name: '',
      price: '',
      stock: '0',
      description: '',
      category: '',
      errors: {}
    }
  }

  // 2. Actions sur les cartes
  const handleAddCard = () => {
    setDrafts(prev => [...prev, createEmptyDraft()])
  }

  const handleRemoveCard = (id: string) => {
    if (drafts.length <= 1) return
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  const handleUpdateCard = (id: string, field: keyof ProductDraft, value: string) => {
    setDrafts(prev => prev.map(d => {
      if (d.id !== id) return d
      
      const updated = { ...d, [field]: value }
      
      // Validation en temps réel pour le visuel
      if (field === 'name' || field === 'price') {
        updated.errors = validateField(field, value, d.errors)
      }
      
      return updated
    }))
  }

  function validateField(field: 'name' | 'price', value: string, currentErrors: ProductDraft['errors']) {
    const errors = { ...currentErrors }
    
    if (field === 'name') {
      if (value.trim().length < 2) {
        errors.name = "Min. 2 caractères"
      } else {
        delete errors.name
      }
    }
    
    if (field === 'price') {
      const p = parseFloat(value)
      if (!value || isNaN(p) || p <= 0) {
        errors.price = "Prix invalide"
      } else {
        delete errors.price
      }
    }
    
    return errors
  }

  // 3. Soumission
  const handleSubmitAll = async () => {
    // Validation finale avant envoi
    let hasErrors = false
    const validatedDrafts = drafts.map(d => {
      const nameError = d.name.trim().length < 2 ? "Obligatoire" : undefined
      const priceVal = parseFloat(d.price)
      const priceError = (!d.price || isNaN(priceVal) || priceVal <= 0) ? "Invalide" : undefined
      
      if (nameError || priceError) hasErrors = true
      
      return {
        ...d,
        errors: { name: nameError, price: priceError }
      }
    })

    if (hasErrors) {
      setDrafts(validatedDrafts)
      toast.error("Veuillez corriger les erreurs avant d'enregistrer.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/products/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: drafts.map(d => ({
            name: d.name,
            price: parseFloat(d.price),
            stock: parseInt(d.stock) || 0,
            description: d.description,
            category: d.category
          }))
        })
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(`${result.created} produits créés avec succès !`)
        setDrafts([createEmptyDraft()])
        router.refresh()
      } else {
        toast.error(result.error || "Une erreur est survenue lors de l'enregistrement.")
      }
    } catch (err) {
      console.error("[MultiProductGrid] Submit error:", err)
      toast.error("Erreur de connexion au serveur.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── HEADER ACTIONS ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-[#0F7A60]" />
          </button>
          <div>
            <h2 className="text-xl font-display font-black text-[#0D5C4A] flex items-center gap-2">
              <PackagePlus className="w-6 h-6 text-gold" />
              Création Multiple
            </h2>
            <p className="text-sm text-gray-500 font-medium">Configurez plusieurs produits et enregistrez-les en un clic.</p>
          </div>
        </div>
        
        <button
          onClick={handleAddCard}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-dashed border-emerald-600/30 text-[#0F7A60] font-bold hover:bg-emerald-50 hover:border-[#0F7A60] transition-all w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Ajouter une carte
        </button>
      </div>

      {/* ── GRILLE DE CARTES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {drafts.map((draft, index) => (
          <div 
            key={draft.id}
            className={`bg-white rounded-[2rem] border-2 p-6 shadow-sm transition-all duration-300 relative group
              ${draft.errors.name || draft.errors.price 
                ? 'border-red-100 shadow-red-50' 
                : draft.name && draft.price ? 'border-emerald-50 shadow-emerald-50' : 'border-gray-50'}
            `}
          >
            {/* Header Carte */}
            <div className="flex items-center justify-between mb-6">
              <span className="bg-gray-50 text-gray-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                Produit #{index + 1}
              </span>
              
              {drafts.length > 1 && (
                <button
                  onClick={() => handleRemoveCard(draft.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Supprimer ce produit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Formulaire */}
            <div className="space-y-4">
              {/* Nom */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nom du produit</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => handleUpdateCard(draft.id, 'name', e.target.value)}
                  placeholder="Ex: Savon artisanal"
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-bold focus:outline-none transition-all
                    ${draft.errors.name ? 'border-red-200 bg-red-50/30' : 'border-gray-100 focus:border-emerald-400/30 bg-gray-50/30'}
                  `}
                />
                {draft.errors.name && (
                  <p className="flex items-center gap-1 text-xs font-bold text-red-500 px-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {draft.errors.name}
                  </p>
                )}
              </div>

              {/* Prix & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Prix (FCFA)</label>
                  <input
                    type="number"
                    value={draft.price}
                    onChange={(e) => handleUpdateCard(draft.id, 'price', e.target.value)}
                    placeholder="2500"
                    min="0"
                    className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-bold focus:outline-none transition-all
                      ${draft.errors.price ? 'border-red-200 bg-red-50/30' : 'border-gray-100 focus:border-emerald-400/30 bg-gray-50/30'}
                    `}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Stock</label>
                  <input
                    type="number"
                    value={draft.stock}
                    onChange={(e) => handleUpdateCard(draft.id, 'stock', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-100 bg-gray-50/30 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-400/30 transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Description courte</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => handleUpdateCard(draft.id, 'description', e.target.value)}
                  placeholder="Écrivez quelques mots..."
                  className="w-full px-4 py-3 border-2 border-gray-100 bg-gray-50/30 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-400/30 transition-all resize-none h-20"
                />
              </div>

              {/* Catégorie */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Catégorie</label>
                <input
                  type="text"
                  value={draft.category}
                  onChange={(e) => handleUpdateCard(draft.id, 'category', e.target.value)}
                  placeholder="Ex: Cosmétique"
                  className="w-full px-4 py-3 border-2 border-gray-100 bg-gray-50/30 rounded-2xl text-sm font-bold focus:outline-none focus:border-emerald-400/30 transition-all"
                />
              </div>
            </div>

            {/* Indicateur de validité visuel discret */}
            {!draft.errors.name && !draft.errors.price && draft.name && draft.price && (
              <div className="absolute top-6 right-6 text-emerald-600 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── BARRE DE VALIDATION FIXE ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-4 z-40 lg:left-64">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Total : {drafts.length} produit{drafts.length > 1 ? 's' : ''} à créer
            </span>
          </div>
          
          <button
            onClick={handleSubmitAll}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-[#0D5C4A] text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Tout enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
