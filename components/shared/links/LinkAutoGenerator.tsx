/* eslint-disable react/forbid-dom-props, jsx-a11y/control-has-associated-label, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, jsx-a11y/anchor-is-valid */
'use client'

import { useState, useEffect } from 'react'
import { Link2, CheckCircle2, AlertCircle, QrCode, Download, Search } from 'lucide-react'
import QRCode from 'qrcode'

interface LinkAutoGeneratorProps {
  ownerType: 'vendor' | 'affiliate' | 'client'
  storeSlug: string
  affiliateCode?: string
  domain: string
  products: any[]
  salePages: any[]
}

export default function LinkAutoGenerator({
  ownerType,
  storeSlug,
  affiliateCode,
  domain,
  products,
  salePages
}: LinkAutoGeneratorProps) {
  const [targetUrl, setTargetUrl] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState('')

  // Combined list for dropdown
  const shareableItems = [
    ...products.map(p => ({ ...p, _type: 'product' as const })),
    ...salePages.map(s => ({ ...s, _type: 'page' as const }))
  ]

  const constructUrl = (item: any) => {
    const baseUrl = `https://${domain}`
    let path = ''
    if (item._type === 'product') {
      // Typically products are /p/[id]
      path = `/p/${item.id}`
    } else {
      path = `/${storeSlug}/${item.slug}`
    }
    return `${baseUrl}${path}`
  }

  const handleSelectPredefined = (item: any) => {
    const url = constructUrl(item)
    setTargetUrl(url)
  }

  const handleGenerate = async () => {
    setError('')
    if (!targetUrl.trim()) {
      setError('Veuillez entrer ou sélectionner une URL valide.')
      setGeneratedLink('')
      setQrDataUrl('')
      return
    }

    try {
      let cleanUrl = targetUrl
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`
      }
      const urlObj = new URL(cleanUrl)

      // Add ref code if affiliate
      if (ownerType === 'affiliate' && affiliateCode) {
        urlObj.searchParams.set('ref', affiliateCode)
      } else if (ownerType === 'vendor') {
        // Vendors might want UTMs
        urlObj.searchParams.set('utm_source', 'vendor_dashboard')
      }

      const finalUrl = urlObj.toString()
      setGeneratedLink(finalUrl)

      try {
        const qrBase64 = await QRCode.toDataURL(finalUrl, { 
          width: 400, 
          margin: 2, 
          color: { dark: '#052e22', light: '#ffffff' } 
        })
        setQrDataUrl(qrBase64)
      } catch (qrError) {
        console.error('Erreur QR Code', qrError)
      }
    } catch {
      setError('Format d\'URL invalide.')
      setGeneratedLink('')
      setQrDataUrl('')
    }
  }

  // Auto-generate if targetUrl gets set by selection
  useEffect(() => {
    if (targetUrl) {
      handleGenerate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUrl])

  const handleCopy = () => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  const downloadQR = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `QR_Code_${storeSlug}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden p-6 sm:p-8">
      <div className="max-w-2xl">
        <div className="mb-6">
          <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Outil Générateur Rapide
          </label>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Sélectionnez directement une page/produit ou collez n'importe quelle URL de la boutique.
          </p>

          {/* Sélecteur Auto */}
          <div className="mb-4">
            <div className="relative">
              <select
                title="Sélecteur d'élément depuis le catalogue"
                aria-label="Catalogue"
                onChange={(e) => {
                  if (e.target.value === '') return
                  const item = shareableItems.find(i => i.id === e.target.value)
                  if(item) handleSelectPredefined(item)
                }}
                className="w-full appearance-none pl-12 pr-10 py-4 bg-[#FAFAF7] border border-gray-200 rounded-2xl text-[#1A1A1A] font-bold focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60]/30 transition-all outline-none"
              >
                <option value="">Sélectionner depuis le catalogue...</option>
                <optgroup label="Produits">
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Pages de vente">
                  {salePages.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <hr className="flex-1 border-gray-100" />
            <span className="text-xs font-bold text-gray-300 uppercase">ou coller</span>
            <hr className="flex-1 border-gray-100" />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Link2 className="h-5 w-5 text-gray-400" />
            </div>
            <input
              title="URL Cible"
              aria-label="URL Cible"
              type="url"
              className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-[#1A1A1A] font-medium focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60]/30 transition-all outline-none"
              placeholder={`ex: https://${domain}/${storeSlug}`}
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          {error && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1 font-medium">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!targetUrl.trim()}
          className="bg-[#0F7A60] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#0B5C48] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {ownerType === 'affiliate' ? 'Générer mon lien affilié' : 'Générer le lien court'}
        </button>

        {generatedLink && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 border-t border-gray-100 pt-8 space-y-8">
            <div>
              <label className="block text-[13px] font-black text-[#1A1A1A] mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0F7A60]/10 text-[#0F7A60] flex items-center justify-center">
                  <CheckCircle2 size={12} />
                </span>
                Lien généré (Action Rapide)
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3 bg-gradient-to-r from-[#FAFAF7] to-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1 flex items-center px-4 font-bold text-sm text-[#1A1A1A] overflow-hidden">
                  <span className="truncate">{generatedLink}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-md whitespace-nowrap active:scale-95"
                >
                  {copying ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            {qrDataUrl && (
              <div className="bg-[#FAFAF7] rounded-[24px] border border-gray-100 overflow-hidden relative group">
                 <div className="absolute top-0 right-0 p-4 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-3xl z-0 w-32 h-32 blur-xl"></div>
                 <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 relative z-10">
                   <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 shrink-0 group-hover:shadow-md transition-shadow">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 object-contain rounded-xl" />
                   </div>
                   <div className="text-center sm:text-left flex-1">
                     <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                       <QrCode className="text-[#0F7A60] w-5 h-5" />
                       <h4 className="font-display font-black text-[#1A1A1A] text-lg">QR Code Partage</h4>
                     </div>
                     <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                       Parfait pour des visuels sur les réseaux sociaux.
                     </p>
                     <button 
                       onClick={downloadQR}
                       className="border-2 border-gray-200 text-[#1A1A1A] hover:bg-[#FAFAF7] hover:border-[#1A1A1A] px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 mx-auto sm:mx-0 text-sm active:scale-95"
                     >
                       <Download size={16} />
                       Télécharger (PNG)
                     </button>
                   </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
