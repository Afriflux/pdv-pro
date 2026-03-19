'use client'

import { useState } from 'react'
import { generateQrWithLogo } from '@/lib/qrcode/generateQR'
import { Share2, Receipt, QrCode, Clipboard, MessageCircle, BarChart3, ExternalLink, Download } from 'lucide-react'

interface MarketingClientProps {
  store: { id: string; name: string; slug: string }
  links: any[]
  products: { id: string; name: string; type: string; views?: number }[]
  domain: string
}

export default function MarketingClient({ store, links, products, domain }: MarketingClientProps) {
  const [selectedProductId] = useState<string>('store')
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'share' | 'analytics'>('share')

  const storeUrl = `https://${domain}/${store.slug}`
  
  const currentProduct = selectedProductId === 'store' 
    ? { name: store.name, url: storeUrl }
    : { 
        name: products.find(p => p.id === selectedProductId)?.name || '', 
        url: `${storeUrl}?product=${selectedProductId}`
      }

  const existingShortLink = links.find(l => 
    selectedProductId === 'store' ? (l.product === null) : (l.product_id === selectedProductId)
  )

  const finalUrl = existingShortLink 
    ? `https://${domain}/s/${existingShortLink.code}` 
    : currentProduct.url

  const textCourt = `Découvrez ${currentProduct.name} ! Achetez maintenant : ${finalUrl}`
  // const textDetaille = ... (supprimé car inutilisé)
  
  const handleCopy = (text: string, id: string = 'main') => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleGenerateQR = async (url: string) => {
    const dataUrl = await generateQrWithLogo(url, store.name, { color: { dark: '#1e293b' } })
    setQrCodeData(dataUrl)
  }

  const handleNativeShare = async (url: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: store.name,
          text: text,
          url: url,
        })
      } catch (err) {
        console.log('Error sharing', err)
      }
    } else {
      handleCopy(url)
    }
  }

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0)
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0)
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* NAVIGATION TABS - GLASSMORPHISM STYLE */}
      <div className="flex p-1.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm max-w-sm">
        <button 
          onClick={() => setActiveTab('share')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'share' ? 'bg-ink text-white shadow-lg' : 'text-slate-500 hover:bg-white/80'}`}
        >
          <Share2 size={16} />
          Promotion
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'analytics' ? 'bg-ink text-white shadow-lg' : 'text-slate-500 hover:bg-white/80'}`}
        >
          <BarChart3 size={16} />
          Statistiques
        </button>
      </div>

      {activeTab === 'share' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SECTION 1: MAIN STORE SHARING */}
          <div className="lg:col-span-12">
            <div className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="inline-block bg-gold/10 text-gold-rich text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-gold/20">
                    Lien de Vente Principal
                  </span>
                  <h2 className="text-3xl font-black text-ink tracking-tight">Partagez votre boutique</h2>
                  <p className="text-slate-500 font-medium">C&apos;est le lien que vous devez mettre dans votre bio Instagram ou TikTok.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm font-mono text-ink font-bold">
                    {storeUrl.replace('https://', '')}
                  </div>
                  <button 
                    onClick={() => handleCopy(storeUrl, 'store-main')}
                    className="h-14 w-14 flex items-center justify-center bg-ink text-gold rounded-2xl hover:scale-105 transition-all shadow-lg active:scale-95"
                  >
                    {copied === 'store-main' ? '✅' : <Clipboard size={24} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(textCourt)}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all shadow-lg shadow-green-500/20"
                >
                  <MessageCircle size={20} />
                  WhatsApp
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#1877F2] text-white py-4 rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all shadow-lg shadow-blue-500/20"
                >
                  Facebook
                </a>
                <button 
                  onClick={() => handleGenerateQR(storeUrl)}
                  className="flex items-center justify-center gap-3 bg-ink text-white py-4 rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all shadow-lg shadow-slate-900/20"
                >
                  <QrCode size={20} />
                  QR Code
                </button>
                <button 
                  onClick={() => handleNativeShare(storeUrl, textCourt)}
                  className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-ink py-4 rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all shadow-sm"
                >
                  <Share2 size={20} />
                  Autres
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: PRODUCTS GRID WITH ACTIONS */}
          <div className="lg:col-span-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-ink tracking-tight flex items-center gap-3">
                <Receipt className="text-gold" />
                Actions par produit
              </h2>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{products.length} produits actifs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(product => {
                const productUrl = `${storeUrl}?product=${product.id}`
                const shareText = `Commandez ${product.name} ici : ${productUrl}`
                
                return (
                  <div key={product.id} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-500">
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${product.type === 'DIGITAL' ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{product.type}</span>
                        </div>
                        <h3 className="font-black text-ink text-lg leading-tight group-hover:text-gold transition-colors">{product.name}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xl font-black text-ink">{(product.views || 0)}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Vues</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => handleCopy(productUrl, product.id)}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-gold/10 hover:text-gold transition-all"
                        title="Copier le lien"
                      >
                        {copied === product.id ? '✅' : <Clipboard size={18} />}
                      </button>
                      <a 
                        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-[#25D366]/10 hover:text-[#25D366] transition-all"
                        title="Partager sur WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </a>
                      <button 
                        onClick={() => handleGenerateQR(productUrl)}
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-ink hover:text-white transition-all"
                        title="Générer QR"
                      >
                        <QrCode size={18} />
                      </button>
                      <a 
                        href={productUrl}
                        target="_blank" rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                        title="Voir en direct"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ANALYTICS TAB */
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-ink p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <BarChart3 size={80} />
              </div>
              <p className="text-gold font-black uppercase tracking-[0.2em] text-[10px] mb-2">Visibilité totale</p>
              <p className="text-5xl font-black tracking-tight">{totalViews}</p>
              <p className="mt-4 text-slate-400 text-sm font-bold">Vues cumulées sur tous vos produits</p>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-2">Engagemement</p>
                <p className="text-5xl font-black text-ink">{totalClicks}</p>
              </div>
              <p className="mt-4 text-slate-500 text-sm font-medium">Clics sur vos liens de partage (Shortlinks)</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-2">Catalogue</p>
                <p className="text-5xl font-black text-ink">{products.length}</p>
              </div>
              <p className="mt-4 text-slate-500 text-sm font-medium">Produits actifs en vente actuellement</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-ink tracking-tight">Performance des liens courts</h3>
              <div className="bg-gold/10 text-gold-rich text-[10px] font-black px-3 py-1 rounded-full uppercase">Top sources</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">
                            {link.product?.name?.[0] || 'E'}
                          </div>
                          <div>
                            <p className="font-black text-ink tracking-tight">{link.product?.name ?? 'Espace de vente'}</p>
                            <p className="text-xs text-slate-400 font-bold font-mono">/s/{link.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gold rounded-full" 
                              style={{ width: `${Math.min(100, (link.clicks / (totalClicks || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-black text-ink">{link.clicks}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-tight">Clics enregistrés</p>
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-300 text-sm">
                        {new Date(link.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {links.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                        Aucune donnée enregistrée pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QR CODE SIMPLE (SI GÉNÉRÉ) */}
      {qrCodeData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-2xl">
            <h3 className="text-2xl font-black text-ink mb-2">Votre Code QR</h3>
            <p className="text-slate-500 font-medium mb-8">Partagez-le ou imprimez-le pour vos flyers.</p>
            
            <div className="p-3 border-4 border-slate-50 rounded-[2rem] bg-white mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeData} alt="QR Code" className="w-56 h-56" />
            </div>

            <div className="flex flex-col w-full gap-3">
              <a 
                href={qrCodeData} 
                download={`QR_${store.name}.png`}
                className="w-full bg-ink text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
              >
                <Download size={20} />
                Télécharger l&apos;image
              </a>
              <button 
                onClick={() => setQrCodeData(null)}
                className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
