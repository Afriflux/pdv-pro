'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle, UploadCloud, FileCheck } from 'lucide-react'

interface KycTabProps {
  userProfile: any
}

export function KycTab({ userProfile }: KycTabProps) {
  const router = useRouter()

  // KYC State
  const [kycStatus, setKycStatus] = useState<string>(userProfile?.kyc_status ?? 'unverified')
  const [kycDocType, setKycDocType] = useState<string>(userProfile?.kyc_document_type ?? 'cni')
  const [kycFile, setKycFile] = useState<File | null>(null)
  const [kycLoading, setKycLoading] = useState(false)

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kycFile && kycStatus !== 'submitted') { toast.error('Veuillez sélectionner un document.'); return; }
    
    setKycLoading(true)
    try {
      let b64 = ''
      if (kycFile) {
        const reader = new FileReader()
        b64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(kycFile)
        })
      }

      const res = await fetch('/api/portal/kyc', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          documentType: kycDocType,
          newDocs: { file: b64, name: kycFile?.name }
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Documents soumis pour vérification !')
        setKycStatus('submitted')
        router.refresh()
      } else {
        throw new Error(data.error ?? 'Erreur lors de la soumission')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur interne')
    } finally {
      setKycLoading(false)
    }
  }

  return (
    <>
      <div className="col-span-1 lg:col-span-2">
         <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Conformité Financière</h2>
         <p className="text-gray-500 font-medium">Validation de l'identité obligatoire pour l'activation des retraits.</p>
      </div>

      <div className="bg-white/60 border border-gray-200/80 rounded-[2rem] p-6 sm:p-8 backdrop-blur-sm shadow-sm relative overflow-hidden lg:col-span-2">
         <div className="flex flex-col lg:flex-row gap-8 items-start">
           <div className="flex-1">
             <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
               <ShieldCheck className={kycStatus === 'verified' ? "text-emerald-500" : "text-amber-500"} /> 
               Vérification d'Identité (KYC)
             </h3>
             <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
               Conformément à la réglementation financière en vigueur, vous devez vérifier votre identité avant de pouvoir initier des retraits de vos commissions d'affiliation.
             </p>

             {kycStatus === 'verified' ? (
               <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm">
                 <CheckCircle2 size={18} /> Identité Vérifiée
               </div>
             ) : kycStatus === 'submitted' ? (
               <div className="mt-6 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm">
                 <Loader2 size={18} className="animate-spin" /> Vérification en cours (24-48h)
               </div>
             ) : (
               <form onSubmit={handleKycSubmit} className="mt-6 space-y-5 max-w-lg">
                 <div className="flex items-center gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-xs font-bold border border-red-100 shadow-sm">
                   <AlertTriangle size={18} className="shrink-0" />
                   Retraits bloqués. Veuillez soumettre une pièce d'identité valide.
                 </div>
                 
                 <div className="space-y-4">
                   <div>
                     <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Type de Document</label>
                     <select 
                       title="Type de document"
                       value={kycDocType}
                       onChange={(e) => setKycDocType(e.target.value)}
                       className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/20 font-bold text-gray-800 outline-none"
                     >
                       <option value="cni">Carte Nationale d'Identité</option>
                       <option value="passport">Passeport</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Photo / Scan du Document</label>
                     <div className="relative group">
                       <input 
                         title="Photo / Scan du Document"
                         type="file" 
                         accept="image/jpeg, image/png, application/pdf"
                         onChange={(e) => setKycFile(e.target.files?.[0] || null)}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                       />
                       <div className={`border-2 border-dashed ${kycFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-300 hover:border-emerald-400'} rounded-xl p-4 flex items-center justify-center gap-3 transition-colors`}>
                         {kycFile ? <FileCheck size={20} className="text-emerald-500" /> : <UploadCloud size={20} className="text-gray-400 group-hover:text-emerald-500" />}
                         <span className={`text-sm font-bold ${kycFile ? 'text-emerald-700' : 'text-gray-500'}`}>
                           {kycFile ? kycFile.name : 'Cliquez pour uploader...'}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={kycLoading || !kycFile}
                   className="px-6 py-2.5 bg-[#0F7A60] hover:bg-[#0C6A52] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 w-full"
                 >
                   {kycLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                   Soumettre pour vérification
                 </button>
               </form>
             )}
           </div>
         </div>
      </div>
    </>
  )
}
