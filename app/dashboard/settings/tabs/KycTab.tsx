/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import * as Actions from '@/app/actions/settings'
import { toast } from '@/lib/toast'
import { CheckCircle2, XCircle, Clock, FileText, ShieldCheck, Loader2, FileBadge, UserCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isPassport = kycDocType === 'passport'
  const totalSteps = isPassport ? 3 : 4 
  // Passport steps: 1(DocType), 2(PagePrincipale), 3(Selfie)
  // Others: 1(DocType), 2(Recto), 3(Verso), 4(Selfie)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setterFile: any, setterPreview: any) => {
    const file = e.target.files?.[0]
    if (file) {
      setterFile(file)
      setterPreview(URL.createObjectURL(file))
      // Optionnel : auto-next si on a uploadé
      setTimeout(() => {
        if (currentStep < totalSteps) setCurrentStep(c => c + 1)
      }, 800)
    }
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const onSubmit = async (e?: React.FormEvent) => {
    if(e) e.preventDefault()
    
    if (isPassport) {
      if (!rectoFile && !rectoPreview) { toast.error('La page avec vos informations est requise'); return; }
      if (!selfieFile && !selfiePreview) { toast.error('Votre selfie est requis'); return; }
    } else {
      if (!rectoFile && !rectoPreview) { toast.error('La face avant (Recto) est requise'); return; }
      if (!versoFile && !versoPreview) { toast.error('La face arrière (Verso) est requise'); return; }
      if (!selfieFile && !selfiePreview) { toast.error('Votre selfie est requis'); return; }
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
      setCurrentStep(1)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  const renderStatusBanner = () => {
    if (kycStatus === 'verified') return (
       // existing verified banner
       <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-[2px] rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.2)] mb-10 overflow-hidden relative group">
         <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
         <div className="bg-emerald-950/40 backdrop-blur-md rounded-[15px] p-6 lg:p-8 flex items-center gap-5 relative z-10 border border-emerald-400/30">
           <div className="w-14 h-14 bg-emerald-400 rounded-[1.2rem] flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform">
             <CheckCircle2 size={32} className="text-emerald-950" />
           </div>
           <div>
             <p className="font-black text-white text-xl tracking-tight mb-1">Identité Vérifiée Officiellement</p>
             <p className="text-emerald-100/90 font-medium">Votre compte est totalement débloqué. Vous pouvez recevoir vos reversements sans aucune limite.</p>
           </div>
         </div>
       </div>
    )
    if (kycStatus === 'pending') return (
       // existing pending
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
       // existing rejected
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

  // Wizard Navigation
  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(c => c + 1)
    else onSubmit()
  }
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1)
  }

  const stepVariants: any = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -50 }
  }

  return (
    <div className={`animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3 ${!isFormActive ? 'opacity-90' : ''}`}>
      
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER TRUST === */}
        <div className="h-40 sm:h-56 w-full relative bg-[#022C22] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#0F766E] opacity-90"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[12000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full min-h-[500px]">
          
          <div className="relative -mt-16 sm:-mt-20 mb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 transition-transform duration-500">
              <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center relative border border-teal-100">
                <FileBadge size={48} strokeWidth={1} className="text-teal-600 relative z-10" />
              </div>
            </div>
          </div>
            
          <div className="pb-8 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              Vérification d'Identité
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[14px] text-gray-500 font-medium">Processus sécurisé de niveau bancaire. Données chiffrées selon les normes KYC.</span>
            </div>
          </div>

          {renderStatusBanner()}

          {/* Formulaire Multi-Steps si non vérifié ou rejeté */}
          {isFormActive && (
            <div className="relative">
              {/* Stepper Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-xs font-black text-teal-600 uppercase tracking-widest">Étape {currentStep} sur {totalSteps}</p>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Wizard Content */}
              <div className="min-h-[300px] relative">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: DOC TYPE */}
                  {currentStep === 1 && (
                    <motion.div key="step-1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                      <div className="text-center sm:text-left mb-6">
                        <h3 className="text-xl font-black text-gray-900 mb-2">Quel type de document possédez-vous ?</h3>
                        <p className="text-sm text-gray-500">Celui-ci servira à identifier légalement votre entreprise ou votre personne physique.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'cni', label: 'Carte d\'Identité Nationale', icon: <FileText size={24} /> },
                          { id: 'passport', label: 'Passeport', icon: <UserCircle2 size={24} /> },
                          { id: 'permis', label: 'Permis de conduire', icon: <FileBadge size={24} /> },
                        ].map((doc) => (
                          <button
                            type="button"
                            key={doc.id}
                            onClick={() => {
                              setKycDocType(doc.id as any)
                              setCurrentStep(2) // Auto-next
                            }}
                            className={`p-6 rounded-[1.5rem] border-2 text-left transition-all duration-300 flex flex-col gap-4 ${
                              kycDocType === doc.id 
                              ? 'bg-teal-50/50 border-teal-500 shadow-[0_4px_20px_rgb(20,184,166,0.15)] ring-4 ring-teal-500/10' 
                              : 'bg-white border-gray-100 hover:border-teal-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${kycDocType === doc.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              {doc.icon}
                            </div>
                            <div>
                               <p className={`font-black text-lg ${kycDocType === doc.id ? 'text-teal-950' : 'text-gray-900'}`}>{doc.label}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: RECTO / MAIN PAGE */}
                  {currentStep === 2 && (
                    <motion.div key="step-2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                      <div className="text-center sm:text-left mb-6">
                        <h3 className="text-xl font-black text-gray-900 mb-2">{isPassport ? 'Page Principale du Passeport' : 'Face Avant de la Pièce (Recto)'}</h3>
                        <p className="text-sm text-gray-500">Capturez bien tous les coins de la carte. Évitez les reflets (ni flash ni lumière directe aveuglante).</p>
                      </div>

                      <div className="max-w-lg mx-auto sm:mx-0">
                        <DocUploadFieldPremium 
                          label={isPassport ? 'Page Passeport' : 'Recto'} 
                          preview={rectoPreview} 
                          setFile={(f: any) => handleFileChange(f, setRectoFile, setRectoPreview)} 
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: VERSO (only if NOT passport) OR SELFIE if passport */}
                  {currentStep === 3 && (
                    <motion.div key="step-3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                      {!isPassport ? (
                         <>
                          <div className="text-center sm:text-left mb-6">
                            <h3 className="text-xl font-black text-gray-900 mb-2">Face Arrière de la Pièce (Verso)</h3>
                            <p className="text-sm text-gray-500">Retournez le document. Assurez-vous que l'image soit bien nette.</p>
                          </div>
                          <div className="max-w-lg mx-auto sm:mx-0">
                            <DocUploadFieldPremium 
                              label="Verso" 
                              preview={versoPreview} 
                              setFile={(f: any) => handleFileChange(f, setVersoFile, setVersoPreview)} 
                            />
                          </div>
                         </>
                      ) : (
                         <>
                          <div className="text-center sm:text-left mb-6">
                            <h3 className="text-xl font-black text-gray-900 mb-2">Vérification Faciale (Selfie)</h3>
                            <p className="text-sm text-gray-500">Prenez un selfie clair où vous tenez votre passeport à côté de votre visage.</p>
                          </div>
                          <div className="max-w-lg mx-auto sm:mx-0">
                            <DocUploadFieldPremium 
                              label="Selfie Maintien"
                              subtitle=""
                              preview={selfiePreview} 
                              setFile={(f: any) => handleFileChange(f, setSelfieFile, setSelfiePreview)} 
                              isSelfie={true}
                            />
                          </div>
                         </>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 4: SELFIE (only if NOT passport) */}
                  {currentStep === 4 && !isPassport && (
                    <motion.div key="step-4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                      <div className="text-center sm:text-left mb-6">
                        <h3 className="text-xl font-black text-gray-900 mb-2">Vérification Faciale (Selfie)</h3>
                        <p className="text-sm text-gray-500">Prenez un selfie clair de vous tenant votre pièce d'identité visible près de votre visage.</p>
                      </div>

                      <div className="max-w-lg mx-auto sm:mx-0">
                        <DocUploadFieldPremium 
                          label="Selfie avec document"
                          subtitle=""
                          preview={selfiePreview} 
                          setFile={(f: any) => handleFileChange(f, setSelfieFile, setSelfiePreview)} 
                          isSelfie={true}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wizard Nav Buttons */}
              <div className="mt-12 flex justify-between items-center border-t border-gray-100 pt-6">
                <button 
                  type="button" 
                  onClick={handlePrev}
                  disabled={currentStep === 1 || loading}
                  className="px-6 py-3 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors disabled:opacity-0 flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Précédent
                </button>
                
                <button 
                  type="button" 
                  onClick={handleNext}
                  disabled={loading || (currentStep === 2 && !rectoFile && !rectoPreview) || (currentStep === 3 && !isPassport && !versoFile && !versoPreview)}
                  className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-[15px] shadow-lg shadow-gray-900/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> Traitement</>
                  ) : currentStep === totalSteps ? (
                    <><ShieldCheck size={18} /> Soumettre</>
                  ) : (
                    <>Suivant <ArrowRight size={16} /></>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
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
            <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={preview} alt={label} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-teal-500 transition-colors px-6 text-center gap-3">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isSelfie ? 'bg-emerald-100/50 text-emerald-500' : 'bg-teal-100/50 text-teal-500'}`}>
                 {isSelfie ? <UserCircle2 size={28} /> : <FileText size={28} />}
               </div>
               <div>
                  <span className="text-[13px] font-bold block mb-1">Cliquer pour uploader</span>
                  <span className="text-xs font-medium opacity-70">Glissez-déposez la photo ici.</span>
               </div>
            </div>
          )}
          
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
