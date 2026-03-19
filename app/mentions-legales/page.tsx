import Link from 'next/link'

export default function LegalNoticesPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-black">
      {/* Header */}
      <header className="bg-[#0F7A60] text-white py-6 px-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter">
            PDV <span className="text-emerald-200">Pro</span>
          </Link>
          <Link href="/" className="text-sm font-medium hover:text-emerald-100 transition">
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-16 px-6 leading-relaxed">
        <h1 className="text-4xl font-black mb-8 text-[#0F7A60]">Mentions Légales</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">1. Éditeur du site</h2>
            <p>
              La plateforme PDV Pro est éditée par la société <span className="font-bold">PDV Pro Senegal SARL</span>, 
              immatriculée au Registre du Commerce et du Crédit Mobilier (RCCM) de Dakar.
            </p>
            <ul className="mt-4 space-y-1">
              <li><span className="font-semibold">Siège social :</span> Dakar, Sénégal.</li>
              <li><span className="font-semibold">Contact :</span> support@pdvpro.com</li>
              <li><span className="font-semibold">Directeur de publication :</span> Équipe Fondatrice PDV Pro.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">2. Hébergement</h2>
            <p>
              Le site et ses bases de données sont hébergés par :
            </p>
            <ul className="mt-4 space-y-1">
              <li><span className="font-semibold">Prestataire Cloud :</span> Supabase</li>
              <li><span className="font-semibold">Emplacement :</span> Serveurs sécurisés en Europe.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">3. Propriété Intellectuelle</h2>
            <p>
              L'ensemble de ce site relève de la législation sénégalaise et internationale sur le droit d'auteur 
              et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les 
              documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">4. Services de Paiement</h2>
            <p>
              PDV Pro utilise les services de passerelles de paiement tierces agréées :
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Wave Mobile Money</li>
              <li>CinetPay</li>
              <li>PayTech</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">5. Données Personnelles</h2>
            <p>
              Les informations recueillies font l'objet d'un traitement informatique destiné à la gestion 
              des comptes vendeurs et des transactions. Conformément à la loi "Informatique et Libertés" du Sénégal, 
              vous pouvez exercer votre droit d'accès aux données.
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
          <p className="text-gray-600 text-sm">© 2026 PDV Pro — L'excellence digitale pour le e-commerce en Afrique.</p>
        </div>
      </footer>
    </div>
  )
}
