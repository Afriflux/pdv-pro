import React from 'react'
import Link from 'next/link'
import { BookOpen, ShieldCheck, Cog, ArrowLeft, Building2, Banknote, Users, Sparkles, ChevronRight, Store, PhoneCall, CheckCircle2, TrendingUp, Info } from 'lucide-react'
import { LandingHeader } from '@/components/landing/LandingHeader'
export const metadata = {
  title: 'Documentation Centrale | Yayyam',
  description: 'Tout ce qui doit être connu du public sur Yayyam : Technique, Opérationnel, Administratif et Métier.',
}

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#0F7A60] selection:text-white">
      <LandingHeader isLoggedIn={false} dashboardUrl="/login" />
      {/* ─── Hero Section ─── */}
      <div className="bg-[#1A1A1A] text-white pt-24 pb-32 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#0F7A60]/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold mb-10 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
          
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#0F7A60] bg-[#0F7A60]/10 text-emerald-400 font-bold text-sm mb-8">
            <Sparkles size={16} /> Version 2.0 - Plateforme Ouverte
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
            Documentation <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Centrale</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed font-medium">
            Yayyam prône une transparence radicale. Plongez dans notre écosystème e-commerce et découvrez le fonctionnement de notre infrastructure, nos processus de rétribution et nos règles métier.
          </p>
        </div>
      </div>

      {/* ─── Layout avec Sidebar ─── */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 -mt-20 relative z-20 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        
        {/* Navigation Latérale (Sticky) */}
        <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-8 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Sommaire Rapide</h3>
          <nav className="space-y-2">
            <a href="#technique" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:text-[#0F7A60] hover:bg-emerald-50 transition-colors">
              <ShieldCheck size={18} /> Architecture & Sécurité
            </a>
            <a href="#operationnel" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors">
              <Cog size={18} /> Modèle Opérationnel
            </a>
            <a href="#metier" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Building2 size={18} /> Piliers Métiers (Outils)
            </a>
            <a href="#administratif" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">
              <Banknote size={18} /> Finance & Payouts
            </a>
            <a href="#organisation" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors">
              <Users size={18} /> Support & Protection
            </a>
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-4">Besoin d'aide supplémentaire ?</p>
            <Link href="https://wa.me/221780476393" target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-[#1A1A1A] text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
              <PhoneCall size={16} /> Contacter un Agent
            </Link>
          </div>
        </aside>

        {/* Contenu Documentaire */}
        <div className="flex-1 space-y-12 w-full">

          {/* Section: Technique */}
          <section id="technique" className="scroll-mt-12 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-md border border-slate-200">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Infrastructure & Sécurité</h2>
                <p className="text-slate-500 font-medium mt-1">Le socle technique qui garantit vos opérations.</p>
              </div>
            </div>
            
            <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900">
              <img src="/assets/doc/infra.png" alt="Infrastructure Tech" className="w-full h-[300px] md:h-[400px] object-cover opacity-90 hover:opacity-100 hover:scale-105 transition duration-500" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Vitesse & Haute Disponibilité</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  L&apos;architecture de Yayyam est propulsée par le framework <strong>Next.js 14</strong>, hébergée sur des serveurs Cloud Edge (Vercel/AWS). 
                  Cela garantit le chargement quasi-instantané des pages produits pour vos clients (Server-Side Rendering), augmentant le taux de conversion drastiquement par rapport aux CMS traditionnels.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Protection des Données & API</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Notre base de données est chiffrée. Les paiements en ligne transitent via des canaux sécurisés 256-bits. 
                  YAYYAM ne revend <strong>jamais</strong> les données de vos clients à des tiers. La configuration des Pixels de Tracking (Meta, TikTok) se fait côté serveur (CAPI) pour échapper aux bloqueurs publicitaires de manière légale.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Opérationnel */}
          <section id="operationnel" className="scroll-mt-12 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-md border border-slate-200">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl w-fit">
                <Cog size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Le Modèle Opérationnel</h2>
                <p className="text-slate-500 font-medium mt-1">Comment Yayyam connecte l&apos;offre et la demande en Afrique.</p>
              </div>
            </div>

            <p className="text-slate-600 mb-8 leading-relaxed">
              Yayyam n'est pas un simple outil de création de site web. C'est un <strong>écosystème collaboratif in-app</strong> où des rôles stricts sont définis. Chaque acteur y trouve son compte via notre système de commissions automatisées.
            </p>

            <div className="mb-10 overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
              <img src="/assets/doc/ops.png" alt="Modèle Opérationnel" className="w-full h-[350px] md:h-[450px] object-cover hover:scale-105 transition duration-500" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Carte Role Vendeur */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition flex flex-col">
                <Store className="text-slate-800 mb-4" size={28} />
                <h4 className="font-black text-slate-800 mb-2">Marchands (Vendeurs)</h4>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">
                  Connectent leurs boutiques, créent les fiches produits, définissent les prix et versent les commissions aux partenaires une fois la vente clôturée.
                </p>
              </div>
              {/* Carte Role Affilié */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 hover:border-blue-200 transition flex flex-col">
                <TrendingUp className="text-blue-600 mb-4" size={28} />
                <h4 className="font-black text-blue-900 mb-2">Affiliés Indépendants</h4>
                <p className="text-xs text-blue-800/70 leading-relaxed flex-1">
                  Génèrent du trafic vers les boutiques. Pas de gestion de stock. Ils touchent jusqu'à 50% de commission par lien de tracking activé.
                </p>
              </div>
              {/* Carte Role Closer */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 hover:border-emerald-200 transition flex flex-col">
                <PhoneCall className="text-emerald-600 mb-4" size={28} />
                <h4 className="font-black text-emerald-900 mb-2">Centre d'Appels (Closers)</h4>
                <p className="text-xs text-emerald-800/70 leading-relaxed flex-1">
                  Récupèrent les paniers abandonnés ou valident les commandes Cash-On-Delivery. Ils travaillent à la performance.
                </p>
              </div>
              {/* Carte Role Livreur */}
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 hover:border-purple-200 transition flex flex-col">
                <CheckCircle2 className="text-purple-600 mb-4" size={28} />
                <h4 className="font-black text-purple-900 mb-2">Logistique (Livreurs)</h4>
                <p className="text-xs text-purple-800/70 leading-relaxed flex-1">
                  Les agences inscrites reçoivent les bons d'expédition validés et clôturent la boucle en confirmant la livraison finale In-App.
                </p>
              </div>
            </div>

            <div className="mt-8 bg-slate-900 text-white rounded-2xl p-6 lg:p-8 flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <Info size={24} />
              </div>
              <p className="text-sm font-medium leading-relaxed">
                <strong>La Règle d'or Cash-On-Delivery (COD) :</strong> L&apos;argent des transactions n'est débloqué et distribué à chaque acteur par l'algorithme Yayyam <em>uniquement</em> lorsque la commande est signalée comme "LIVRÉE" sur le système logistique.
              </p>
            </div>
          </section>

          {/* Section: Métier */}
          <section id="metier" className="scroll-mt-12 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-md border border-slate-200">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-line">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit">
                <Building2 size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Outils & Pilier Métiers</h2>
                <p className="text-slate-500 font-medium mt-1">L'arsenal des vendeurs professionnels.</p>
              </div>
            </div>
            
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="bg-blue-600 text-white font-black px-6 py-4 rounded-xl shrink-0 border-b-4 border-blue-800">
                  Yayyam Academy / LMS
                </div>
                <div className="text-slate-600 text-sm leading-relaxed">
                  <p className="mb-4">
                    Le module <strong>LMS</strong> (Learning Management System) vous permet de vendre des actifs numériques purs. Sans utiliser Moodle, Teachable ou Systeme.io, hébergez directement vos vidéos sur Yayyam.
                  </p>
                  <ul className="list-none space-y-2">
                    <li className="flex items-start gap-2"><ChevronRight size={16} className="text-blue-500 mt-0.5 shrink-0" /> <span className="font-bold text-slate-800">Cours structurés :</span> Divisez le contenu en Modul et Leçons.</li>
                    <li className="flex items-start gap-2"><ChevronRight size={16} className="text-blue-500 mt-0.5 shrink-0" /> <span className="font-bold text-slate-800">Lecteur vidéo privé :</span> Les clients achètent et consomment sur Yayyam.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="bg-emerald-600 text-white font-black px-6 py-4 rounded-xl shrink-0 border-b-4 border-emerald-800">
                  CRM & Facturation B2B
                </div>
                <div className="text-slate-600 text-sm leading-relaxed">
                  <p className="mb-4">
                    Évitez les logiciels externes de comptabilité. Le CRM intelligent garde trace de chaque achat et génère automatiquement des documents légaux :
                  </p>
                  <ul className="list-none space-y-2">
                    <li className="flex items-start gap-2"><ChevronRight size={16} className="text-emerald-500 mt-0.5 shrink-0" /> <span className="font-bold text-slate-800">Quotes (Devis) :</span> Envoyez un lien magique, le prospect paie, la commande se crée seule.</li>
                    <li className="flex items-start gap-2"><ChevronRight size={16} className="text-emerald-500 mt-0.5 shrink-0" /> <span className="font-bold text-slate-800">Invoices automatiques :</span> Une facture conforme au paiement en ligne, incluant TVA locale si exigée.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Administratif */}
          <section id="administratif" className="scroll-mt-12 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-md border border-slate-200">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl w-fit">
                <Banknote size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Finance & Retraits (Payouts)</h2>
                <p className="text-slate-500 font-medium mt-1">Le cœur de la confiance e-commerce.</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-100 p-8">
              <h3 className="text-xl font-black text-purple-900 mb-6">Comment fonctionne le Portefeuille (Wallet) ?</h3>
              
              <div className="mb-8 overflow-hidden rounded-3xl border border-purple-200/50 shadow-sm">
                <img src="/assets/doc/wallet.png" alt="Digital Wallet" className="w-full h-[300px] md:h-[400px] object-cover hover:scale-105 transition duration-500" />
              </div>

              <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
                <p>
                  Chaque vente en ligne atterrit dans le <strong>Wallet In-App</strong> du vendeur (et la commission de l&apos;affilié dans le sien). Ce portefeuille dématérialise l&apos;argent avant versement bancaire out Mobile Money.
                </p>
                <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-purple-100/50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold">1</div>
                  <p><strong>Période de Clearing :</strong> Une réserve temporaire de 48H à 72H peut s'appliquer sur les paiements Digitaux (Carte Bancaire / Wave) pour prévenir la fraude ou le *Chargeback* client.</p>
                </div>
                <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-purple-100/50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center font-bold">2</div>
                  <p><strong>Vérification KYC :</strong> Aucun retrait n'est autorisé vers un compte sans que le Marchand ait fourni ses papiers d'identité officiels (ou NINEA pour les entreprises), vérifiés manuellement par l'administration.</p>
                </div>
                <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-purple-100/50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center font-bold">3</div>
                  <p><strong>Paiement Mobile Money Ultra-Rapide :</strong> Une fois les fonds marqués *Available*, le marchand initie un *Payout* vers Wave, Orange Money ou Compte Bancaire, délivré quotidiennement.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Support */}
          <section id="organisation" className="scroll-mt-12 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-md border border-slate-200">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit">
                <Users size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Organisation du Support Client</h2>
                <p className="text-slate-500 font-medium mt-1">L&apos;acheteur n&apos;est jamais laissé de côté.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-l-4 border-amber-400 pl-6 space-y-3">
                <h3 className="text-lg font-black text-slate-800">Widget Helpdesk Omniprésent</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Chaque boutique possède en façade un <em>Helpdesk Widget</em>. Si la livraison traîne, si le client ne reçoit pas son accès Digital, il peut formuler une <strong>Plainte In-App (Complaint)</strong>. 
                </p>
              </div>
              <div className="border-l-4 border-red-400 pl-6 space-y-3">
                <h3 className="text-lg font-black text-slate-800">Ratio de Qualité & Protection</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Si un marchand reçoit un pourcentage abusif de plaintes justifiées ou de remboursements, Yayyam gèle automatiquement les <em>Payouts</em>, agit en tiers de confiance, et indemnise l'acheteur si suspicion de *Scam* détecté.
                </p>
              </div>
            </div>

            <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-100 text-center">
              <h3 className="font-bold text-amber-900 mb-2">BuyerScore & NPS</h3>
              <p className="text-amber-800/80 text-sm font-medium">Pour protéger les vendeurs, la note NPS globale d'un acheteur sur l'entièreté de la plateforme Yayyam permet de créer des <strong>Blacklists Client intelligentes</strong>. Les fraudeurs identifiés sur une boutique sont exclus des autres.</p>
            </div>
          </section>

        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="mt-12 border-t border-slate-200 pt-8 pb-12 text-center relative z-20 bg-white">
        <p className="text-slate-500 font-medium text-sm">
          Toute information contenue dans cette documentation l'est à des fins de transparence systémique. <br className="hidden sm:block" />
          Pour en savoir plus, veuillez consulter nos <Link href="/conditions-utilisation" className="text-[#0F7A60] font-bold hover:underline">Conditions Générales d'Utilisation</Link>.
        </p>
      </div>
      
      {/* ─── Footer ─── */}
      <footer className="bg-[#0a1a1f] border-t border-white/5 pt-16 pb-28 px-6 relative mt-auto">
        <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-black text-white tracking-tighter">Yayyam</span>
            </div>
            <p className="font-light max-w-sm leading-relaxed text-sm text-white/60">
              La plateforme e-commerce tout-en-un conçue spécifiquement pour les réalités du commerce en Afrique de l&apos;Ouest.
            </p>
            <div className="flex gap-4 mt-6">
               <a title="Instagram" aria-label="Instagram" href="https://instagram.com/yayyam" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:border-[#0F7A60] hover:text-[#0F7A60] transition">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
               </a>
               <a title="Facebook" aria-label="Facebook" href="https://facebook.com/yayyam" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:border-[#0F7A60] hover:text-[#0F7A60] transition">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
               </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white/40 font-mono font-bold mb-6 tracking-widest uppercase text-xs">Produit</h4>
            <ul className="space-y-4 text-sm font-light text-white/60">
              <li><Link href="/#features" className="hover:text-emerald-400 transition">Fonctionnalités</Link></li>
              <li><Link href="/#pricing" className="hover:text-emerald-400 transition">Tarifs</Link></li>
              <li><Link href="/vendeurs" className="hover:text-emerald-400 transition font-bold text-emerald-400">Marketplace</Link></li>
              <li><Link href="/track" className="hover:text-emerald-400 transition">Suivre ma commande</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white/40 font-mono font-bold mb-6 tracking-widest uppercase text-xs">Légal & Support</h4>
            <ul className="space-y-4 text-sm font-light text-white/60">
              <li><Link href="/contact" className="hover:text-emerald-400 transition font-bold text-emerald-400">Nous contacter</Link></li>
              <li><Link href="/conditions-utilisation" className="hover:text-emerald-400 transition">Conditions d&apos;utilisation</Link></li>
              <li><Link href="/politique-confidentialite" className="hover:text-emerald-400 transition">Politique de confidentialité</Link></li>
              <li><Link href="/mentions-legales" className="hover:text-emerald-400 transition">Mentions légales</Link></li>
              <li><span className="text-emerald-400 font-bold">Documentation Centrale</span></li>
              <li><a href="https://wa.me/221780476393" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition flex items-center gap-2">
                <span className="w-2 h-2 bg-[#0F7A60] rounded-full animate-pulse"></span>
                Support WhatsApp
              </a></li>
            </ul>
          </div>
        </div>
        <div className="w-full max-w-[1400px] mx-auto mt-16 pt-8 border-t border-white/10 text-sm font-light text-white/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Yayyam. Tous droits réservés.</p>
          <p>Propulsé par l&apos;innovation Africaine 🌍</p>
        </div>
      </footer>
    </div>
  )
}

