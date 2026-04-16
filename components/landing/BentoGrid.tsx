'use client'
import Image from 'next/image'

import React, { useRef, useEffect, useState } from 'react'
import { 
  Store, Sparkles, Globe, MessageCircle, Zap, Repeat, Wallet, 
  LayoutTemplate, Calendar, Truck, Tag, Link, BarChart, 
  HeadphonesIcon, FileText, GraduationCap, Shield
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
    // eslint-disable-next-line
    <div
      ref={ref}
      className={className}
      // eslint-disable-next-line react/forbid-dom-props
      {...({
        style: {
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
        }
      } as any)}
    >
      {children}
    </div>
  )
}

interface FeatureItem {
  title: string;
  desc: string;
  icon: JSX.Element;
  col: string;
  row: string;
  theme: string;
  textClass: string;
  iconClass: string;
  eff?: string;
  descClass?: string;
  center?: boolean;
  image?: string;
}

const features: FeatureItem[] = [
  {
    title: "La Boutique Ultime",
    desc: "L'App Store Yayyam intègre tous vos outils de vente. Oubliez Shopify et son abonnement mensuel : gérez tout au même endroit sans friction.",
    icon: <Store size={32} />,
    col: "md:col-span-2 lg:col-span-2 xl:col-span-1",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5 hover:border-emerald-500/20 shadow-sm overflow-hidden",
    textClass: "text-[#0A1F1A]",
    iconClass: "bg-[#0A1F1A] text-white relative z-10",
    eff: "bg-gradient-to-tr from-emerald-500/10 to-teal-400/5 blur-3xl",
    image: "/landing/bento_store_mockup.png",
  },
  {
    title: "Le Marché XOF/XAF",
    desc: "Cameroun, Sénégal, Côte d'Ivoire... Encaissez en direct avec Wave, Orange Money, CinetPay. Le système adapte automatiquement Franc CFA, XOF ou XAF.",
    icon: <Globe size={40} />,
    col: "md:col-span-2 lg:col-span-2 xl:col-span-2",
    row: "row-span-1",
    theme: "bg-[#0D5C4A] shadow-xl overflow-hidden",
    textClass: "text-white relative z-20 w-[60%]",
    descClass: "text-emerald-100/90 text-sm md:text-base relative z-20",
    iconClass: "bg-emerald-500/20 backdrop-blur-xl border border-white/20 text-white rounded-[1.5rem] relative z-20",
    image: "/landing/bento_market_xof.png",
  },
  {
    title: "Anti-Fraude COD",
    desc: "Filtrez 100% des plaisantins avec le Hub SMS. Validation OTP des commandes.",
    icon: <Shield size={28} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-[#7A1F2D] shadow-lg overflow-hidden",
    textClass: "text-white relative z-20",
    descClass: "text-red-100/80 text-xs md:text-sm relative z-20",
    iconClass: "bg-red-500/20 text-red-200 border border-red-500/30 relative z-20",
    image: "/landing/bento_anti_fraud_otp.png",
  },
  {
    title: "Coach IA & Générateur",
    desc: "Copilot IA natif : Check360° pour auditer vos ventes, générer vos fiches produits et relancer vos clients.",
    icon: <Sparkles size={28} />,
    col: "md:col-span-2 lg:col-span-2",
    row: "row-span-1",
    theme: "bg-[#05141A] shadow-2xl overflow-hidden",
    textClass: "text-white relative z-20",
    descClass: "text-cyan-100/70 relative z-20",
    iconClass: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 relative z-20",
    image: "/landing/bento_ai_coach.png",
  },
  {
    title: "Bot WhatsApp",
    desc: "Récupération de paniers via SMS et relances automatisées sur WhatsApp. Vos ventes explosent en dormant.",
    icon: <Repeat size={28} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-[#25D366]/10 border-[#25D366]/20",
    textClass: "text-[#075E54]",
    descClass: "text-[#128C7E]",
    iconClass: "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30",
  },
  {
    title: "Groupes Telegram Privés",
    desc: "Monétisez l'accès à vos canaux VIP. Le système automatise les invitations post-achat.",
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
    title: "Agence & Affiliation",
    desc: "Un réseau massif de Closers et d'affiliés prêts à vendre vos produits pour une commission.",
    icon: <HeadphonesIcon size={24} />,
    col: "md:col-span-2 xl:col-span-2",
    row: "row-span-1",
    theme: "bg-[#062114] shadow-xl overflow-hidden",
    textClass: "text-white relative z-20 w-[70%]",
    descClass: "text-gold/70 text-sm relative z-20 w-[90%]",
    iconClass: "bg-gold/10 text-gold-light border border-gold/20 relative z-20",
    image: "/landing/bento_closing.png",
  },
  {
    title: "Notion & Zapier Webhooks",
    desc: "Connectez vos données en temps réel aux outils que vous aimez via nos Webhooks pro.",
    icon: <Link size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-500 text-sm",
    iconClass: "bg-slate-100 text-slate-800",
  },
  {
    title: "Wallet Franc CFA",
    desc: "Gains express. Retraits quotidiens de vos ventes vers Wave ou Orange Money dès 5 000 FCFA atteints.",
    icon: <Wallet size={28} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-[#FAFAF7] border-[#0A1F1A]/10",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-600 font-bold",
    iconClass: "bg-gold/10 text-gold-rich border border-gold/20",
  },
  {
    title: "Pixels & Meta Capi",
    desc: "Tracking serveur ultra-précis (Facebook, Google) pour éviter la perte de données iOS 14+.",
    icon: <BarChart size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-[#0A1F1A] border-white/5",
    textClass: "text-white",
    descClass: "text-emerald-100/60 text-sm",
    iconClass: "bg-emerald/20 text-emerald-light border border-emerald/20",
  },
  {
    title: "Link-in-Bio",
    desc: "Votre arbre de liens (Biolink) optimisé pour l'achat, prêt pour Instagram et TikTok.",
    icon: <LayoutTemplate size={24} />,
    col: "md:col-span-1 lg:col-span-1",
    row: "row-span-1",
    theme: "bg-white border-[#0A1F1A]/5",
    textClass: "text-[#0A1F1A]",
    descClass: "text-gray-500 text-sm",
    iconClass: "bg-purple-100 text-purple-600",
  },
  {
    title: "Yayyam Académie",
    desc: "Des Masterclasses premium pour tout maîtriser : publicités, création d'offres et growth hacking.",
    icon: <GraduationCap size={24} />,
    col: "md:col-span-2 lg:col-span-2 xl:col-span-2",
    row: "row-span-1",
    theme: "bg-gold border-gold-rich/30 shadow-lg",
    textClass: "text-amber-950",
    descClass: "text-amber-900/80 text-sm font-medium",
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
              {/* Effet / Image de Fond */}
              {f.image && (
                <div className="absolute top-0 right-0 w-[55%] h-full opacity-90 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10"></div>
                  <Image src={f.image} alt={f.title} fill className="object-cover object-left" unoptimized />
                </div>
              )}
              {!f.image && f.eff && (
                <div className={`absolute ${f.eff} w-64 h-64 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-700`}></div>
              )}
              
              <div className={`relative z-20 h-full flex flex-col ${f.image ? 'w-[65%]' : ''} ${f.center ? 'items-center text-center justify-center' : 'justify-between'}`}>
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
