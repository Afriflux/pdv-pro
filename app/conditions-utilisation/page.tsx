import Link from 'next/link'

export default function TermsPage() {
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
        <h1 className="text-4xl font-black mb-8 text-[#0F7A60]">Conditions d'Utilisation</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'écosystème Yayyam (plateforme SaaS e-commerce, application web, systèmes de paiement et intégrations intelligentes). Cet environnement permet aux marchands, affiliés et closers d'opérer sur les marchés Panafricains, notamment dans les zones UEMOA et CEMAC.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">2. Modèle Économique</h2>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <p className="font-bold text-[#0F7A60]">Plan Gratuit :</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Commission dégressive automatique de 8% à 5% selon le volume de ventes mensuel.</li>
                <li>0 - 100K FCFA : 8% | 100K - 500K : 7% | 500K - 1M : 6% | +1M : 5%.</li>
                <li>Yayyam absorbe tous les frais de transaction et de retrait.</li>
                <li>Fonds disponibles immédiatement après paiement.</li>
              </ul>
              <p className="font-bold text-[#0F7A60]">Ventes en COD (Paiement à la livraison) :</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Commission fixe de 5% sur les ventes COD terminées.</li>
                <li>Le coût de l'authentification Anti-Fraude par OTP (SMS) est inclus dans cette commission.</li>
                <li>Zéro frais fixe mensuel.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">3. Paiements et Retraits</h2>
            <p>
              Les paiements sont effectués via les agrégateurs partenaires officiels de la plateforme (Wave, CinetPay, PayTech, Orange Money, etc.) couvrant les monnaies XOF, XAF, GNF et autres devises supportées. 
              Le vendeur reçoit les fonds instantanément ou avec compensation selon la passerelle utilisée. 
              Les retraits automatisés (Payouts) vers un portefeuille mobile sont déclenchés selon les plafonds configurés.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">4. Obligations de l'Utilisateur</h2>
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Fournir des informations exactes lors de l'inscription (processus de vérification KYC).</li>
              <li>Ne pas vendre de produits illégaux ou interdits par les législations locales, nationales et internationales.</li>
              <li>Respecter les délais de livraison annoncés à ses clients.</li>
              <li>Ne pas utiliser les intégrations SMS (Hub SMS) ou les Bots WhatsApp à des fins de spam ou d'escroquerie.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">5. Responsabilité</h2>
            <p>
              Yayyam SAS met à disposition une infrastructure logicielle ("Software-as-a-Service"). Bien que nous utilisions l'Intelligence Artificielle (Check360°) et l'Anti-Fraude (OTP) pour assister nos usagers, nous de sommes pas responsables de la qualité des produits vendus ou des défauts de service incombant directement aux transporteurs ou aux marchands. Yayyam décline toute responsabilité en cas de litige commercial entre le vendeur et l'acheteur. Toutefois, nos algorithmes de sécurité peuvent suspendre préventivement tout compte signalé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">6. Contact</h2>
            <p>
              Pour toute question relative aux présentes conditions, contactez-nous à <span className="font-bold">support@yayyam.com</span>.
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
