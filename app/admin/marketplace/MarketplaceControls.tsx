'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Save, Globe, Store, SlidersHorizontal, ToggleLeft, ToggleRight, ShieldAlert, Megaphone, Smartphone, BellRing, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialConfig: Record<string, string>
}

export default function MarketplaceControls({ initialConfig }: Props) {
  // Global
  const [active, setActive] = useState(initialConfig['marketplace_active'] === 'true')
  const [headline, setHeadline] = useState(initialConfig['marketplace_headline'] || '')
  const [limit, setLimit] = useState(initialConfig['marketplace_featured_limit'] || '12')
  
  // Modération & Sécurité
  const [requireApproval, setRequireApproval] = useState(initialConfig['marketplace_require_approval'] === 'true')
  const [showUrgency, setShowUrgency] = useState(initialConfig['marketplace_show_urgency'] === 'true')

  // Marketing & Conversion
  const [promoBanner, setPromoBanner] = useState(initialConfig['marketplace_promo_banner'] || '')
  const [vendorContact, setVendorContact] = useState(initialConfig['marketplace_vendor_contact'] === 'true')

  // SEO & Identité Visuelle
  const [seoTitle, setSeoTitle] = useState(initialConfig['marketplace_seo_title'] || '')
  const [seoDesc, setSeoDesc] = useState(initialConfig['marketplace_seo_desc'] || '')
  const [heroImage, setHeroImage] = useState(initialConfig['marketplace_hero_image'] || '')
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `platform/${Date.now()}_marketplace_hero.${ext}`
      
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) throw error
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setHeroImage(data.publicUrl)
      toast.success('Image héro importée et appliquée ✓')
    } catch (err: unknown) {
      toast.error("Erreur lors de l'upload de l'image")
    } finally {
      setUploading(false)
    }
  }

  const [generatingAI, setGeneratingAI] = useState<Record<string, boolean>>({})

  const handleAIGenerate = async (fieldKey: 'seoTitle' | 'seoDesc') => {
    setGeneratingAI(prev => ({ ...prev, [fieldKey]: true }))
    try {
      const context = headline || 'La Marketplace géante PDV Pro'
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: `Marketplace publique multi-vendeurs avec une grande variété de produits au Sénégal. Titre acutel de la page: ${context}`, type: fieldKey === 'seoTitle' ? 'title' : 'description' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur API IA')
      
      if (fieldKey === 'seoTitle') setSeoTitle(data.result)
      if (fieldKey === 'seoDesc') setSeoDesc(data.result)
      
      toast.success('Texte Marketplace optimisé ! 🪄')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setGeneratingAI(prev => ({ ...prev, [fieldKey]: false }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const config = {
        marketplace_active: active ? 'true' : 'false',
        marketplace_headline: headline,
        marketplace_featured_limit: limit.toString(),
        marketplace_require_approval: requireApproval ? 'true' : 'false',
        marketplace_show_urgency: showUrgency ? 'true' : 'false',
        marketplace_promo_banner: promoBanner,
        marketplace_vendor_contact: vendorContact ? 'true' : 'false',
        marketplace_seo_title: seoTitle,
        marketplace_seo_desc: seoDesc,
        marketplace_hero_image: heroImage,
      }
      
      const res = await fetch('/api/admin/settings/platform', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ config }),
      })

      if (!res.ok) throw new Error('Erreur réseau')
      toast.success('Règles de Marketplace actualisées ✓')
    } catch {
      toast.error('Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Composant réutilisable pour les Mini-Toggles
  const ToggleRow = ({ label, desc, state, setState, icon: Icon, colorClass }: any) => (
    <div className="flex items-start justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 hover:bg-gray-50 transition-colors">
      <div className="flex gap-4">
        <div className={`mt-1 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">{label}</h4>
          <p className="text-xs font-medium text-gray-500 mt-0.5 leading-relaxed max-w-[280px]">{desc}</p>
        </div>
      </div>
      <button 
        onClick={() => setState(!state)}
        className="focus:outline-none transition-transform hover:scale-105 active:scale-95 ml-4"
      >
        {state ? (
          <ToggleRight className={`w-10 h-10 ${colorClass} drop-shadow-sm`} />
        ) : (
          <ToggleLeft className="w-10 h-10 text-gray-300 drop-shadow-sm" />
        )}
      </button>
    </div>
  )

  return (
    <div className="space-y-8 flex flex-col w-full h-full">
      
      {/* 1. KILL SWITCH MARKETPLACE */}
      <div className={`relative overflow-hidden rounded-3xl p-6 lg:p-8 shadow-sm transition-all border ${active ? 'bg-white border-emerald-200 ring-4 ring-emerald-500/10' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex flex-shrink-0 items-center justify-center shadow-inner border ${active ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
            <Globe className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black tracking-tight text-gray-900">Visibilité Publique</h3>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Ouvrir le portail e-commerce public affichant l'intégralité du compte de vos vendeurs.</p>
          </div>
          <button 
            onClick={() => setActive(!active)}
            className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
          >
            {active ? (
              <ToggleRight className="w-14 h-14 text-emerald-500 drop-shadow-sm" />
            ) : (
              <ToggleLeft className="w-14 h-14 text-gray-300 drop-shadow-sm" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 2. PARAMETRES D'AFFICHAGE */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
               <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-gray-900">Algorithme Central</h3>
              <p className="text-xs font-medium text-gray-500 mt-0.5">Ce que les visiteurs voient en premier.</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider ml-1">Titre (H1)</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Découvrez notre sélection !"
                className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider ml-1">Produits en Vedette (Limite)</label>
              <div className="relative">
                 <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input
                   type="number"
                   value={limit}
                   onChange={(e) => setLimit(e.target.value)}
                   min="1"
                   max="100"
                   className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                 />
              </div>
              <p className="text-[11px] font-medium text-gray-400 mt-2 ml-1">Évitez une surcharge du navigateur en limitant le flux aléatoire initial.</p>
            </div>
          </div>
        </div>

        {/* 3. MODERATION & SÉCURITÉ */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
               <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-gray-900">Modération du Catalogue</h3>
              <p className="text-xs font-medium text-gray-500 mt-0.5">Protégez la réputation de votre site.</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <ToggleRow 
              label="Approbation Manuelle" 
              desc="Exigez qu'un admin valide manuellement les nouveaux produits des vendeurs avant de les afficher en public." 
              state={requireApproval} 
              setState={setRequireApproval} 
              icon={ShieldAlert} 
              colorClass="text-orange-500"
            />
            
            <ToggleRow 
              label="Badges d'Urgence (FOMO)" 
              desc="Affiche de (faux ou vrais) badges de « Stock Limité » pour forcer les décisions d'achat." 
              state={showUrgency} 
              setState={setShowUrgency} 
              icon={BellRing} 
              colorClass="text-rose-500"
            />
          </div>
        </div>
      </div>

      {/* 4. MARKETING & CONVERSION */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-8">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
             <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-gray-900">Leviers de Conversion</h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Augmentez l'engagement des visiteurs anonymes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider ml-1">Bannière d'Annonce Flash</label>
            <input
              type="text"
              value={promoBanner}
              onChange={(e) => setPromoBanner(e.target.value)}
              placeholder="Ex: 📦 Frais de port offerts sur tout le catalogue ce dimanche !"
              className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all shadow-sm"
            />
            <p className="text-[11px] font-medium text-gray-400 ml-1">Laissez vide pour désactiver le bandeau promotionnel.</p>
          </div>

          <div>
             <ToggleRow 
                label="Boutons de Contact Vendeur" 
                desc="Affiche un mini-bouton « WhatsApp direct » sur les fiches produits permettant de joindre le vendeur." 
                state={vendorContact} 
                setState={setVendorContact} 
                icon={Smartphone} 
                colorClass="text-purple-500"
              />
          </div>
        </div>
      </div>

      {/* 5. SEO & IDENTITÉ VISUELLE */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-8">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
             <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-gray-900">SEO & Identité Visuelle</h3>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Personnalisez l'apparence et le référencement du catalogue public.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {/* SEO COLUMN */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                 <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">Titre SEO (Google)</label>
                 <button
                   type="button"
                   title="Générer avec l'IA"
                   onClick={() => handleAIGenerate('seoTitle')}
                   disabled={generatingAI['seoTitle']}
                   className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 active:scale-95"
                 >
                   {generatingAI['seoTitle'] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                   Aide IA
                 </button>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Ex: Titre optimisé pour Google..."
                className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                 <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">Meta Description (Google)</label>
                 <button
                   type="button"
                   title="Générer avec l'IA"
                   onClick={() => handleAIGenerate('seoDesc')}
                   disabled={generatingAI['seoDesc']}
                   className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 active:scale-95"
                 >
                   {generatingAI['seoDesc'] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                   Aide IA
                 </button>
              </div>
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                rows={3}
                placeholder="Ex: La toute première marketplace au Sénégal pour..."
                className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl py-3 px-4 text-sm font-medium text-gray-900 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* IMAGE COVER COLUMN */}
          <div>
              <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider ml-1">Bannière Accueil Public (Cover)</label>
              <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 group hover:border-pink-300 hover:bg-pink-50/30 transition-all flex flex-col items-center justify-center" aria-label="Upload Cover">
                 {heroImage ? (
                   <>
                      <img src={heroImage} alt="Cover Marketplace" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-white font-bold text-[13px] bg-black/60 px-5 py-2.5 rounded-xl backdrop-blur-md ring-1 ring-white/20 shadow-xl">Changer l'image</span>
                      </div>
                   </>
                 ) : (
                   <div className="text-center p-6 pb-8">
                     <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-pink-500 transition-colors">
                         {uploading ? <Loader2 className="w-5 h-5 animate-spin text-pink-500" /> : <ImageIcon className="w-5 h-5" />}
                     </div>
                     <p className="text-sm font-bold text-gray-700">Importer une bannière</p>
                     <p className="text-xs font-medium text-gray-400 mt-1">PNG, JPG ou WEBP (Max 2MB)</p>
                   </div>
                 )}
                 <input
                   title="Upload image"
                   type="file"
                   accept="image/*"
                   onChange={handleImageUpload}
                   disabled={uploading}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                 />
              </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="mt-12 flex justify-end pt-8 border-t border-gray-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] bg-gradient-to-r from-[#0D5C4A] to-emerald-600 hover:from-[#0F7A60] hover:to-emerald-500 active:scale-95 transition-all outline-none disabled:opacity-50 disabled:active:scale-100"
          >
            {saving ? 'Déploiement...' : 'Déployer les Stratégies'}
            <Save className="w-4 h-4 ml-1 opacity-80" />
          </button>
        </div>
      </div>

    </div>
  )
}
