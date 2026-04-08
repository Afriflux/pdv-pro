'use client'

import React, { useRef, useEffect, useState } from 'react'
import { 
  Store, Sparkles, Globe, MessageCircle, Zap, Repeat, Wallet, 
  LayoutTemplate, Calendar, Truck, Tag, Link, BarChart, 
  HeadphonesIcon, FileText, GraduationCap 
} from 'lucide-react'

interface BentoGridProps {
  title: React.ReactNode;
  supertitle: string;
}

/* ─── CSS-only reveal animation via IntersectionObserver ─── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.05, rootMargin: '-50px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

const features = [
  {
    title: "La Boutique Ultime",
    desc: "L'App Store Yayyam intègre tous vos outils de vente. Oubliez Shopify et son abonnement mensuel : gérez tout au même endroit.",
    icon: <Store size={32} />,
    col: "md:col-span-2 lg:col-span-2",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5 hover:border-emerald-500/20 shadow-sm",
    textClass: "text-[#0A1F1A]",
    iconClass: "bg-[#0A1F1A] text-white",
    eff: "bg-gradient-to-tr from-emerald-500/10 to-teal-400/5 blur-3xl",
  },
  {
    title: "Assistant IA Génératif",
    desc: "Générez vos fiches produits, emails et campagnes marketing en 3 secondes grâce à notre IA propriétaire. Un copywriter intégré.",
    icon: <Sparkles size={28} />,
    col: "md:col-span-2 lg:col-span-2",
    row: "row-span-1",
    theme: "bg-gradient-to-br from-teal-900 to-[#0A1F1A] border-white/10 shadow-2xl",
    textClass: "text-white",
    descClass: "text-teal-100/70",
    iconClass: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
    eff: "bg-teal-500/20 blur-3xl -top-20 -right-20",
  },
  {
    title: "Le Marché Panafricain",
    desc: "Touchez le Sénégal, la Côte d'Ivoire, le Mali et au-delà avec notre réseau d'affiliation intégré.",
    icon: <Globe size={40} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-2",
    theme: "bg-gradient-to-b from-[#1A9E7A] to-[#0D5C4A] shadow-xl",
    textClass: "text-white",
    descClass: "text-emerald-100 mix-blend-overlay text-base",
    iconClass: "bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-[2rem]",
    eff: "bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 inset-0",
    center: true,
  },
  {
    title: "Groupes Telegram Privés",
    desc: "Vendez l'accès à vos canaux VIP. Le bot l'ajoute automatiquement et le retire à l'expiration.",
    icon: <MessageCircle size={28} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-[#0A1F1A] border-white/5",
    textClass: "text-white",
    descClass: "text-emerald-100/60",
    iconClass: "bg-turquoise/20 text-turquoise border border-turquoise/30",
    eff: "bg-turquoise/20 blur-3xl -bottom-10 -right-10",
  },
  {
    title: "Upsell 1-Click",
    desc: "Boostez immédiatement votre panier moyen. Une offre irréstistible juste après l'achat. Zéro friction.",
    icon: <Zap size={28} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-500",
    iconClass: "bg-amber-50 text-amber-500",
  },
  {
    title: "Workflows & Automatisations",
    desc: "Relances WhatsApp, Emails de bienvenue, et récupération de paniers abandonnés sur pilote automatique.",
    icon: <Repeat size={28} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-500",
    iconClass: "bg-pink-50 text-pink-500",
  },
  {
    title: "Wallet Intégré",
    desc: "Votre argent disponible en temps réel. Retraits gratuits vers Wave ou Orange Money dès 5 000 FCFA.",
    icon: <Wallet size={28} />,
    col: "md:col-span-2 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-[#FAFAF7] border-[#0A1F1A]/10",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-600",
    iconClass: "bg-gold/10 text-gold-rich border border-gold/20",
  },
  {
    title: "Pages de Vente",
    desc: "Créateur de landing pages haute conversion intégré. Sans code, ultra rapide sur mobile.",
    icon: <LayoutTemplate size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-500 text-sm",
    iconClass: "bg-turquoise/10 text-turquoise",
  },
  {
    title: "Prise de RDV",
    desc: "Les clients réservent un créneau synchronisé à votre calendrier après paiement.",
    icon: <Calendar size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-[#0A1F1A] border-white/5",
    textClass: "text-white",
    descClass: "text-emerald-100/60 text-sm",
    iconClass: "bg-white/10 text-white",
  },
  {
    title: "Livraisons & Flotte",
    desc: "Routage direct chez vos livreurs avec tarifs dynamiques par zones GPS.",
    icon: <Truck size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-[#FAFAF7] border-[#0A1F1A]/5",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-500 text-sm",
    iconClass: "bg-orange-50 text-orange-500",
  },
  {
    title: "Prix B2B & Lots",
    desc: "Gérez des prix dégressifs (ex: 1 pour 5k, 3 pour 12k) pour liquider les stocks.",
    icon: <Tag size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-500 text-sm",
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Liens de Paiement",
    desc: "Générez un lien direct vers le checkout à envoyer sur WhatsApp.",
    icon: <Link size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-500 text-sm",
    iconClass: "bg-purple-50 text-purple-500",
  },
  {
    title: "Pixels & Meta",
    desc: "Synchronisation Facebook, TikTok & Google Analytics en 1 clic.",
    icon: <BarChart size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-[#0A1F1A] border-white/5",
    textClass: "text-white",
    descClass: "text-emerald-100/60 text-sm",
    iconClass: "bg-emerald/20 text-emerald-light border border-emerald/20",
  },
  {
    title: "Helpdesk & SAV",
    desc: "Centralisez les réclamations clients, retours et remboursements en un seul tableau de bord.",
    icon: <HeadphonesIcon size={24} />,
    col: "md:col-span-2 lg:col-span-2",
    row: "row-span-1",
    theme: "bg-[#1E3A32] border-white/5",
    textClass: "text-white",
    descClass: "text-emerald-100/70 text-sm",
    iconClass: "bg-emerald-500/20 text-emerald-300",
    eff: "bg-emerald-500/20 rounded-bl-[100px] blur-2xl top-0 right-0 h-32 w-32",
  },
  {
    title: "Facturation Auto",
    desc: "Devis professionnels et factures générées et expédiées instantanément.",
    icon: <FileText size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-500 text-sm",
    iconClass: "bg-slate-100 text-slate-600",
  },
  {
    title: "Yayyam Académie",
    desc: "Bibliothèque de formations premium In-App pour exploser vos ventes e-commerce.",
    icon: <GraduationCap size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-gold border-gold-rich/30 shadow-lg",
    textClass: "text-amber-950",
    descClass: "text-amber-900/80 text-sm",
    iconClass: "bg-white/30 text-amber-950 border border-white/50",
  }
];

export function BentoGrid({ title, supertitle }: BentoGridProps) {
  return (
    <section id="features" className="py-32 bg-[#FAFAF7] overflow-hidden relative border-y border-[rgba(0,0,0,0.05)]">
      <div className="absolute top-0 right-1/4 w-[1000px] h-[1000px] bg-emerald-500/5 blur-[200px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-gold/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full mx-auto max-w-[1800px] px-6 md:px-12 lg:px-20 relative z-10">
        <div className="text-center mb-24 max-w-4xl mx-auto">
          <Reveal>
            <span className="text-emerald-700 font-mono tracking-widest uppercase text-sm mb-6 block font-bold">
              {supertitle}
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight text-[#0A1F1A] leading-[1.1]">
              {title}
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 text-xl text-gray-500 mx-auto max-w-2xl font-light">
              Le premier écosystème e-commerce d'Afrique qui rassemble <strong>absolument tous</strong> les outils de croissance dans un seul espace.
            </p>
          </Reveal>
        </div>

        {/* Bento Board Start */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[auto] gap-4 md:gap-6">
          {features.map((f, i) => (
            <Reveal 
              key={i}
              delay={i * 0.05}
              className={`${f.col} ${f.row} ${f.theme} rounded-[2rem] p-6 md:p-8 overflow-hidden relative group transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl border`}
            >
              {f.eff && (
                <div className={`absolute ${f.eff} w-64 h-64 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-700`}></div>
              )}
              
              <div className={`relative z-10 h-full flex flex-col ${f.center ? 'items-center text-center justify-center' : 'justify-between'}`}>
                <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center mb-6 shrink-0 transition-transform duration-300 group-hover:scale-110 ${f.iconClass} ${f.center ? 'w-20 h-20 rounded-[1.5rem] mb-8' : ''}`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className={`text-xl font-display font-bold mb-2 ${f.textClass} ${f.center ? 'text-4xl mb-4 xl:text-5xl' : ''}`}>
                    {f.title}
                  </h3>
                  <p className={`font-medium leading-relaxed ${f.descClass || 'text-gray-500'} ${f.center ? 'max-w-md mx-auto' : ''}`}>
                    {f.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
