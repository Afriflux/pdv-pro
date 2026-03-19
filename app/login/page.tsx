'use client'

import Link from 'next/link'
import { signIn, signInWithGoogle } from '@/app/auth/actions'
import {
  ArrowLeft,
  CheckCircle2
} from 'lucide-react'

interface LoginPageProps {
  searchParams: { error?: string; redirect?: string }
}

const errorMessages: Record<string, string> = {
  champs_requis:       'Veuillez remplir tous les champs.',
  identifiants_invalides: 'Email/téléphone ou mot de passe incorrect.',
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorKey = searchParams.error
  const errorMsg = errorKey ? (errorMessages[errorKey] ?? 'Une erreur est survenue.') : null

  return (
    <main className="min-h-screen flex font-body bg-cream">
      {/* Bouton retour absolu */}
      <Link href="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-slate hover:text-emerald transition-colors group">
        <span className="w-8 h-8 rounded-full border border-line bg-white flex items-center justify-center group-hover:border-emerald/30 group-hover:bg-emerald/5 transition-colors shadow-sm">
          <ArrowLeft size={16} />
        </span>
        <span className="font-medium hidden sm:inline">Retour à l&apos;accueil</span>
      </Link>

      {/* Colonne Gauche (40%) - Masquée sur mobile */}
      <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-emerald-deep to-emerald relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        {/* Motif SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none">
          <defs>
            <pattern id="diag-gold" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect x="0" y="0" width="20" height="20" fill="#E8C97A" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag-gold)"/>
        </svg>

        {/* Lueur subtile */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-light/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="mb-12">
            <Link href="/" className="inline-block text-white font-display text-4xl font-bold hover:opacity-80 transition drop-shadow-sm tracking-tight mb-6">
              PDV<span className="text-gold-light">Pro</span>
            </Link>
            <h1 className="text-white/80 text-lg font-light italic max-w-md">
              La plateforme de vente intelligente pour l&apos;Afrique de l&apos;Ouest.
            </h1>
          </div>

          <div className="space-y-6 text-white/90">
            <div className="flex items-start gap-4">
              <div className="bg-gold/20 border border-gold/30 text-gold-light rounded-full p-1 mt-0.5 shrink-0"><CheckCircle2 size={16}/></div>
              <p className="font-light leading-relaxed text-white/80">Paiements <strong className="text-white font-semibold">Wave, Orange Money & PayTech</strong> nativement intégrés.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-gold/20 border border-gold/30 text-gold-light rounded-full p-1 mt-0.5 shrink-0"><CheckCircle2 size={16}/></div>
              <p className="font-light leading-relaxed text-white/80">Votre espace de vente en ligne premium, prêt à vendre en <strong className="text-white font-semibold">5 minutes chrono</strong>.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-gold/20 border border-gold/30 text-gold-light rounded-full p-1 mt-0.5 shrink-0"><CheckCircle2 size={16}/></div>
              <p className="font-light leading-relaxed text-white/80"><strong className="text-white font-semibold">Zéro abonnement</strong> pour démarrer. Nous ne gagnons que si vous gagnez.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 pt-8 border-t border-white/10 text-white/40 text-sm font-light">
          © {new Date().getFullYear()} PDV Pro. Propulsé par l&apos;innovation Africaine 🌍
        </div>
      </div>

      {/* Colonne Droite (60%) */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md relative z-10">
          
          {/* Logo mobile uniquement */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-block text-4xl font-display font-black text-ink hover:opacity-80 transition drop-shadow-sm tracking-tight mb-2">
              PDV<span className="text-emerald">Pro</span>
            </Link>
          </div>

          <div className="text-center mb-10">
            <h2 className="font-display font-black text-3xl text-ink mb-2">Bon retour parmi nous.</h2>
            <p className="text-slate text-sm font-light">Accédez à votre espace marchand et gérez vos ventes.</p>
          </div>

          {/* Carte RTL / LTR form */}
          <div className="bg-white rounded-3xl shadow-xl shadow-ink/5 p-8 border border-line relative">
            {errorMsg && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Bouton Google */}
            <form action={signInWithGoogle} className="mb-6">
              <button
                type="submit"
                className="w-full bg-white hover:bg-gray-50 text-ink font-bold py-3.5 px-4 rounded-xl border border-line flex items-center justify-center gap-3 transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </button>
            </form>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-line flex-1"></div>
              <span className="text-sm text-dust font-medium">ou</span>
              <div className="h-px bg-line flex-1"></div>
            </div>

            <form action={signIn} className="space-y-5">
              <div>
                <label htmlFor="emailOrPhone" className="block text-sm font-medium text-charcoal mb-2">
                  Identifiant (Email ou Téléphone)
                </label>
                <input
                  id="emailOrPhone"
                  name="emailOrPhone"
                  type="text"
                  placeholder="email@exemple.com ou +221..."
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-cream border border-line text-ink placeholder:text-dust focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/15 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-cream border border-line text-ink placeholder:text-dust focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/15 transition-all text-sm"
                />
                <div className="flex justify-end mt-2">
                  <a href="#" className="flex-none text-xs text-dust hover:text-emerald transition-colors font-medium">Mot de passe oublié ?</a>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald hover:bg-emerald-rich text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-emerald/20 mt-2 transform active:scale-[0.98]"
              >
                Accéder à mon tableau de bord
              </button>
            </form>

            <p className="text-center text-sm text-slate mt-8">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-emerald font-bold hover:text-emerald-rich transition-colors underline decoration-emerald/30 underline-offset-4">
                Créer mon lien (Gratuit)
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
