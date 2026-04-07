'use client'

import { useState } from 'react'
import { Link2, CheckCircle2, AlertCircle, QrCode, Download } from 'lucide-react'
import QRCode from 'qrcode'

export default function LinkGeneratorClient({ storeSlug, affiliateCode }: { storeSlug: string, affiliateCode: string }) {
  const [targetUrl, setTargetUrl] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setError('')
    if (!targetUrl.trim()) {
      setError('Veuillez entrer une URL valide.')
      setGeneratedLink('')
      setQrDataUrl('')
      return
    }

    try {
      // Validate it's a real URL
      let cleanUrl = targetUrl
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`
      }
      const urlObj = new URL(cleanUrl)
      
      // Ensure it points to the correct store (Optional but good practice)
      if (!urlObj.hostname.includes(storeSlug) && !urlObj.hostname.includes('yayyam.sn')) {
        // Just a warning, not a hard block if they have custom domain
      }

      // Append ref parameter
      urlObj.searchParams.set('ref', affiliateCode)
      const finalUrl = urlObj.toString()
      setGeneratedLink(finalUrl)

      // Generate QR Code
      try {
        const qrBase64 = await QRCode.toDataURL(finalUrl, { 
          width: 400, 
          margin: 2, 
          color: { 
            dark: '#052e22', // emerald-deep
            light: '#ffffff' 
          } 
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
          <label htmlFor="url-input" className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Lien de la page à promouvoir
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Link2 className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="url-input"
              type="url"
              className="block w-full pl-12 pr-4 py-4 bg-[#FAFAF7] border border-gray-100 rounded-2xl text-[#1A1A1A] font-bold focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60]/30 transition-all outline-none shadow-sm"
              placeholder={`ex: https://${storeSlug || 'boutique'}.yayyam.sn/p/mon-produit`}
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
          Générer mon lien affilié
        </button>

        {generatedLink && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 border-t border-gray-100 pt-8 space-y-8">
            {/* L'URL textuelle */}
            <div>
              <label className="block text-[13px] font-black text-[#1A1A1A] mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0F7A60]/10 text-[#0F7A60] flex items-center justify-center">
                  <CheckCircle2 size={12} />
                </span>
                Votre lien personnalisé (Action Rapide)
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3 bg-gradient-to-r from-[#FAFAF7] to-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1 flex items-center px-4 font-bold text-sm text-[#1A1A1A] overflow-hidden">
                  <span className="truncate">{generatedLink}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-md whitespace-nowrap active:scale-95"
                >
                  {copying ? (
                    'Copié !'
                  ) : (
                    'Copier'
                  )}
                </button>
              </div>
              <p className="mt-4 text-xs font-medium text-gray-500 leading-relaxed max-w-xl">
                Collez et partagez ce lien sur vos réseaux sociaux (WhatsApp, Instagram, TikTok...). Toute vente générée vous sera automatiquement créditée.
              </p>
            </div>

            {/* Le QR Code Graphique */}
            {qrDataUrl && (
              <div className="bg-[#FAFAF7] rounded-[24px] border border-gray-100 overflow-hidden relative group">
                 <div className="absolute top-0 right-0 p-4 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-3xl z-0 w-32 h-32 blur-xl"></div>
                 <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 relative z-10">
                   <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 shrink-0 group-hover:shadow-md transition-shadow">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={qrDataUrl} alt="QR Code Affilié" className="w-32 h-32 object-contain rounded-xl" />
                   </div>
                   <div className="text-center sm:text-left flex-1">
                     <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                       <QrCode className="text-[#0F7A60] w-5 h-5" />
                       <h4 className="font-display font-black text-[#1A1A1A] text-lg">Distribution Physique</h4>
                     </div>
                     <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                       Idéal pour la prospection sur le terrain. Imprimez ce QR code sur des supports physiques (flyers, cartes) ou présentez-le directement depuis votre téléphone.
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
