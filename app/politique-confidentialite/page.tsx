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
              Yayyam ("nous", "notre") s'engage à protéger la vie privée des marchands, affiliés, closers et clients finaux.
              Cette politique de protection des données et de la vie privée explique comment nous collectons, traitons et protégeons les informations transistant par notre écosystème e-commerce (y compris l'utilisation de l'Intelligence Artificielle "Check360°" et de la validation anti-fraude par OTP).
              En utilisant Yayyam, vous acceptez les pratiques décrites ici.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">2. Collecte des données</h2>
            <p>Nous collectons les informations suivantes :</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Informations d'identification (Nom, Prénom, Email, Numéro de téléphone pour le KYC).</li>
              <li>Informations de boutique et statistiques générées (Nom de l'espace, chiffre d'affaires).</li>
              <li>Données de transaction et de détection anti-fraude (Historique des ventes, scores de confiance, logs de confirmation OTP par SMS).</li>
              <li>Informations de paiement (Via nos passerelles partenaires : Wave, CinetPay, PayTech, Orange Money, etc.).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">3. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Fournir et gérer vos services de vente en ligne et vos réseaux (Affiliation/Closing).</li>
              <li>Permettre le traitement de l'IA (Check360°) pour analyser vos performances (les données traitées par l'IA restent strictement anonymisées et cloisonnées à votre espace).</li>
              <li>Traiter les transactions et faciliter les retraits de fonds (Automatisés ou manuels).</li>
              <li>Auditer et bloquer les commandes frauduleuses via le score de confiance acheteur et la vérification SMS (Hub SMS).</li>
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
            <p className="text-sm text-gray-500">Dernière mise à jour : Avril 2026</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-10 px-6 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 text-sm">© 2026 Yayyam — L'écosystème de vente le plus avancé d'Afrique Panafricaine.</p>
        </div>
      </footer>
    </div>
  )
}
