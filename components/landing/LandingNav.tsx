import Link from 'next/link'

export function LandingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
  if (isLoggedIn) {
    return (
      <Link
        href="/dashboard"
        className="bg-emerald hover:bg-emerald-rich text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-lg shadow-emerald/20"
      >
        Mon espace →
      </Link>
    )
  }

  return (
    <>
      <Link href="/login" className="hidden md:block text-sm font-bold text-charcoal hover:text-emerald transition">
        Connexion
      </Link>
      <Link href="/register" className="bg-emerald hover:bg-emerald-rich text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-lg shadow-emerald/20">
        Démarrer gratuitement
      </Link>
    </>
  )
}
