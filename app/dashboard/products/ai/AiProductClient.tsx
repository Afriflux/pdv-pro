'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, Bot, Zap, ArrowRight, Wand2, RefreshCw, Eye, CheckCircle2,
  Image as ImageIcon, UploadCloud, Rocket, Code, Database, Globe
} from 'lucide-react'
import { toast } from '@/lib/toast'
import Swal from 'sweetalert2'
import { PlatformCheckoutModal } from '@/components/shared/billing/PlatformCheckoutModal'

// --- Types
interface GenerateResult {
  product: {
    name: string
    description: string
    price: number
    category: string
    images: string[]
  }
  landingPage: {
    headline: string
    hook: string
    features: string[]
    faq: { question: string, answer: string }[]
  }
}

// --- Animation JARVIS Steps
const JARVIS_STEPS = [
  { text: "Initialisation du moteur de pensée adaptative...", icon: Bot, duration: 1500 },
  { text: "Analyse sémantique du marché cible (Afrique de l'Ouest / Centrale)...", icon: Globe, duration: 1800 },
  { text: "Création du Storytelling 'De Doute à Confiance'...", icon: Wand2, duration: 2500 },
  { text: "Génération des accroches commerciales et objections (FAQ)...", icon: Zap, duration: 2100 },
  { text: "Calcul du Pricing concurrentiel dynamique...", icon: Database, duration: 1600 },
  { text: "Stylisation de la Landing Page et injection CSS...", icon: Code, duration: 2000 },
  { text: "Finalisation du Tunnel de vente...", icon: Sparkles, duration: 1000 }
]

