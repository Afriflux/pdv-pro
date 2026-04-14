'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, ShoppingBag, Briefcase, Users, Headset, ChevronRight } from 'lucide-react'

type UserRole = 'acheteur' | 'vendeur' | 'affilie' | 'closer'

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  acheteur: 'Achetez et suivez vos commandes facilement.',
  vendeur: 'Créez votre boutique et vendez sans commission fixe.',
  affilie: 'Gagnez des commissions en partageant des produits.',
  closer: 'Concluez des ventes pour les vendeurs et soyez rémunéré.',
}

interface ValidateResponse {
  valid: boolean
  ambassadorName?: string
  message?: string
}

function GoogleOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const paramRole = searchParams.get('role') as UserRole | null

  const [role, setRole] = useState<UserRole | null>(paramRole || null)
  const [ambassadorCode, setAmbassadorCode] = useState('')
  const [codeStatus, setCodeStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [ambassadorName, setAmbassadorName] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Validation du code en temps réel avec debounce 500ms
  useEffect(() => {
    if (!ambassadorCode.trim() || role !== 'vendeur') {
      setCodeStatus('idle')
      setAmbassadorName(null)
      return
    }

    setCodeStatus('loading')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/ambassador/validate?code=${encodeURIComponent(ambassadorCode.trim().toUpperCase())}`
        )
        const data = (await res.json()) as ValidateResponse

        if (data.valid) {
          setCodeStatus('valid')
          setAmbassadorName(data.ambassadorName ?? null)
        } else {
          setCodeStatus('invalid')
          setAmbassadorName(null)
        }
      } catch {
        setCodeStatus('invalid')
        setAmbassadorName(null)
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [ambassadorCode, role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((role === 'vendeur' && ambassadorCode.trim() !== '' && codeStatus !== 'valid') || !userId) return

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/register/complete-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          ambassadorCode: role === 'vendeur' ? ambassadorCode.trim().toUpperCase() : null
        })
      })

      const data = await res.json()
      
      if (data.success) {
        router.push(data.redirectTo || '/dashboard')
      } else {
        setErrorMsg(data.error || 'Une erreur est survenue lors de la finalisation.')
        setIsSubmitting(false)
      }
    } catch {
      setErrorMsg('Erreur de connexion au serveur.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex font-body bg-[#02120C] text-white">
      {/* ── Background Cinématique ── */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[130px] translate-y-1/3 translate-x-1/3" />
      </div>

      <div className="w-full flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="font-display font-black text-3xl md:text-4xl text-white mb-3">On y est presque 🎉</h2>
            <p className="text-white/60 text-sm md:text-base font-medium">Choisissez avec quel profil vous souhaitez utiliser Yayyam.</p>
          </div>

          <div className="bg-[#0A1A1F]/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-white/10 animate-in fade-in zoom-in-95 duration-500">
            {errorMsg && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 flex items-start gap-2 break-words">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* ── Sélecteur de rôle ── */}
              <div>
                <p className="text-xs font-black text-emerald-400/70 uppercase tracking-widest mb-3 text-center">Profil d'accès</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-black/40 p-1.5 rounded-[1.5rem] border border-white/5">
                  <button
                    type="button"
                    onClick={() => setRole('acheteur')}
                    className={`relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-300 ${
                      role === 'acheteur' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {role === 'acheteur' && (
                      <div className="absolute inset-0 bg-white/5 border border-emerald-500/30 rounded-[1rem] shadow-[0_0_20px_rgba(52,211,153,0.1)]"></div>
                    )}
                    <ShoppingBag className="w-6 h-6 relative z-10" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest relative z-10">Acheteur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('vendeur')}
                    className={`relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-300 ${
                      role === 'vendeur' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {role === 'vendeur' && (
                      <div className="absolute inset-0 bg-white/5 border border-emerald-500/30 rounded-[1rem] shadow-[0_0_20px_rgba(52,211,153,0.1)]"></div>
                    )}
                    <Briefcase className="w-6 h-6 relative z-10" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest relative z-10">Vendeur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('affilie')}
                    className={`relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-300 ${
                      role === 'affilie' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {role === 'affilie' && (
                      <div className="absolute inset-0 bg-white/5 border border-emerald-500/30 rounded-[1rem] shadow-[0_0_20px_rgba(52,211,153,0.1)]"></div>
                    )}
                    <Users className="w-6 h-6 relative z-10" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest relative z-10">Affilié</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('closer')}
                    className={`relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-300 ${
                      role === 'closer' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {role === 'closer' && (
                      <div className="absolute inset-0 bg-white/5 border border-emerald-500/30 rounded-[1rem] shadow-[0_0_20px_rgba(52,211,153,0.1)]"></div>
                    )}
                    <Headset className="w-6 h-6 relative z-10" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest relative z-10">Closer</span>
                  </button>
                </div>
                <div className="h-5 flex items-center justify-center mt-3">
                  {role ? (
                    <p className="text-center text-xs text-emerald-300 font-medium transition-all animate-[fade-in_0.3s_ease-out]">
                      {ROLE_DESCRIPTIONS[role]}
                    </p>
                  ) : (
                    <p className="text-center text-xs text-white/30 font-medium">Veuillez sélectionner un profil.</p>
                  )}
                </div>
              </div>

              {/* ── Code Ambassadeur (Uniquement pour Vendeur) ── */}
              {role === 'vendeur' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label htmlFor="ambassadorCodeInput" className="block text-xs font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest">
                    Code Ambassadeur 
                    <span className="ml-1 text-[10px] text-white/30 font-normal lowercase tracking-normal">(Optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="ambassadorCodeInput"
                      type="text"
                      value={ambassadorCode}
                      onChange={(e) => setAmbassadorCode(e.target.value)}
                      placeholder="Ex: COACH-AMADOU"
                      maxLength={30}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-4 rounded-xl bg-black/40 border text-white placeholder:text-white/20 focus:outline-none focus:ring-1 transition-all text-sm uppercase font-mono tracking-wider ${
                        codeStatus === 'valid'
                          ? 'border-emerald-400/50 focus:border-emerald-400/50 focus:ring-emerald-400/50'
                          : codeStatus === 'invalid'
                            ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
                            : 'border-white/5 focus:border-emerald-400/50 focus:ring-emerald-400/50'
                      }`}
                    />
                    {/* Icône statut */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {codeStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-white/30" />}
                      {codeStatus === 'valid'   && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {codeStatus === 'invalid' && <XCircle className="w-5 h-5 text-red-400" />}
                    </div>
                  </div>

                  {/* Badge résultat */}
                  {codeStatus === 'valid' && ambassadorName && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Valide — Ambassadeur : {ambassadorName}
                    </div>
                  )}
                  {codeStatus === 'invalid' && ambassadorCode.trim() && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      Code inactif ou introuvable
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!role || (role === 'vendeur' && ambassadorCode.trim() !== '' && codeStatus !== 'valid') || isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-md mt-4 transform active:scale-[0.98] text-white ${
                    role && ((role !== 'vendeur' || ambassadorCode.trim() === '' || codeStatus === 'valid') && !isSubmitting)
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#021f15] shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                      : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Finalisation...</>
                  ) : (
                    <>
                      FINALISER MON INSCRIPTION
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function GoogleOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#02120C]">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    }>
      <GoogleOnboardingContent />
    </Suspense>
  )
}
