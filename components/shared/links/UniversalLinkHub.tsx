'use client'

import { useState } from 'react'
import { Link2, Smartphone } from 'lucide-react'
import LinkAutoGenerator from './LinkAutoGenerator'
import BioLinkEditor from './BioLinkEditor'

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
  initialBioLink?: any
}

export function UniversalLinkHub({
  ownerType,
  userId,
  storeSlug,
  affiliateCode,
  domain,
  products,
  salePages,
  initialBioLink
}: UniversalLinkHubProps) {
  const [activeTab, setActiveTab] = useState<'generator' | 'bio'>('generator')

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
          <BioLinkEditor 
            userId={userId} 
            initialBioLink={initialBioLink} 
            domain={domain} 
          />
        )}
      </div>
    </div>
  )
}
