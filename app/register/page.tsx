import Link from 'next/link'
import { RegisterForm } from './RegisterForm'
import {
  ArrowLeft,
  CheckCircle2
} from 'lucide-react'

interface RegisterPageProps {
  searchParams: { error?: string; plan?: string; msg?: string }
}

const errorMessages: Record<string, string> = {
  champs_requis: 'Nom, téléphone, email et mot de passe sont obligatoires.',
  auth_error:    'Erreur lors de la création du compte.',
  profil_error:  'Erreur création du profil.',
  store_error:   'Erreur création de la boutique.'
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const errorKey = searchParams.error
  const fullMsg  = searchParams.msg
  const baseMsg  = errorKey ? (errorMessages[errorKey] ?? 'Une erreur est survenue.') : null
  const errorMsg = baseMsg ? (fullMsg ? `${baseMsg} Détail : ${fullMsg}` : baseMsg) : null

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
            <pattern id="diag-gold-reg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect x="0" y="0" width="20" height="20" fill="#E8C97A" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag-gold-reg)"/>
        </svg>

        {/* Lueur subtile */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-light/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="mb-12">
            <Link href="/" className="inline-block text-white font-display text-4xl font-bold hover:opacity-80 transition drop-shadow-sm tracking-tight mb-6">
              PDV<span className="text-gold-light">Pro</span>
            </Link>
            <h1 className="text-white/80 text-lg font-light italic max-w-md">
              Rejoignez l&apos;élite du commerce mobile en Afrique.
            </h1>
          </div>

          <div className="space-y-6 text-white/90">
            <div className="flex items-start gap-4">
              <div className="bg-gold/20 border border-gold/30 text-gold-light rounded-full p-1 mt-0.5 shrink-0"><CheckCircle2 size={16}/></div>
              <p className="font-light leading-relaxed text-white/80">Paiements <strong className="text-white font-semibold">Wave, Orange Money & PayTech</strong> nativement intégrés.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-gold/20 border border-gold/30 text-gold-light rounded-full p-1 mt-0.5 shrink-0"><CheckCircle2 size={16}/></div>
              <p className="font-light leading-relaxed text-white/80">Votre espace de vente en ligne premium, prête à vendre en <strong className="text-white font-semibold">5 minutes chrono</strong>.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-gold/20 border border-gold/30 text-gold-light rounded-full p-1 mt-0.5 shrink-0"><CheckCircle2 size={16}/></div>
              <p className="font-light leading-relaxed text-white/80"><strong className="text-white font-semibold">Zéro frais fixe</strong> pour démarrer. Nous ne gagnons que si vous gagnez.</p>
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

          <div className="text-center mb-8">
            <h2 className="font-display font-black text-3xl text-ink mb-2">Créez votre boutique gratuite en 2 minutes</h2>
          </div>

          <RegisterForm errorMsg={errorMsg} />
        </div>
      </div>
    </main>
  )
}
