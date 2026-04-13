import Link from 'next/link'

export function LandingNav({ isLoggedIn, dashboardUrl = '/dashboard' }: { isLoggedIn?: boolean, dashboardUrl?: string }) {
  if (isLoggedIn) {
    return (
      <Link
        href={dashboardUrl}
        className="bg-emerald hover:bg-emerald-rich text-white px-6 py-3.5 rounded-full text-sm font-semibold transition shadow-lg shadow-emerald/20 min-h-[44px] inline-flex items-center justify-center"
      >
        Mon espace →
      </Link>
    )
  }

  return (
    <>
      <Link href="/login" className="hidden md:flex text-sm uppercase tracking-widest font-bold text-charcoal hover:text-emerald hover:scale-105 active:scale-95 transition-all items-center px-4 py-2 min-h-[44px] rounded-lg">
        Connexion
      </Link>
      <Link href="/register" className="bg-emerald hover:bg-emerald-rich active:scale-95 text-white px-6 py-3.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-emerald/20 hover:shadow-emerald/40 hover:-translate-y-0.5 min-h-[44px] inline-flex items-center justify-center">
        Démarrer gratuitement
      </Link>
    </>
  )
}
