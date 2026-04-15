'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, Wand2, Loader2, ChevronDown, PenTool, Video, Info, Zap, LineChart, TrendingUp, AlertCircle } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  type: string
}

export function AiGeneratorClient({ initialProducts, usageCount }: { initialProducts: Product[], usageCount: number }) {
  const [activeTab, setActiveTab] = useState<'script' | 'description' | 'coach'>('script')

  // Script State
  const [productName, setProductName] = useState('')
  const [platform, setPlatform] = useState('tiktok')
  const [objective, setObjective] = useState('ventes')
  const [duration, setDuration] = useState('30s')
  const [generatingScript, setGeneratingScript] = useState(false)
  const [scriptResult, setScriptResult] = useState<{script: string, hooks: string[], hashtags: string[]} | null>(null)
  
  // Description State
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [tone, setTone] = useState('persuasif')
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [descResult, setDescResult] = useState<{description: string} | null>(null)

  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copié dans le presse-papier !')
    setTimeout(() => setCopied(false), 2000)
  }

  const generateScript = async () => {
    if (!productName.trim()) {
       toast.error('Entrez le nom de votre produit.')
       return
    }
    setGeneratingScript(true)
    try {
      const res = await fetch('/api/ai/generate-script', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, platform, objective, duration }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur serveur')
      setScriptResult(await res.json())
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la génération.')
    } finally {
      setGeneratingScript(false)
    }
  }

  const generateDescription = async () => {
    if (!selectedProduct) {
       toast.error('Sélectionnez un produit.')
       return
    }
    setGeneratingDesc(true)
    try {
      // Pour le moment on réutilise l'endpoint de scripts en simulant un prompt si un endpoint spécifique n'existe pas.
      // Si vous développez /api/ai/generate-description plus tard, vous pourrez le brancher ici !
      const pName = initialProducts.find(p => p.id === selectedProduct)?.name || 'Ce produit'
      const res = await fetch('/api/ai/generate-script', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: pName + ` (Ton ${tone})`, platform: 'facebook', objective: 'ventes', duration: '60s' }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur serveur')
      const data = await res.json()
      setDescResult({ description: data.script })
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la génération.')
    } finally {
      setGeneratingDesc(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column - Form */}
      <div className="w-full lg:w-[45%] flex flex-col gap-6">
        
        {/* Usage Card */}
        <div className="bg-purple-50 text-purple-900 border border-purple-200 rounded-3xl p-5 shadow-sm flex items-start gap-4">
          <Info className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Crédits d'IA Restants</h3>
            <p className="text-xs text-purple-700 mt-1 font-medium bg-purple-100 inline-block px-2 py-1 rounded-md">
              {Math.max(0, 10 - usageCount)} requêtes / 10 par heure
            </p>
            <p className="text-xs font-medium text-purple-700/80 mt-2">
              Nous utilisons le modèle Claude 3.5 Sonnet pour garantir une syntaxe culturelle adaptée au marché africain francophone.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border text-sm border-gray-200 rounded-2xl p-1 flex shadow-sm">
          <button 
            onClick={() => setActiveTab('script')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'script' ? 'bg-gray-100 text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Video size={18} />
            Scripts Publicitaires
          </button>
          <button 
            onClick={() => setActiveTab('description')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'description' ? 'bg-gray-100 text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <PenTool size={18} />
            Copywriting
          </button>
          <button 
            onClick={() => setActiveTab('coach')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'coach' ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200' : 'text-purple-600 hover:bg-purple-50'}`}
          >
            <LineChart size={18} />
            Coach Business
          </button>
        </div>

        {/* Tab Content: Script */}
        {activeTab === 'script' && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Nom ou idée du Produit
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Tissu Bazin Riche, Tapis..."
                className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-[#1A1A1A] outline-none focus:border-purple-400 transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Réseau Cible</label>
                <select
                  title="Plateforme Cible"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full appearance-none bg-[#FAFAF7] border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-[#1A1A1A] outline-none focus:border-purple-400 transition-colors"
                >
                  <option value="tiktok">🎵 TikTok</option>
                  <option value="instagram">📸 Instagram Reels</option>
                  <option value="facebook">👥 Facebook Feed</option>
                </select>
                <ChevronDown className="absolute right-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                 <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Durée visée</label>
                 <select
                  title="Durée de la vidéo"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full appearance-none bg-[#FAFAF7] border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-[#1A1A1A] outline-none focus:border-purple-400 transition-colors"
                >
                  <option value="15s">⏱️ 15s (Flash)</option>
                  <option value="30s">⏱️ 30s (Classique)</option>
                  <option value="60s">⏱️ 60s (Long format)</option>
                </select>
                <ChevronDown className="absolute right-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={generateScript}
              disabled={generatingScript || !productName.trim()}
              className="w-full py-4 mt-2 bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white rounded-xl font-black transition-all disabled:opacity-50 text-sm shadow-xl shadow-purple-900/20"
            >
              {generatingScript ? (
                 <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Génération en cours...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Wand2 className="w-5 h-5"/> Créer mon Script TikTok/Insta</span>
              )}
            </button>
          </div>
        )}

        {/* Tab Content: Description */}
        {activeTab === 'description' && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Sélectionnez un Produit
              </label>
              <div className="relative">
                <select
                  title="Sélectionner le produit"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full appearance-none bg-[#FAFAF7] border border-gray-200 rounded-xl py-3.5 pl-4 pr-10 text-sm font-bold text-[#1A1A1A] outline-none focus:border-purple-400 transition-colors"
                >
                  <option value="">-- Choisir un produit existant --</option>
                  {initialProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price} XOF)</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ton Editorial</label>
              <select
                title="Ton de la rédaction"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full appearance-none bg-[#FAFAF7] border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-[#1A1A1A] outline-none focus:border-purple-400 transition-colors"
              >
                <option value="persuasif">🔥 Persuasif & Urgent</option>
                <option value="luxe">✨ Luxe & Premium</option>
                <option value="humour">😂 Humoristique / Famille</option>
              </select>
              <ChevronDown className="absolute right-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={generateDescription}
              disabled={generatingDesc || !selectedProduct}
              className="w-full py-4 mt-2 bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white rounded-xl font-black transition-all disabled:opacity-50 text-sm shadow-xl shadow-purple-900/20"
            >
              {generatingDesc ? (
                 <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Réécriture magique...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Sparkles className="w-5 h-5"/> Rédiger la Description</span>
              )}
            </button>
          </div>
        )}

        {/* Tab Content: Coach */}
        {activeTab === 'coach' && (
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                <LineChart size={24} />
              </div>
              <h3 className="text-xl font-black text-purple-900 tracking-tight">Coach Proactif</h3>
            </div>
            <p className="text-sm font-medium text-purple-700/80 leading-relaxed">
              L'IA analyse le comportement de vos clients et vous propose des actions concrètes pour augmenter virtuellement votre Taux de Conversion et votre LTV.
            </p>
            <button className="w-full py-4 mt-2 bg-purple-900 hover:bg-black text-white rounded-xl font-black transition-all text-sm shadow-xl flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5"/> Lancer l'analyse de ma boutique
            </button>
          </div>
        )}
      </div>

      {/* Right Column - Results */}
      <div className="w-full lg:w-[55%]">
        {!scriptResult && !descResult && activeTab !== 'coach' ? (
          <div className="h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-white/50">
            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold text-lg text-gray-800 mb-1">La Magie s'opère ici</p>
            <p className="text-sm font-medium">Lancez une génération pour voir la magie d'une intelligence artificielle spécifiquement entraînée pour le e-commerce local.</p>
          </div>
        ) : activeTab === 'coach' ? (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl shadow-gray-200/50 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-lg font-black text-[#1A1A1A] flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-600"/> Insights du Jour</h3>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">Boutique Saine</span>
            </div>
            
            <div className="space-y-4">
              <div className="p-5 bg-[#FAFAF7] border border-gray-200 rounded-2xl flex gap-4 items-start shadow-sm">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1A1A1A] text-[15px] mb-1">Baisse des conversions WhatsApp</h4>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed mb-3">Depuis 3 jours, beaucoup de clics vers WhatsApp n'aboutissent pas à une commande. Vos clients attendent probablement trop longtemps une réponse.</p>
                  <button className="text-xs font-black bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg text-[#1A1A1A] hover:bg-gray-50 transition-colors">Activer le Bot de bienvenue</button>
                </div>
              </div>

              <div className="p-5 bg-[#FAFAF7] border border-gray-200 rounded-2xl flex gap-4 items-start shadow-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1A1A1A] text-[15px] mb-1">Opportunité d'Upsell détectée</h4>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed mb-3">60% des acheteurs du "Gamme Clarifiante" ont aussi cliqué sur le "Savon". Créez une Promotion "Bump" pour leur offrir le savon à -20%.</p>
                  <button className="text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">Créer ce Bump maintenant</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl shadow-gray-200/50 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
            
            {(activeTab === 'script' && scriptResult) && (
              <div className="space-y-8">
                {/* Script Principal */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-[#1A1A1A] flex items-center gap-2"><Video className="w-5 h-5 text-purple-600"/> Script Principal</h3>
                    <button onClick={() => handleCopy(scriptResult.script)} className="text-xs font-bold flex items-center gap-1.5 text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg">
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copié!' : 'Copier'}
                    </button>
                  </div>
                  <div className="p-6 bg-[#FAFAF7] rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-medium text-gray-700 border border-gray-100 shadow-inner">
                    {scriptResult.script}
                  </div>
                </div>

                {/* Hooks */}
                <div>
                  <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest mb-4 flex items-center gap-2 text-gray-500">
                    <Zap className="w-4 h-4 text-amber-500"/> 3 Accroches Alternatives (Hooks)
                  </h3>
                  <div className="space-y-3">
                    {scriptResult.hooks.map((hook, idx) => (
                      <div key={idx} className="p-4 bg-amber-50 rounded-xl text-sm font-bold text-amber-900 border border-amber-100 flex gap-3">
                        <span className="text-amber-500/50 mt-0.5">{idx + 1}.</span>
                        {hook}
                      </div>
                    ))}
                  </div>
                </div>

                 {/* Hashtags */}
                 <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Hashtags recommandés</h3>
                  <div className="flex flex-wrap gap-2">
                    {scriptResult.hashtags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold font-mono">
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'description' && descResult) && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-[#1A1A1A] flex items-center gap-2"><PenTool className="w-5 h-5 text-purple-600"/> Description Optimisée</h3>
                  <button onClick={() => handleCopy(descResult.description)} className="text-xs font-bold flex items-center gap-1.5 text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg">
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copié!' : 'Copier'}
                  </button>
                </div>
                <div className="p-6 bg-[#FAFAF7] rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-medium text-gray-700 border border-gray-100 shadow-inner min-h-[300px]">
                  {descResult.description}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
