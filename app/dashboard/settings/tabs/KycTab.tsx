/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import * as Actions from '@/app/actions/settings'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Clock, UploadCloud, FileText, Image as ImageIcon, ShieldCheck, Loader2, FileBadge, UserCircle2 } from 'lucide-react'

export function KycTab({ store }: { store: any }) {
  const kycStatus = store?.kyc_status || 'unverified'
  const [kycDocType, setKycDocType] = useState<'cni' | 'passport' | 'permis'>((store?.kyc_document_type as 'cni' | 'passport' | 'permis') || 'cni')
  
  const docs = (store?.kyc_documents as Record<string, string>) || {}
  const [rectoPreview, setRectoPreview] = useState<string | null>(docs?.recto || null)
  const [rectoFile, setRectoFile] = useState<File | null>(null)
  const [versoPreview, setVersoPreview] = useState<string | null>(docs?.verso || null)
  const [versoFile, setVersoFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(docs?.selfie || null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setterFile: any, setterPreview: any) => {
    const file = e.target.files?.[0]
    if (file) {
      setterFile(file)
      setterPreview(URL.createObjectURL(file))
    }
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isPassport = kycDocType === 'passport'
    if (isPassport) {
      if (!rectoFile && !rectoPreview) return toast.error('La page avec vos informations est requise')
      if (!selfieFile && !selfiePreview) return toast.error('Votre selfie est requis')
    } else {
      if (!rectoFile && !rectoPreview) return toast.error('La face avant (Recto) est requise')
      if (!versoFile && !versoPreview) return toast.error('La face arrière (Verso) est requise')
      if (!selfieFile && !selfiePreview) return toast.error('Votre selfie est requis')
    }

    setLoading(true)
    try {
      const docsObj: Record<string, string | null> = {}
      
      const up = async (file: File | null, label: string) => {
        if (!file || !store?.id) return null
        const ext = file.name.split('.').pop()
        return await uploadFile(file, 'kyc', `${store.id}/${label}_${Date.now()}.${ext}`)
      }

      const [r, v, s] = await Promise.all([
        up(rectoFile, 'recto'),
        up(versoFile, 'verso'),
        up(selfieFile, 'selfie')
      ])

      docsObj.recto = r || rectoPreview
      docsObj.verso = v || versoPreview
      docsObj.selfie = s || selfiePreview

      await Actions.updateKYC({ 
        documentType: kycDocType,
        kycDocuments: docsObj,
        idCardUrl: docsObj.recto
      })

      toast.success('Vos documents ont été envoyés pour vérification')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  const renderStatusBanner = () => {
    if (kycStatus === 'verified') return (
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-[2px] rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.2)] mb-10 overflow-hidden relative group">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="bg-emerald-950/40 backdrop-blur-md rounded-[15px] p-6 lg:p-8 flex items-center justify-between relative z-10 border border-emerald-400/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-400 rounded-[1.2rem] flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={32} className="text-emerald-950" />
            </div>
            <div>
              <p className="font-black text-white text-xl tracking-tight mb-1">Identité Vérifiée Officiellement</p>
              <p className="text-emerald-100/90 font-medium">Votre compte est totalement débloqué. Vous pouvez recevoir vos reversements sans aucune limite.</p>
            </div>
          </div>
        </div>
      </div>
    )
    if (kycStatus === 'pending') return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-[2px] rounded-2xl shadow-[0_8px_30px_rgb(245,158,11,0.2)] mb-10 overflow-hidden relative group">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        <div className="bg-amber-950/40 backdrop-blur-md rounded-[15px] p-6 lg:p-8 flex items-center gap-5 relative z-10 border border-amber-400/30">
          <div className="w-14 h-14 bg-amber-400 rounded-[1.2rem] flex items-center justify-center shadow-inner shrink-0 animate-pulse">
            <Clock size={32} className="text-amber-950" />
          </div>
          <div>
            <p className="font-black text-white text-xl tracking-tight mb-1">Vérification Manuelle en Cours</p>
            <p className="text-amber-100/90 font-medium">Nos équipes examinent vos documents (délai de traitement estimé : 24 à 48h ouvrées).</p>
          </div>
        </div>
      </div>
    )
    if (kycStatus === 'rejected') return (
      <div className="bg-gradient-to-r from-red-500 to-rose-600 p-[2px] rounded-2xl shadow-[0_8px_30px_rgb(239,68,68,0.2)] mb-10 overflow-hidden relative group">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        <div className="bg-red-950/40 backdrop-blur-md rounded-[15px] p-6 lg:p-8 flex items-center gap-5 relative z-10 border border-red-400/30">
          <div className="w-14 h-14 bg-red-400 rounded-[1.2rem] flex items-center justify-center shadow-inner shrink-0 group-hover:rotate-12 transition-transform">
            <XCircle size={32} className="text-red-950" />
          </div>
          <div>
            <p className="font-black text-white text-xl tracking-tight mb-1">Documents Rejetés</p>
            <p className="text-red-100/90 font-medium">Les documents fournis n'ont pas pu être validés. Raisons possibles : flou, incomplet ou reflets. Veuillez les soumettre à nouveau ci-dessous.</p>
          </div>
        </div>
      </div>
    )
    return null
  }

  const isFormActive = kycStatus === 'unverified' || kycStatus === 'rejected';

  return (
    <form onSubmit={onSubmit} className={`animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3 ${!isFormActive ? 'opacity-90' : ''}`}>
      
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER TRUST (Gradients Indigo/Violet Profonds) === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#022C22] overflow-hidden">
          {/* Gradients Héroïques */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#0F766E] opacity-90"></div>
          
          {/* Motifs géométriques */}
          <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[12000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>

          {/* Top Actions flottantes */}
          {isFormActive && (
            <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(20,184,166,0.2)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                Soumettre le dossier
              </button>
            </div>
          )}
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center relative border border-teal-100">
                  <div className="absolute inset-0 bg-teal-500/5 animate-pulse duration-1000"></div>
                  <FileBadge size={56} strokeWidth={1} className="text-teal-600 group-hover:scale-110 transition-transform duration-700 relative z-10" />
                </div>
              </div>
            </div>

            {/* Banner Explicatif Warning (Uniquement si unverified) */}
            {kycStatus === 'unverified' && (
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-5 sm:p-6 text-sm rounded-2xl border border-teal-200/50 shadow-inner flex items-start gap-4 max-w-lg mb-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-500 to-emerald-400"></div>
                <div className="p-3 bg-white rounded-xl shadow-[0_4px_10px_rgb(20,184,166,0.1)] text-teal-600 shrink-0 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="font-black text-teal-950 text-[15px] mb-1">Obligation Légale Anti-Blanchiment</p>
                  <p className="text-teal-800/80 font-medium leading-relaxed">
                    Afin d'autoriser les versements, la présentation d'une pièce d'identité en cours de validité (CNI, Passeport, ou Permis de conduire) est obligatoire.
                  </p>
                </div>
              </div>
            )}
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-10 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              Identité & Conformité (KYC)
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 font-bold text-[12px] rounded-full border border-teal-100 uppercase tracking-wide">
                <UserCircle2 size={14} /> Account Trust Level
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Débloquez l'intégralité des fonctionnalités financières de votre compte.</span>
            </div>
          </div>

          {/* Rendering the Banner if Verified/Pending/Rejected */}
          {renderStatusBanner()}

          {/* Formulaire si non vérifié ou rejeté */}
          {isFormActive && (
            <div className="flex flex-col gap-10">
              
              {/* Type de Document (Toggle Premium) */}
              <div>
                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-4 block">1. Pièce d'identité fournie</label>
                <div className="bg-white/60 backdrop-blur-md p-2 rounded-[1.2rem] border border-gray-200/80 inline-flex flex-wrap sm:flex-nowrap gap-2">
                  {[
                    { id: 'cni', label: 'Carte d\'Identité (CNI)' },
                    { id: 'passport', label: 'Passeport' },
                    { id: 'permis', label: 'Permis de conduire' },
                  ].map((doc) => (
                    <button
                      type="button"
                      key={doc.id}
                      onClick={() => setKycDocType(doc.id as any)}
                      className={`px-6 py-3 rounded-[1rem] text-[14px] font-bold transition-all duration-300 ${
                        kycDocType === doc.id 
                        ? 'bg-teal-600 text-white shadow-[0_4px_15px_rgb(79,70,229,0.3)]' 
                        : 'bg-transparent text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      {doc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Fields (Glassmorphism Cards) */}
              <div>
                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-4 block">2. Téléversez les photos (Photos claires et lisibles)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Recto */}
                  <DocUploadFieldPremium 
                    label={kycDocType === 'passport' ? 'Page principale (Passeport)' : 'Face Avant (Recto)'} 
                    preview={rectoPreview} 
                    setFile={(f: any) => handleFileChange(f, setRectoFile, setRectoPreview)} 
                  />

                  {/* Verso (Sauf passeport) */}
                  {kycDocType !== 'passport' && (
                    <DocUploadFieldPremium 
                      label="Face Arrière (Verso)" 
                      preview={versoPreview} 
                      setFile={(f: any) => handleFileChange(f, setVersoFile, setVersoPreview)} 
                    />
                  )}

                  {/* Selfie */}
                  <DocUploadFieldPremium 
                    label="Selfie avec la pièce"
                    subtitle="Tenue bien en vue à côté de votre visage"
                    preview={selfiePreview} 
                    setFile={(f: any) => handleFileChange(f, setSelfieFile, setSelfiePreview)} 
                    isSelfie={true}
                  />

                </div>
              </div>

              {/* Info Formats */}
              <div className="bg-gray-50 border border-gray-200/60 rounded-xl p-4 flex items-center justify-center gap-2 mt-4 text-xs font-medium text-gray-500">
                <ImageIcon size={16} /> <span>Formats acceptés : JPG, PNG, WEBP. Taille Maximale : 5MB par fichier. Ne pas recadrer les documents.</span>
              </div>

                  {/* Bouton de sauvegarde inférieur */}
                  <div className="mt-8 flex justify-end border-t border-gray-200/50 pt-8">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      Soumettre la vérification
                    </button>
                  </div>

            </div>
          )}

        </div>
      </div>
    </form>
  )
}

function DocUploadFieldPremium({ label, subtitle, preview, setFile, isSelfie = false }: any) {
  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 rounded-[1.8rem] blur opacity-0 group-hover:opacity-20 transition duration-500 ${isSelfie ? 'bg-emerald-500' : 'bg-teal-500'}`}></div>
      <div className="relative bg-white/60 backdrop-blur-md rounded-[1.5rem] border border-gray-200/80 p-2 overflow-hidden h-64 sm:h-72 flex flex-col transition-all cursor-pointer">
        <label className="text-[14px] font-black text-gray-900 tracking-tight mb-0.5 px-4 pt-4 block pointer-events-none">
          {label}
        </label>
        {subtitle && (
          <p className="text-[12px] text-gray-500 px-4 mb-4 pointer-events-none">{subtitle}</p>
        )}
        {!subtitle && <div className="h-4"></div>}
        
        <div className="flex-1 bg-gray-50/50 border-2 border-dashed border-gray-300 rounded-[1rem] overflow-hidden group-hover:bg-teal-50/50 group-hover:border-teal-300 transition-colors relative flex items-center justify-center m-2">
          {preview ? (
            <Image src={preview} alt={label} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-teal-500 transition-colors px-6 text-center gap-3">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isSelfie ? 'bg-emerald-100/50 text-emerald-500' : 'bg-teal-100/50 text-teal-500'}`}>
                 {isSelfie ? <UserCircle2 size={28} /> : <FileText size={28} />}
               </div>
               <div>
                  <span className="text-[13px] font-bold block mb-1">Cliquer pour uploader</span>
                  <span className="text-[11px] font-medium opacity-70">Glissez-déposez ou parcourez.</span>
               </div>
            </div>
          )}
          
          {/* Couche d'interaction globale */}
          <input 
            type="file" 
            title="Upload document"
            aria-label="Upload document"
            accept="image/jpeg, image/png, image/webp" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            onChange={setFile} 
          />
        </div>
      </div>
    </div>
  )
}
