'use client'

import { useState } from 'react'
import { generateQrWithLogo } from '@/lib/qrcode/generateQR'
import { QrCode, Clipboard, MessageCircle, BarChart3, Download, Image as ImageIcon, Check } from 'lucide-react'

interface MarketingClientProps {
  store: { id: string; name: string; slug: string }
  links: any[]
  products: { id: string; name: string; type: string; views?: number }[]
  domain: string
}

export default function MarketingClient({ store, links, products, domain }: MarketingClientProps) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const storeUrl = `https://${domain}/${store.slug}`
  
  const handleCopy = (text: string, id: string = 'main') => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleGenerateQR = async (url: string) => {
    const dataUrl = await generateQrWithLogo(url, store.name, { color: { dark: '#1A1A1A' } })
    setQrCodeData(dataUrl)
  }

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0)
  
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl">

      {/* SECTION : PRODUCTS SHORT LIST */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
              <ImageIcon size={18} className="text-gray-400" /> Vos Produits
            </h3>
          </div>
          <span className="bg-gray-50 text-gray-500 text-xs font-black px-3 py-1.5 rounded-lg">
            {products.length} Actifs
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {products.map(product => {
            const productUrl = `${storeUrl}?product=${product.id}`
            const shareText = `Découvrez ${product.name} sur ma boutique : ${productUrl}`
            
            return (
              <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-[#FAFAF7] transition-colors group">
                {/* Info Produit */}
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-inner ${product.type === 'physical' ? 'bg-[#0F7A60]/10 text-[#0F7A60]' : product.type === 'coaching' ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'bg-blue-100 text-blue-600'}`}>
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h4 className="font-bold text-[#1A1A1A] truncate text-sm">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.type}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="text-xs text-gray-500 font-medium">{(product.views || 0)} vues</span>
                    </div>
                  </div>
                </div>

                {/* Actions simplifiées */}
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleCopy(productUrl, product.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    {copied === product.id ? <Check size={14} className="text-emerald-500"/> : <Clipboard size={14}/>}
                    Copier le lien
                  </button>
                  
                  <a 
                    suppressHydrationWarning
                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                    title="Envoyer par WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </a>
                  
                  <button 
                    onClick={() => handleGenerateQR(productUrl)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-[#1A1A1A] hover:text-white transition-colors"
                    title="Voir le QR Code"
                  >
                    <QrCode size={16} />
                  </button>
                </div>
              </div>
            )
          })}
          
          {products.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 font-bold mb-1">Aucun produit actif.</p>
              <p className="text-xs text-gray-400">Ajoutez des produits pour voir leurs liens de partage ici.</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION : LINK PERFORMANCE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
            <BarChart3 size={18} className="text-gray-400" /> Trafic des liens courts
          </h3>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
            {totalClicks} clics totaux
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="group hover:bg-[#FAFAF7] transition-colors border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#1A1A1A] text-sm">{link.product?.name ?? 'Espace de vente global'}</p>
                    <p className="text-xs text-blue-500 font-mono mt-0.5 font-medium flex items-center gap-1">
                      yayyam.com/s/{link.code} 
                      <button onClick={() => handleCopy(`https://yayyam.com/s/${link.code}`, link.code)} className="text-gray-300 hover:text-[#1A1A1A] ml-2">
                         {copied === link.code ? <Check size={12}/> : <Clipboard size={12}/>}
                      </button>
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full w-[var(--bar-width)]" 
                          style={{ '--bar-width': `${Math.min(100, (link.clicks / (totalClicks || 1)) * 100)}%` } as React.CSSProperties}
                        />
                      </div>
                      <span className="text-sm font-black text-[#1A1A1A] w-6">{link.clicks}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {links.length === 0 && (
                 <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500 text-sm">Aucun clic enregistré pour l'instant.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL QR CODE */}
      {qrCodeData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
            <h3 className="text-xl font-black text-[#1A1A1A] mb-1">Votre Code QR</h3>
            <p className="text-gray-500 font-medium text-sm mb-6">Prêt à être scanné.</p>
            
            <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100 mb-6 w-full flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeData} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setQrCodeData(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
              <a 
                href={qrCodeData} 
                download={`QR_Code.png`}
                className="flex-1 bg-[#0F7A60] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#0D5C4A] transition-colors"
              >
                <Download size={16} /> Sauver
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
