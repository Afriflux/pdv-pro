'use client'

import { useState } from 'react'
import { Image as ImageIcon, Copy, Link as LinkIcon, Download, Search, Tag, CheckCircle2 } from 'lucide-react'
import { toast } from '@/lib/toast'

interface ProductResource {
  id: string
  name: string
  price: number
  images: string[]
  description: string | null
  affiliate_media_kit_url?: string | null
}

interface ResourcesClientProps {
  affiliateCode: string
  storeSlug: string
  products: ProductResource[]
  promoCodes?: Record<string, any>[]
}

export default function ResourcesClient({ affiliateCode, storeSlug, products, promoCodes = [] }: ResourcesClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [subId, setSubId] = useState('')

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const getAffiliateLink = (productId: string) => {
    // Le vrai domaine en prod serait dynamique, on utilise une base standard ici
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yayyam-sn.netlify.app'
    let link = `${baseUrl}/p/${storeSlug}/${productId}?ref=${affiliateCode}`
    if (subId.trim() !== '') {
      link += `&source=${encodeURIComponent(subId.trim())}`
    }
    return link
  }

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Lien affilié copié dans le presse-papier !')
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700">

      {/* 🎟️ CODES PROMO ASSIGNÉS */}
      {promoCodes && promoCodes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-black text-[#041D14] mb-4 flex items-center gap-2">
            <Tag size={20} className="text-emerald" /> Vos Codes Promo Privés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promoCodes.map((promo) => (
              <div key={promo.id} className="bg-gradient-to-br from-white to-gray-50 border border-emerald/20 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald/40 transition-all flex justify-between items-center group">
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald tracking-widest mb-1">
                    Réduction : {promo.type === 'percentage' ? `-${promo.value}%` : `-${promo.value} FCFA`}
                  </p>
                  <p className="font-mono text-xl font-black text-ink tracking-wider">{promo.code}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(promo.code)
                    toast.success('Code Promo copié !')
                  }}
                  className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-emerald hover:border-emerald/30 hover:bg-emerald/5 transition-all shadow-sm"
                  title="Copier le code"
                >
                  <Copy size={16} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 font-medium flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald" />  Toute vente utilisant ces codes vous sera automatiquement attribuée, même sans passage par votre lien !
          </p>
        </div>
      )}
      
      {/* 🌟 BARRE DE RECHERCHE */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-6 shadow-sm mb-8 flex items-center gap-4">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Rechercher un produit à promouvoir..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
           />
        </div>

        <div className="relative flex-1 max-w-xs hidden sm:block">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Tag size={16} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Tracking Source (ex: tiktok)" 
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            title="Ajoutez une source pour tracker d'où viennent vos ventes (utile pour les pubs)"
            className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
           />
        </div>
      </div>

      {/* 🌟 GRILLE DE PRODUITS */}
      {filtered.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-12 text-center flex flex-col items-center shadow-sm">
           <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-400 mb-6 border border-gray-100">
             <ImageIcon size={32} />
           </div>
           <h3 className="text-xl font-black text-gray-900 mb-2">Aucune ressource disponible</h3>
           <p className="text-gray-500 font-medium">Réessayez avec un autre mot clé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(product => {
            const affiliateLink = getAffiliateLink(product.id)
            const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'

            return (
              <div key={product.id} className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group flex flex-col">
                
                {/* Image Produit */}
                <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={mainImage} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[12px] font-bold text-white tracking-widest uppercase border border-white/20">
                      {product.price.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-[16px] font-black text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6 flex-1">
                    {product.description || "Aucune description fournie par le vendeur."}
                  </p>

                  <div className="space-y-3 mt-auto">
                    
                    {/* Lien Unique */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <LinkIcon size={14} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Votre lien unique</p>
                        <p className="text-[12px] font-medium text-slate-700 truncate">{affiliateLink}</p>
                      </div>
                      <button 
                        onClick={() => handleCopyLink(affiliateLink)}
                        aria-label="Copier le lien"
                        title="Copier le lien"
                        className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shrink-0"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    {/* Actions Médias */}
                    <div className="flex gap-2">
                       {product.affiliate_media_kit_url ? (
                         <button 
                           onClick={() => {
                             window.open(product.affiliate_media_kit_url!, '_blank', 'noopener,noreferrer')
                           }}
                           className="flex-1 bg-[#1A1A1A] text-white font-bold text-[13px] py-3.5 rounded-xl hover:bg-[#2D2D2D] transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5"
                         >
                           <Download size={16} /> Télécharger Kit Média
                         </button>
                       ) : (
                         <button 
                           onClick={() => {
                             window.open(mainImage, '_blank')
                             toast.success('Lien image ouvert.')
                           }}
                           className="flex-1 bg-white border border-gray-200 text-ink font-bold text-[13px] py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                         >
                           <ImageIcon size={16} className="text-gray-400" /> Sauvegarder l'image
                         </button>
                       )}
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
