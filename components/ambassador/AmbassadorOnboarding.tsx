'use client'

import { useState } from 'react'
import { Sparkles, Users, Coins, ArrowRight, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { activateAmbassadorAction } from '@/app/dashboard/ambassadeur/actions' // We will create this action
import { toast } from '@/lib/toast'

export default function AmbassadorOnboarding() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleActivate = async () => {
    setIsLoading(true)
    try {
      const res = await activateAmbassadorAction()
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Votre compte Ambassadeur est activé !")
        router.refresh()
      }
    } catch (err) {
      toast.error("Une erreur est survenue lors de l'activation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full">
        {/* Headings */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Devenez Ambassadeur Yayyam</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Partagez votre lien de parrainage exclusif et générez des revenus passifs à chaque nouveau vendeur que vous amenez sur la plateforme.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-black text-gray-900 mb-2">Invitez</h3>
            <p className="text-sm text-gray-500 font-medium">
              Partagez votre code unique à des amis, créateurs ou marchands.
            </p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-900/5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-50/50 pointer-events-none"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mx-auto mb-4 border border-emerald-200">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="font-black text-gray-900 mb-2 text-emerald-900">Gagnez</h3>
              <p className="text-sm text-emerald-700/80 font-medium">
                10 000 FCFA pour chaque vendeur référé ayant généré plus de 50 000 FCFA de CA.
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mx-auto mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-black text-gray-900 mb-2">Suivez</h3>
            <p className="text-sm text-gray-500 font-medium">
              Suivez vos filleuls en direct et retirez vos fonds dès 5 000 FCFA de solde.
            </p>
          </div>
        </div>

        {/* Activation CTA */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl flex flex-col items-center">
          <p className="text-sm text-gray-500 font-medium mb-6 text-center max-w-lg">
            En activant votre profil, vous obtiendrez un Dashboard dédié pour suivre vos clics et piloter vos commissions en toute transparence. L'accès est 100% gratuit.
          </p>
          <button
            onClick={handleActivate}
            disabled={isLoading}
            className={`flex items-center gap-2 bg-[#0F7A60] hover:bg-[#0A5F4B] text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {isLoading ? 'Activation en cours...' : 'Générer mon lien Ambassadeur'}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
