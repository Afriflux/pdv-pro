'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface ValidateResponse {
  valid: boolean
  ambassadorName?: string
  message?: string
}

function AmbassadorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')

  const [ambassadorCode, setAmbassadorCode] = useState('')
  const [codeStatus, setCodeStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [ambassadorName, setAmbassadorName] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Validation du code en temps réel avec debounce 500ms
  useEffect(() => {
    if (!ambassadorCode.trim()) {
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
  }, [ambassadorCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((ambassadorCode.trim() !== '' && codeStatus !== 'valid') || !userId) return

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/register/complete-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambassadorCode: ambassadorCode.trim().toUpperCase()
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

  const handleSkip = () => {
    // Si c'est un acheteur, il n'a pas besoin de créer de boutique
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex font-body bg-cream">
      <div className="w-full flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h2 className="font-display font-black text-3xl text-ink mb-2">Une dernière étape 🎯</h2>
            <p className="text-slate text-sm font-light">Entrez le code de l&apos;ambassadeur Yayyam qui vous a recommandé</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-ink/5 p-8 border border-line relative">
            {errorMsg && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2 break-words">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="ambassadorCodeInput" className="block text-sm font-medium text-charcoal mb-1.5">
                  Code Ambassadeur 
                  <span className="ml-1 text-[10px] text-gray-400 font-normal">(optionnel)</span>
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
                    className={`w-full px-4 py-3 pr-10 rounded-xl bg-cream border text-ink placeholder:text-dust focus:outline-none focus:ring-2 transition-all text-sm uppercase font-mono tracking-wider ${
                      codeStatus === 'valid'
                        ? 'border-[#0F7A60] focus:border-[#0F7A60] focus:ring-[#0F7A60]/15'
                        : codeStatus === 'invalid'
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15'
                          : 'border-line focus:border-emerald focus:ring-emerald/15'
                    }`}
                  />
                  {/* Icône statut */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {codeStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    {codeStatus === 'valid'   && <CheckCircle2 className="w-4 h-4 text-[#0F7A60]" />}
                    {codeStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>

                {/* Badge résultat */}
                {codeStatus === 'valid' && ambassadorName && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#0F7A60] font-bold bg-[#0F7A60]/5 border border-[#0F7A60]/20 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Code valide — Ambassadeur : {ambassadorName}
                  </div>
                )}
                {codeStatus === 'invalid' && ambassadorCode.trim() && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    Code invalide ou inactif
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={(ambassadorCode.trim() !== '' && codeStatus !== 'valid') || isSubmitting}
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-md mt-4 transform active:scale-[0.98] text-white flex items-center justify-center gap-2 ${
                  (ambassadorCode.trim() === '' || codeStatus === 'valid') && !isSubmitting
                    ? 'bg-emerald hover:bg-emerald-rich shadow-emerald/20'
                    : 'bg-gray-300 cursor-not-allowed shadow-none'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  'Continuer'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-dust hover:text-emerald transition-colors font-medium underline underline-offset-4 decoration-dust/30"
              >
                Je n&apos;ai pas de code → Accéder au dashboard
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate mt-8">
              Vous pourrez créer une boutique plus tard depuis votre dashboard.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function AmbassadorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin w-8 h-8 border-4 border-emerald border-t-transparent rounded-full" />
      </div>
    }>
      <AmbassadorContent />
    </Suspense>
  )
}
