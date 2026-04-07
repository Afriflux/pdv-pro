import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-black">
      {/* Header */}
      <header className="bg-[#0F7A60] text-white py-6 px-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter">
            Yayyam <span className="text-emerald-200">Pro</span>
          </Link>
          <Link href="/" className="text-sm font-medium hover:text-emerald-100 transition">
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-16 px-6 leading-relaxed">
        <h1 className="text-4xl font-black mb-8 text-[#0F7A60]">Politique de Confidentialité</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
            <p>
              Yayyam ("nous", "notre") s'engage à protéger la vie privée des utilisateurs de notre plateforme. 
              Cette politique explique comment nous collectons, utilisons et protégeons vos données personnelles.
              En utilisant Yayyam, vous acceptez les pratiques décrites ici.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">2. Collecte des données</h2>
            <p>Nous collectons les informations suivantes :</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Informations d'identification (Nom, Prénom, Email).</li>
              <li>Informations de boutique (Nom de l'espace, numéro de téléphone).</li>
              <li>Données de transaction (Historique des ventes, montants collectés).</li>
              <li>Informations de paiement (Via nos passerelles partenaires : Wave, CinetPay, PayTech, Bictorys, KKiaPay).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">3. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Fournir et gérer vos services de vente en ligne.</li>
              <li>Traiter les transactions et faciliter les retraits de fonds.</li>
              <li>Améliorer nos services et assurer la sécurité de la plateforme.</li>
              <li>Communiquer avec vous concernant votre compte ou nos mises à jour.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">4. Stockage et Sécurité</h2>
            <p>
              Yayyam est opéré depuis le Sénégal. Vos données sont stockées de manière sécurisée 
              sur des infrastructures Cloud certifiées situées en Europe (via Supabase), garantissant un haut niveau de protection et de conformité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">5. Partage des données</h2>
            <p>
              Nous ne vendons jamais vos données. Elles ne sont partagées qu'avec les prestataires de paiement 
              nécessaires au bon fonctionnement de vos ventes (Wave, CinetPay, PayTech, Bictorys, KKiaPay) et conformément aux obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">6. Vos droits</h2>
            <p>
              Conformément à la législation en vigueur, vous disposez d'un droit d'accès, de rectification et de 
              suppression de vos données. Contactez-nous à <span className="font-bold">support@yayyam.com</span> pour toute demande.
            </p>
          </section>

          <section className="pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-500">Dernière mise à jour : Mars 2026</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-10 px-6 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 text-sm">© 2026 Yayyam — L'outil de vente intelligent pour l'Afrique de l'Ouest.</p>
        </div>
      </footer>
    </div>
  )
}
