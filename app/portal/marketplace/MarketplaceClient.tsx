'use client'

import { useState } from 'react'
import { Search, ShoppingBag, ArrowUpRight, CheckCircle2, Clock, X, QrCode as QrCodeIcon, Download, Copy } from 'lucide-react'
import { applyForAffiliation } from './actions'
import QRCode from 'qrcode'

type MarketplaceItem = {
  id: string
  type: 'product' | 'page'
  title: string
  description: string
  price: number | null
  commissionRate: number
  image: string | null
  storeId: string
  storeName: string
  storeSlug: string
  storeLogo: string | null
  slug: string
  mediaKitUrl?: string | null
}

type MarketplaceClientProps = {
  items: MarketplaceItem[]
  affiliations: Record<string, any>[] // Array of Affiliate objects from DB
  userId: string
}

// Modal Component for generated Link
function LinkModal({ item, affiliation, onClose }: { item: MarketplaceItem, affiliation: Record<string, any>, onClose: () => void }) {
  const [copying, setCopying] = useState(false)
  const [qrBase64, setQrBase64] = useState('')

  const baseUrl = item.type === 'product' 
    ? `https://${item.storeSlug}.yayyam.com/p/${item.slug}`
    : `https://${item.storeSlug}.yayyam.com/${item.slug}`

  const trackedUrl = `${baseUrl}?ref=${affiliation.token}`

  // Generate QR on mount
  useState(() => {
    QRCode.toDataURL(trackedUrl, { width: 300, margin: 2, color: { dark: '#052e22', light: '#ffffff' } })
      .then(setQrBase64)
      .catch(console.error)
  })

  const handleCopy = () => {
    navigator.clipboard.writeText(trackedUrl)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  const [aiLoading, setAiLoading] = useState(false)
  const [aiPlatform, setAiPlatform] = useState<'tiktok' | 'facebook' | 'whatsapp'>('whatsapp')
  const [aiResult, setAiResult] = useState('')
  const [showAi, setShowAi] = useState(false)

  const downloadQR = () => {
    if (!qrBase64) return
    const a = document.createElement('a')
    a.href = qrBase64
    a.download = `QR_Code_${item.slug}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleGenerateAI = async () => {
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await fetch('/api/ai/generate-affiliate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: item.title,
          productDescription: item.description,
          link: trackedUrl,
          platform: aiPlatform
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiResult(data.result)
    } catch (e) {
      const error = e as Error;
      alert(error.message || "Erreur lors de la génération")
    } finally {
      setAiLoading(false)
    }
  }

  const copyAiResult = () => {
    navigator.clipboard.writeText(aiResult)
    // Optional toast here
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up overflow-y-auto pt-24 pb-12">
      <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl relative my-auto">
        <button onClick={onClose} aria-label="Fermer" title="Fermer" className="absolute top-4 right-4 bg-cream text-slate hover:bg-line p-2 rounded-full transition-colors z-10">
          <X size={20} />
        </button>
        <div className="p-6 md:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="w-12 h-12 bg-emerald/10 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 className="text-emerald w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-black text-ink mb-2">Votre lien est prêt !</h2>
          <p className="text-slate text-sm mb-6">Partagez ce lien unique pour le programme <strong>{item.title}</strong>. Toute vente générée vous rapportera <strong>{item.commissionRate * 100}%</strong> de commission.</p>

          <div className="bg-emerald/5 border border-emerald/20 p-4 rounded-xl flex items-center gap-4 mb-6">
            <div className="flex-1 font-mono text-emerald-deep text-[13px] sm:text-sm break-all font-medium">
              {trackedUrl}
            </div>
            <button
              onClick={handleCopy}
              className="bg-charcoal text-white px-4 sm:px-5 py-2.5 rounded-lg font-bold hover:bg-ink transition-colors shrink-0 flex items-center gap-2 text-sm"
            >
              {copying ? <><CheckCircle2 size={16}/> Copié</> : <><Copy size={16}/> Copier</>}
            </button>
          </div>

          {!showAi ? (
             <button
               onClick={() => setShowAi(true)}
               className="w-full bg-gradient-to-r from-emerald-deep to-emerald text-white rounded-xl py-4 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-6"
             >
               <span className="text-xl">🪄</span> Créer mon texte promotionnel avec l'IA
             </button>
          ) : (
             <div className="bg-cream rounded-2xl p-4 sm:p-5 border border-line mb-6 animate-fade-in">
               <div className="flex items-center gap-2 mb-4">
                 <span className="text-xl">🪄</span> 
                 <h4 className="font-bold text-ink text-sm">Assistant Copywriting (Claude 3.5)</h4>
               </div>
               
               <div className="flex flex-wrap gap-2 mb-4">
                 {(['whatsapp', 'facebook', 'tiktok'] as const).map(plat => (
                   <button
                     key={plat}
                     onClick={() => setAiPlatform(plat)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-colors ${aiPlatform === plat ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-slate border-line hover:border-charcoal/30'}`}
                   >
                     {plat}
                   </button>
                 ))}
               </div>

               <button
                 onClick={handleGenerateAI}
                 disabled={aiLoading}
                 className="w-full bg-white border border-line hover:border-emerald text-ink rounded-xl py-3 font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
               >
                 {aiLoading ? (
                   <div className="w-4 h-4 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
                 ) : (
                   "Générer le script"
                 )}
               </button>

               {aiResult && (
                 <div className="mt-4 bg-white border border-line rounded-xl p-4 relative group">
                   <p className="text-sm text-ink whitespace-pre-wrap font-medium leading-relaxed">{aiResult}</p>
                   <button 
                     onClick={copyAiResult}
                     className="absolute top-2 right-2 p-2 bg-cream rounded-lg text-slate hover:text-ink hover:bg-line transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                     title="Copier le texte"
                   >
                     <Copy size={16} />
                   </button>
                 </div>
               )}
             </div>
          )}

          {item.mediaKitUrl && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-6">
              <div>
                 <h4 className="font-bold text-blue-900 text-sm mb-1 flex items-center gap-2">
                   <Download size={16} /> Kit Média Vendeur
                 </h4>
                 <p className="text-xs text-blue-800/80 leading-relaxed font-medium">Le vendeur a mis à disposition des visuels pour vous aider à promouvoir.</p>
              </div>
              <a 
                href={item.mediaKitUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-sm whitespace-nowrap w-full sm:w-auto text-center"
              >
                Accéder au Kit
              </a>
            </div>
          )}

          {qrBase64 && (
             <div className="flex flex-col sm:flex-row items-center gap-6 bg-cream p-5 rounded-2xl border border-line mt-2">
               <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={qrBase64} alt="QR Code" className="w-24 h-24 object-contain" />
               </div>
               <div className="text-center sm:text-left flex-1">
                 <h4 className="font-bold text-ink text-sm mb-1 flex items-center justify-center sm:justify-start gap-1.5">
                   <QrCodeIcon size={16} className="text-emerald" /> QR Code Physique
                 </h4>
                 <p className="text-xs text-slate mb-4 leading-relaxed">Téléchargez l'image pour l'utiliser sur des visuels imprimés (flyers, stickers).</p>
                 <button 
                   onClick={downloadQR}
                   className="text-xs font-bold text-ink border border-line bg-white hover:bg-line px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 mx-auto sm:mx-0 shadow-sm"
                 >
                   <Download size={14} /> Télécharger PNG
                 </button>
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function MarketplaceClient({ items, affiliations }: MarketplaceClientProps) {
  const [search, setSearch] = useState('')
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)

  // Pour chaque store, on détermine rapidement le statut
  const affiliationMap = new Map<string, Record<string, any>>()
  affiliations.forEach(aff => {
    affiliationMap.set(aff.vendor_id, aff)
  })

  // Filtrage
  const filtered = items.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return item.title.toLowerCase().includes(q) 
        || item.storeName.toLowerCase().includes(q)
        || item.description?.toLowerCase().includes(q)
  })

  const handleApply = async (storeId: string) => {
    setLoadingIds(prev => new Set(prev).add(storeId))
    const res = await applyForAffiliation(storeId)
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(storeId)
      return next
    })
    
    if (res.error) {
      alert("Erreur: " + res.error)
    } else {
      // Reload automatically handled by revalidatePath in Server Action,
      // The component will re-render with new data from server.
    }
  }

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-line flex items-center gap-2">
         <Search className="w-5 h-5 text-dust ml-2" />
         <input 
            type="text" 
            placeholder="Rechercher par produit, marque..."
            className="w-full bg-transparent border-none focus:ring-0 text-ink text-base px-2 py-1 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
         />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-line p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mb-4">
               <ShoppingBag className="w-10 h-10 text-dust" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-display font-black text-ink mb-2">Aucun programme trouvé</h3>
            <p className="text-slate max-w-md">Il n'y a actuellement aucun programme correspondant à votre recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(item => {
            const affiliateRecord = affiliationMap.get(item.storeId)
            const status = affiliateRecord?.status || 'none'
            const isPending = status === 'pending'
            const isActive = status === 'active'
            const isRejected = status === 'rejected'
            const isLoading = loadingIds.has(item.storeId)

            // Estimating earnings
            const commissionPct = (item.commissionRate * 100).toFixed(0)
            const estimatedGain = item.price ? (item.price * item.commissionRate) : null

            return (
              <div key={item.id} className="bg-white rounded-[2rem] border border-line shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group/card">
                 {/* Header image/placeholder */}
                 <div className="h-40 bg-cream relative overflow-hidden">
                    {item.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-600/30">
                         <ShoppingBag className="w-16 h-16" strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                       <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Actif
                    </div>
                 </div>

                 <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                       {item.storeLogo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.storeLogo} alt="Logo" className="w-5 h-5 rounded border border-line object-cover" />
                       ) : (
                          <div className="w-5 h-5 rounded bg-emerald text-white flex items-center justify-center text-[10px] font-bold">
                             {item.storeName[0]}
                          </div>
                       )}
                       <span className="text-xs font-bold text-slate uppercase tracking-wider truncate">{item.storeName}</span>
                    </div>

                    <h3 className="font-display font-bold text-ink text-lg leading-snug mb-2 line-clamp-2">
                       {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-6 text-sm">
                       {item.price ? (
                         <span className="font-bold text-charcoal bg-cream px-2 py-0.5 rounded-md">{formatPrice(item.price)}</span>
                       ) : (
                         <span className="text-slate italic">Prix variable</span>
                       )}
                       <span className="text-line">•</span>
                       <span className="text-emerald-deep font-bold bg-emerald/10 px-2 py-0.5 rounded-md">
                         {commissionPct}% Com.
                       </span>
                    </div>

                    {/* Marge Calculée Highlight */}
                    {estimatedGain && (
                       <div className="bg-emerald-deep text-white px-4 py-3 rounded-xl mb-6">
                          <p className="text-emerald-200 text-xs font-medium mb-0.5 uppercase tracking-wider">Vos gains par vente</p>
                          <p className="font-display font-black text-xl">{formatPrice(estimatedGain)}</p>
                       </div>
                    )}
                    {!estimatedGain && (
                       <div className="bg-slate-50 border border-line text-charcoal px-4 py-3 rounded-xl mb-6">
                          <p className="text-slate-500 text-xs font-medium mb-0.5 uppercase tracking-wider">Modèle de revenus</p>
                          <p className="font-display font-black text-lg">{commissionPct}% sur la vente</p>
                       </div>
                    )}

                    <div className="mt-auto">
                      {isActive ? (
                        <button 
                          onClick={() => setSelectedItem(item)}
                          className="w-full flex items-center justify-center gap-2 bg-emerald text-white font-bold py-3.5 rounded-xl hover:bg-emerald-rich transition-colors shadow-sm"
                        >
                           <ArrowUpRight size={18} /> Obtenir le Lien
                        </button>
                      ) : isPending ? (
                        <button disabled className="w-full flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 font-bold py-3.5 rounded-xl border border-yellow-200 cursor-not-allowed">
                           <Clock size={18} /> Validation en attente
                        </button>
                      ) : isRejected ? (
                        <button disabled className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 font-bold py-3.5 rounded-xl border border-red-200 cursor-not-allowed">
                           <X size={18} /> Partenariat Refusé
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleApply(item.storeId)}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 bg-charcoal text-white font-bold py-3.5 rounded-xl hover:bg-ink transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
                        >
                           {isLoading ? (
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           ) : (
                             "Demander un partenariat"
                           )}
                        </button>
                      )}
                    </div>
                 </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedItem && (
        <LinkModal 
          item={selectedItem} 
          affiliation={affiliationMap.get(selectedItem.storeId) || {}} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  )
}