export default function AiProductClient({
  storeId, storeName, dbCredits, wallet
}: { storeId: string, storeName: string, dbCredits: number, wallet: any }) {

  const router = useRouter()
  const [model, setModel] = useState('claude') // 'claude' | 'gpt' | 'gemini'
  const [prompt, setPrompt] = useState('')
  const [image, setImage] = useState<File | null>(null)
  
  // States: 'input' | 'generating' | 'preview'
  const [state, setState] = useState<'input' | 'generating' | 'preview'>('input')
  
  const [jarvisIndex, setJarvisIndex] = useState(0)
  const [jarvisLogs, setJarvisLogs] = useState<string[]>([])
  
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // -- Generation Action
  const handleGenerate = async () => {
    if (!prompt.trim() && !image) {
      toast.error('Veuillez décrire le produit ou uploader une image.')
      return
    }
    if (dbCredits < 5) {
       toast.error('Fonds insuffisants. Requis: 5 crédits IA.')
       return
    }

    setState('generating')
    setJarvisIndex(0)
    setJarvisLogs([])

    // Lancer la séquence Jarvis en fond
    let currentIdx = 0
    const sequence = async () => {
      for (const step of JARVIS_STEPS) {
        setJarvisIndex(currentIdx)
        setJarvisLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.text}`])
        await new Promise(r => setTimeout(r, step.duration))
        currentIdx++
      }
    }
    sequence() // Fire and forget visually

    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, promptText: prompt || 'Analyse cette image', model })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      // On s'assure que la séquence visuelle est au moins bien avancée
      setResult(data)
      setTimeout(() => {
         setState('preview')
      }, Math.max(0, 11000 - JARVIS_STEPS.slice(0, currentIdx).reduce((acc,s)=>acc+s.duration, 0))) // Attendre mini 10s pour l'effet

    } catch (err: any) {
      toast.error(err.message)
      setState('input')
    }
  }

  // Editable Preview States
  const [editablePrice, setEditablePrice] = useState(0)
  const [editableTitle, setEditableTitle] = useState('')
  const [editableHook, setEditableHook] = useState('')

  useEffect(() => {
    if (result) {
      setEditablePrice(result.product.price)
      setEditableTitle(result.landingPage.headline)
      setEditableHook(result.landingPage.hook)
      router.refresh() // Mettre à jour les crédits côté layout
    }
  }, [result, router])

  const handlePublish = async () => {
    if (dbCredits < 5) { // 5 de plus (Génération a déjà pris 5)
       toast.error('Vous avez besoin de 5 crédits pour Publier.')
       return
    }
    setPublishing(true)
    try {
      const payload = {
        storeId,
        productData: {
          ...result!.product,
          price: editablePrice,
        },
        landingData: {
          ...result!.landingPage,
          headline: editableTitle,
          hook: editableHook
        }
      }
      const res = await fetch('/api/ai/publish-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error)

      Swal.fire({
         title: 'Publication Validée !',
         text: `Votre produit et votre tunnel de vente ont été créés avec succès.`,
         icon: 'success',
         confirmButtonText: 'Voir mon Tunnel',
         confirmButtonColor: '#0F7A60'
      }).then(() => {
         router.push('/dashboard/pages')
      })
    } catch(err:any) {
      toast.error(err.message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="w-full">
      {/* HEADER DES CREDITS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2"><Bot className="text-purple-600"/> Yayyam AI Creator</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Générez la page produit & le tunnel de vente de A à Z.</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-2 pl-4 rounded-2xl border border-gray-200">
           <div>
             <p className="text-[10px] font-black tracking-widest uppercase text-gray-400">Solde IA</p>
             <p className="text-lg font-black text-ink leading-none">{dbCredits} <span className="text-xs">Jetons</span></p>
           </div>
           <button 
             onClick={()=>setIsCheckoutOpen(true)}
             className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition"
           >
             Recharger
           </button>
        </div>
      </div>

      {state === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95">
          {/* Formulaire gauche */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
             
             {/* Modèle Select */}
             <div className="mb-8">
               <label className="block text-xs font-black tracking-widest uppercase text-gray-400 mb-3">Modèle IA</label>
               <div className="grid grid-cols-3 gap-2">
                 {[
                   {id: 'claude', name: 'Claude 4.6', sub: 'Pensée Addaptative'},
                   {id: 'gpt', name: 'GPT-5 Omni', sub: 'Hyper Réaliste'},
                   {id: 'gemini', name: 'Gemini 2.5', sub: 'Flash Speed'}
                 ].map(m => (
                   <button 
                     key={m.id}
                     onClick={()=>setModel(m.id)}
                     className={`p-3 rounded-xl border text-left transition-all ${model === m.id ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-600/20' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                   >
                     <p className={`font-black text-sm ${model === m.id ? 'text-purple-700' : 'text-gray-700'}`}>{m.name}</p>
                     <p className={`text-[10px] font-bold ${model === m.id ? 'text-purple-500' : 'text-gray-400'}`}>{m.sub}</p>
                   </button>
                 ))}
               </div>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="block text-xs font-black tracking-widest uppercase text-gray-400 mb-3">Décrivez votre produit</label>
                   <textarea 
                     value={prompt}
                     onChange={e=>setPrompt(e.target.value)}
                     placeholder="Ex: Je vends un magnifique Agbada blanc avec broderies dorées pour hommes..."
                     className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 min-h-[120px] text-sm font-bold text-ink focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition"
                   />
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-gray-100"></div>
                  <span className="text-xs font-black text-gray-300 uppercase tracking-widest">OU / ET</span>
                  <div className="h-[1px] flex-1 bg-gray-100"></div>
                </div>

                <div>
                   <label className="block text-xs font-black tracking-widest uppercase text-gray-400 mb-3">Image source (Optionnel)</label>
                   <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-purple-300 transition cursor-pointer">
                     <UploadCloud className="text-gray-400 mb-2" />
                     <span className="text-sm font-bold text-gray-500">Ajouter une image</span>
                     <input type="file" className="hidden" accept="image/*" onChange={(e)=>{
                        if(e.target.files && e.target.files[0]) setImage(e.target.files[0])
                     }} />
                   </label>
                   {image && <p className="text-xs font-bold text-emerald-600 mt-2 text-center">Image chargée: {image.name}</p>}
                </div>
             </div>

             <div className="mt-8 relative">
               <button 
                 onClick={handleGenerate}
                 className="w-full py-4 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-gray-900/20 group transition-all"
               >
                 <Sparkles className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" /> 
                 Lancer la Génération Magique
               </button>
               <p className="text-center text-[10px] font-bold text-gray-400 mt-3 pt-4 border-t border-gray-100">Coût: <span className="text-purple-600">5 Crédits</span> (Aperçu) + <span className="text-emerald-600">5 Crédits</span> (Si publié)</p>
             </div>
          </div>

          {/* Droite Explication */}
          <div className="flex flex-col justify-center space-y-8 p-10 bg-gradient-to-br from-purple-900 via-[#1a0a2e] to-black rounded-[2.5rem] text-white">
            <h2 className="text-3xl lg:text-4xl font-display font-black leading-tight">La fin des<br/>fiches produits complexes.</h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-white/10 rounded-xl"><Wand2 size={24} className="text-purple-300"/></div>
                <div>
                  <h3 className="font-bold text-lg">Copywriting Immersif</h3>
                  <p className="text-sm text-gray-400 mt-1 font-medium leading-relaxed">Notre IA rédige un storytelling "De Doute à Confiance" ultra performant en Afrique.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-white/10 rounded-xl"><Database size={24} className="text-purple-300"/></div>
                <div>
                  <h3 className="font-bold text-lg">Structure Intégrale</h3>
                  <p className="text-sm text-gray-400 mt-1 font-medium leading-relaxed">Création conjointe du Produit Catalogue ET du Tunnel de Vente optimisé COD.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ETAPE 2 : CHARGEMENT JARVIS ----------------- */}
      {state === 'generating' && (
        <div className="w-full max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center animate-in zoom-in duration-500">
           <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-[80px] animate-pulse"></div>
              {/* Cercle Jarvis style */}
              <div className="absolute inset-0 border-[3px] border-dashed border-purple-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-4 border-[2px] border-purple-500/50 border-t-transparent rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
              <div className="absolute inset-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full animate-pulse shadow-[0_0_40px_rgba(147,51,234,0.5)] flex items-center justify-center z-10">
                 {(() => {
                   const CurrIcon = JARVIS_STEPS[Math.min(jarvisIndex, JARVIS_STEPS.length-1)]?.icon || Bot
                   return <CurrIcon className="w-10 h-10 text-white animate-bounce" />
                 })()}
              </div>
           </div>
           
           <h3 className="text-2xl font-display font-black text-ink mb-8 tracking-tight">
             {JARVIS_STEPS[Math.min(jarvisIndex, JARVIS_STEPS.length-1)]?.text}
           </h3>

           <div className="w-full max-w-xl bg-black rounded-2xl p-4 font-mono text-[11px] text-green-400 h-40 overflow-y-auto shadow-2xl flex flex-col gap-1 border border-gray-800">
              {jarvisLogs.map((log, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <span className="text-gray-500">{'>'}</span> {log}
                </div>
              ))}
              <div className="animate-pulse">_</div>
           </div>
        </div>
      )}

      {/* ----------------- ETAPE 3 : PREVIEW ----------------- */}
      {state === 'preview' && result && (
        <div className="w-full animate-in fade-in zoom-in-95 duration-700">
          
          <div className="flex flex-col lg:flex-row justify-between gap-6 items-start mb-8">
            <div>
               <h2 className="text-2xl font-black text-ink">Aperçu du Tunnel Généré</h2>
               <p className="text-sm font-medium text-gray-500 mt-1">Vous pouvez ajuster les champs clés avant la publication.</p>
            </div>
            <div className="flex bg-[#EAF5F2] border border-[#d1ebe4] text-[#0F7A60] px-4 py-2 rounded-xl text-sm font-bold items-center gap-2">
               <CheckCircle2 className="w-5 h-5"/> V1 Prête ! (Il vous reste {dbCredits} Crédits)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             {/* Panneau Edition */}
             <div className="lg:col-span-5 bg-white rounded-[2rem] border border-gray-200 p-8 shadow-xl shadow-gray-200/50 flex flex-col h-[calc(100vh-200px)] sticky top-6">
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  
                  <div>
                    <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Titre du Tunnel (H1)</label>
                    <textarea 
                      title="Titre du Tunnel"
                      value={editableTitle} onChange={e=>setEditableTitle(e.target.value)}
                      className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl p-3 text-sm font-bold text-ink"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Accroche (Hook)</label>
                    <textarea 
                      title="Accroche du produit"
                      value={editableHook} onChange={e=>setEditableHook(e.target.value)}
                      className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-600 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Prix Recommandé par l'IA (FCFA)</label>
                    <div className="relative">
                       <input 
                         type="number"
                         title="Prix recommandé"
                         value={editablePrice} onChange={e=>setEditablePrice(Number(e.target.value))}
                         className="w-full bg-[#FAFAF7] pl-10 pr-4 border border-gray-200 rounded-xl p-3 text-xl font-black text-ink"
                       />
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">XOF</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                     <p className="text-[11px] font-black tracking-widest uppercase text-gray-400 mb-3">Structures Générées Incluses</p>
                     <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">Bénéfices x4</span>
                        <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">FAQ x{result.landingPage.faq.length}</span>
                        <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-emerald-600">+ Produit Catalogue</span>
                     </div>
                  </div>

                </div>

                <div className="pt-6 mt-4 border-t border-gray-100">
                  <button 
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full py-4 bg-[#0F7A60] hover:bg-[#0c614c] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-[0_8px_20px_rgba(15,122,96,0.2)]"
                  >
                    {publishing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                    Sauvegarder & Publier (-5 Crédits)
                  </button>
                </div>
             </div>

             {/* Phone Preview Iframe-like */}
             <div className="lg:col-span-7 flex justify-center bg-gray-50 rounded-[2.5rem] py-12 border border-gray-200 shadow-inner">
                <div className="w-[375px] h-[750px] bg-white border-[8px] border-gray-900 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                   {/* Notch */}
                   <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-3xl w-40 mx-auto z-50"></div>
                   
                   {/* Mock Header */}
                   <div className="pt-10 pb-4 px-6 text-center border-b border-gray-100 bg-white sticky top-0 z-40">
                      <h4 className="font-black text-lg tracking-tight">{storeName || 'Ma Boutique'}</h4>
                   </div>

                   <div className="flex-1 overflow-y-auto no-scrollbar">
                     <div className="w-full aspect-[4/5] bg-gray-100 relative">
                        <img src={result.product.images[0]} alt="Produit" className="w-full h-full object-cover" />
                     </div>
                     <div className="p-6">
                        <h2 className="text-2xl font-black text-gray-900 leading-tight mb-3">{editableTitle}</h2>
                        <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6 border-l-2 border-emerald-500 pl-3">
                          {editableHook}
                        </p>
                        <div className="bg-emerald-50 text-emerald-900 p-4 rounded-2xl mb-8 flex items-center justify-between">
                           <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Prix de Lancement</p>
                             <p className="text-3xl font-black">{editablePrice.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span></p>
                           </div>
                        </div>

                        <div>
                          <p className="font-black uppercase tracking-widest text-[11px] text-gray-400 mb-4">Pourquoi nous choisir ?</p>
                          <div className="space-y-3">
                             {result.landingPage.features.map((f, i)=> (
                                <div key={i} className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl">
                                   <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
                                   <p className="text-sm font-bold text-gray-700">{f}</p>
                                </div>
                             ))}
                          </div>
                        </div>
                     </div>
                   </div>
                   
                   {/* Sticky Bottom CTA */}
                   <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-40">
                      <button className="w-full py-4 bg-gray-900 text-white rounded-xl font-black shadow-lg">Acheter Maintenant</button>
                   </div>
                </div>
             </div>
          </div>

        </div>
      )}

      {/* Checkout Modal s'il en faut */}
      <PlatformCheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        productDetails={{
          id: `ai_50`,
          type: 'AI',
          title: `Pack VIP de 50 Tokens IA`,
          price: 5000,
          emoji: '🤖',
          color: 'bg-purple-100 text-purple-600'
        }}
        wallet={wallet}
        onPurchaseViaWallet={async () => {
           return { success: false, error: 'Rechargement non géré dans cet aperçu.' }
        }}
      />
    </div>
  )
}
