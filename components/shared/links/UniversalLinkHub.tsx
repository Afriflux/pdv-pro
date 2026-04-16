'use client'

import { useState } from 'react'
import LinkAutoGenerator from './LinkAutoGenerator'
import BioLinkEditor from './BioLinkEditor'
import { Link2, Smartphone, Plus, Share2, Eye, MousePointerClick, ExternalLink, Copy } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Product {
  id: string
  name: string
  slug?: string
}

interface SalePage {
  id: string
  title: string
  slug: string
}

interface UniversalLinkHubProps {
  ownerType: 'vendor' | 'affiliate' | 'client'
  userId: string
  storeSlug: string
  affiliateCode?: string
  domain: string
  products: Product[]
  salePages: SalePage[]
  bioLinks?: any[]
  bioLinkQuota?: { allowed: boolean; currentCount: number; limit: number; isPremium: boolean }
  defaultThemeData?: any
}

export function UniversalLinkHub({
  ownerType,
  userId,
  storeSlug,
  affiliateCode,
  domain,
  products,
  salePages,
  bioLinks = [],
  bioLinkQuota = { allowed: true, currentCount: 0, limit: 1, isPremium: false },
  defaultThemeData
}: UniversalLinkHubProps) {
  const [activeTab, setActiveTab] = useState<'generator' | 'bio'>('generator')
  const [editingBioLink, setEditingBioLink] = useState<any | null>(null)

  return (
    <div className="w-full space-y-6">
      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'generator'
              ? 'bg-[#0F7A60] text-white shadow-md'
              : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-gray-50'
          }`}
        >
          <Link2 size={16} />
          Générateur Auto
        </button>
        <button
          onClick={() => setActiveTab('bio')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'bio'
              ? 'bg-[#0F7A60] text-white shadow-md'
              : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-gray-50'
          }`}
        >
          <Smartphone size={16} />
          Mon Link-in-Bio
        </button>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'generator' && (
          <LinkAutoGenerator 
            ownerType={ownerType}
            storeSlug={storeSlug}
            affiliateCode={affiliateCode}
            domain={domain}
            products={products}
            salePages={salePages}
          />
        )}
        {activeTab === 'bio' && (
          editingBioLink || (bioLinks.length === 0 && bioLinkQuota.allowed) ? (
            <BioLinkEditor 
              userId={userId} 
              initialBioLink={editingBioLink || (defaultThemeData ? { ...defaultThemeData, user_id: userId } : null)} 
              domain={domain}
              onBack={bioLinks.length > 0 ? () => setEditingBioLink(null) : undefined}
            />
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#1A1A1A]">Vos Link-in-Bio</h3>
                  <p className="text-sm font-medium text-gray-400 mt-1">
                    Gérez vos pages de liens personnalisés. 
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                      {bioLinks.length} / {bioLinkQuota.isPremium ? '∞' : bioLinkQuota.limit} utilisés
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (bioLinkQuota.allowed) {
                      setEditingBioLink(defaultThemeData ? { ...defaultThemeData, user_id: userId } : null)
                    } else {
                       toast.error("Vous avez atteint votre limite de pages Link-in-Bio.")
                    }
                  }}
                  disabled={!bioLinkQuota.allowed}
                  className="flex items-center gap-2 bg-[#0F7A60] hover:bg-[#0D5C4A] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-sm"
                >
                  <Plus size={16} /> Nouvelle Page
                </button>
              </div>

              {bioLinks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                  <Smartphone size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Vous n'avez pas encore créé de page Link-in-Bio.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bioLinks.map((link) => (
                    <div key={link.id} className="group relative flex flex-col bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-[#0F7A60]/30 hover:shadow-xl transition-all duration-300">
                      
                      <style>{`.bg-brand-hub-${link.id} { background-color: ${link.brand_color || '#0F7A60'} !important; }`}</style>
                      {/* En-tête colorée de la carte */}
                      <div 
                         className={`h-16 w-full bg-brand-hub-${link.id}`}
                      />

                      <div className="px-6 flex flex-col -mt-8 relative z-10 flex-1">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-md mb-3">
                          <div 
                            className={`w-full h-full rounded-xl flex items-center justify-center font-black text-white text-xl bg-brand-hub-${link.id}`}
                          >
                             {link.avatar_url ? (
                               <img src={link.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-xl" />
                             ) : (
                               (link.title || link.slug || '?').charAt(0).toUpperCase()
                             )}
                          </div>
                        </div>

                        {/* Textes */}
                        <div className="flex-1">
                          <h4 className="font-black text-[#1A1A1A] text-lg mb-0.5 truncate">{link.title || 'Mon profil'}</h4>
                          <a 
                            href={`https://${domain}/bio/${link.slug}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="group/link flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors py-1 w-max max-w-full"
                          >
                            <span className="truncate">{domain}/bio/{link.slug}</span>
                            <ExternalLink size={14} className="opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                          </a>
                        </div>
                        
                        {/* Statistiques rapides */}
                        <div className="flex items-center gap-4 mt-5 py-3 border-y border-gray-50">
                           <div className="flex items-center gap-1.5 text-gray-400">
                             <Eye size={14} />
                             <span className="text-xs font-bold">{link.views || 0}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-gray-400">
                             <MousePointerClick size={14} />
                             <span className="text-xs font-bold">{link.clicks || 0}</span>
                           </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4 pb-6">
                          <button 
                            onClick={() => setEditingBioLink(link)} 
                            className="flex-1 bg-[#FAFAF7] border border-gray-100 hover:border-[#0F7A60] hover:bg-[#0F7A60]/5 hover:text-[#0F7A60] text-gray-700 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                          >
                            Éditer la page
                          </button>
                          
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`https://${domain}/bio/${link.slug}`)
                                toast.success("Lien copié dans le presse-papiers !")
                              }} 
                              title="Copier le lien" 
                              className="p-2.5 bg-[#FAFAF7] border border-gray-100 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors active:scale-95"
                            >
                              <Copy size={18} />
                            </button>
                            
                            {typeof navigator !== 'undefined' && navigator.share && (
                              <button 
                                onClick={async () => {
                                  try {
                                    await navigator.share({
                                      title: link.title || 'Mon profil',
                                      url: `https://${domain}/bio/${link.slug}`
                                    })
                                  } catch (e) {
                                    console.log('Share canceled', e)
                                  }
                                }} 
                                title="Partager" 
                                className="p-2.5 bg-[#FAFAF7] border border-gray-100 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors active:scale-95"
                              >
                                <Share2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
