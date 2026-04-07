import Link from 'next/link'


export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* Colonne 1 : Brand */}
        <div className="space-y-4">
          <Link href="/" className="inline-block">
             <span className="text-2xl font-black tracking-tighter text-white">Yayyam</span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed">
            La plateforme e-commerce #1 en Afrique de l'Ouest. Créez votre boutique gratuitement et vendez sans limite.
          </p>
        </div>

        {/* Colonne 2 : Plateforme */}
        <div>
          <h4 className="font-bold text-lg mb-4">Plateforme</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
            <li><Link href="/vendeurs" className="hover:text-white transition-colors">Vendeurs</Link></li>
            <li><Link href="/#pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
            <li><Link href="/register" className="hover:text-white transition-colors">S'inscrire</Link></li>
          </ul>
        </div>

        {/* Colonne 3 : Ressources */}
        <div>
          <h4 className="font-bold text-lg mb-4">Ressources</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link href="/conditions-utilisation" className="hover:text-white transition-colors">Conditions d'utilisation</Link></li>
            <li><Link href="/politique-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
          </ul>
        </div>

        {/* Colonne 4 : Contact */}
        <div>
          <h4 className="font-bold text-lg mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-gray-400 mb-6">
            <li><a href="mailto:support@yayyam.com" className="hover:text-white transition-colors">support@yayyam.com</a></li>
            <li><a href="https://wa.me/221770000000" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">WhatsApp Support</a></li>
          </ul>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/yayyam" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-emerald hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://t.me/yayyam" target="_blank" rel="noopener noreferrer" title="Telegram" aria-label="Telegram" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-emerald hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </a>
            <a href="https://www.facebook.com/yayyam" target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Facebook" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-emerald hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
        <p>© 2026 Yayyam — Tous droits réservés.</p>
        <p className="mt-2 md:mt-0">Fait avec ❤️ au Sénégal</p>
      </div>
    </footer>
  )
}
