import React from 'react'
import Link from 'next/link'

export interface Section {
  type: string
  title?: string
  subtitle?: string
  cta?: string
  text?: string
  items?: string[] | Array<{ q?: string; a?: string; name?: string; text?: string; rating?: number }>
  name?: string
  bio?: string
  credentials?: string[]
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  type: string
  images: string[]
}

export interface Theme {
  color: 'orange' | 'blue' | 'rose' | 'emerald' | 'ink' | 'ruby' | 'sapphire' | 'amethyst' | 'gold' | 'midnight' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'coral' | 'mint' | 'sand' | 'slate' | 'matcha' | 'indigo' | 'violet' | 'magenta' | 'cherry' | 'clay' | 'zinc'
  font: 'sans' | 'serif' | 'mono'
}

type ThemeColors = {
  bgPrimary: string
  bgHover: string
  textPrimary: string
  bgLight: string
  gradient: string
  glow: string
  shadow: string
}

export const THEME_MAP: Record<Theme['color'], ThemeColors> = {
  orange: { bgPrimary: 'bg-orange-500', bgHover: 'hover:bg-orange-600', textPrimary: 'text-orange-500', bgLight: 'bg-orange-50', gradient: 'from-orange-500 to-amber-500', glow: 'bg-orange-500', shadow: 'shadow-orange-500/30' },
  blue: { bgPrimary: 'bg-blue-600', bgHover: 'hover:bg-blue-700', textPrimary: 'text-blue-600', bgLight: 'bg-blue-50', gradient: 'from-blue-600 to-indigo-600', glow: 'bg-blue-600', shadow: 'shadow-blue-600/30' },
  rose: { bgPrimary: 'bg-rose-500', bgHover: 'hover:bg-rose-600', textPrimary: 'text-rose-500', bgLight: 'bg-rose-50', gradient: 'from-rose-500 to-pink-500', glow: 'bg-rose-500', shadow: 'shadow-rose-500/30' },
  emerald: { bgPrimary: 'bg-emerald-600', bgHover: 'hover:bg-emerald-700', textPrimary: 'text-emerald-600', bgLight: 'bg-emerald-50', gradient: 'from-emerald-500 to-teal-600', glow: 'bg-emerald-500', shadow: 'shadow-emerald-600/30' },
  ink: { bgPrimary: 'bg-gray-900', bgHover: 'hover:bg-black', textPrimary: 'text-gray-900', bgLight: 'bg-gray-100', gradient: 'from-gray-800 to-black', glow: 'bg-gray-500', shadow: 'shadow-gray-900/30' },
  ruby: { bgPrimary: 'bg-red-600', bgHover: 'hover:bg-red-700', textPrimary: 'text-red-600', bgLight: 'bg-red-50', gradient: 'from-red-600 to-rose-600', glow: 'bg-red-600', shadow: 'shadow-red-600/30' },
  sapphire: { bgPrimary: 'bg-blue-700', bgHover: 'hover:bg-blue-800', textPrimary: 'text-blue-700', bgLight: 'bg-blue-100', gradient: 'from-blue-700 to-indigo-700', glow: 'bg-blue-700', shadow: 'shadow-blue-700/30' },
  amethyst: { bgPrimary: 'bg-purple-600', bgHover: 'hover:bg-purple-700', textPrimary: 'text-purple-600', bgLight: 'bg-purple-50', gradient: 'from-purple-600 to-fuchsia-600', glow: 'bg-purple-600', shadow: 'shadow-purple-600/30' },
  gold: { bgPrimary: 'bg-yellow-500', bgHover: 'hover:bg-yellow-600', textPrimary: 'text-yellow-600', bgLight: 'bg-yellow-50', gradient: 'from-yellow-400 to-amber-500', glow: 'bg-yellow-500', shadow: 'shadow-yellow-500/30' },
  midnight: { bgPrimary: 'bg-slate-900', bgHover: 'hover:bg-black', textPrimary: 'text-slate-900', bgLight: 'bg-slate-100', gradient: 'from-slate-800 to-slate-900', glow: 'bg-slate-700', shadow: 'shadow-slate-900/30' },
  ocean: { bgPrimary: 'bg-cyan-600', bgHover: 'hover:bg-cyan-700', textPrimary: 'text-cyan-600', bgLight: 'bg-cyan-50', gradient: 'from-cyan-500 to-blue-500', glow: 'bg-cyan-500', shadow: 'shadow-cyan-600/30' },
  forest: { bgPrimary: 'bg-green-700', bgHover: 'hover:bg-green-800', textPrimary: 'text-green-700', bgLight: 'bg-green-50', gradient: 'from-green-600 to-emerald-700', glow: 'bg-green-600', shadow: 'shadow-green-700/30' },
  sunset: { bgPrimary: 'bg-orange-600', bgHover: 'hover:bg-orange-700', textPrimary: 'text-orange-600', bgLight: 'bg-orange-50', gradient: 'from-orange-500 to-rose-500', glow: 'bg-orange-600', shadow: 'shadow-orange-600/30' },
  lavender: { bgPrimary: 'bg-indigo-400', bgHover: 'hover:bg-indigo-500', textPrimary: 'text-indigo-500', bgLight: 'bg-indigo-50', gradient: 'from-indigo-400 to-purple-400', glow: 'bg-indigo-400', shadow: 'shadow-indigo-400/30' },
  coral: { bgPrimary: 'bg-rose-400', bgHover: 'hover:bg-rose-500', textPrimary: 'text-rose-500', bgLight: 'bg-rose-50', gradient: 'from-rose-400 to-orange-400', glow: 'bg-rose-400', shadow: 'shadow-rose-400/30' },
  mint: { bgPrimary: 'bg-teal-400', bgHover: 'hover:bg-teal-500', textPrimary: 'text-teal-500', bgLight: 'bg-teal-50', gradient: 'from-teal-400 to-emerald-400', glow: 'bg-teal-400', shadow: 'shadow-teal-400/30' },
  sand: { bgPrimary: 'bg-amber-200', bgHover: 'hover:bg-amber-300', textPrimary: 'text-amber-600', bgLight: 'bg-amber-50', gradient: 'from-amber-200 to-yellow-300', glow: 'bg-amber-200', shadow: 'shadow-amber-200/30' },
  slate: { bgPrimary: 'bg-slate-600', bgHover: 'hover:bg-slate-700', textPrimary: 'text-slate-600', bgLight: 'bg-slate-50', gradient: 'from-slate-500 to-gray-600', glow: 'bg-slate-500', shadow: 'shadow-slate-600/30' },
  matcha: { bgPrimary: 'bg-lime-600', bgHover: 'hover:bg-lime-700', textPrimary: 'text-lime-700', bgLight: 'bg-lime-50', gradient: 'from-lime-500 to-green-500', glow: 'bg-lime-500', shadow: 'shadow-lime-600/30' },
  indigo: { bgPrimary: 'bg-indigo-600', bgHover: 'hover:bg-indigo-700', textPrimary: 'text-indigo-600', bgLight: 'bg-indigo-50', gradient: 'from-indigo-600 to-blue-700', glow: 'bg-indigo-600', shadow: 'shadow-indigo-600/30' },
  violet: { bgPrimary: 'bg-violet-600', bgHover: 'hover:bg-violet-700', textPrimary: 'text-violet-600', bgLight: 'bg-violet-50', gradient: 'from-violet-500 to-purple-600', glow: 'bg-violet-600', shadow: 'shadow-violet-600/30' },
  magenta: { bgPrimary: 'bg-fuchsia-600', bgHover: 'hover:bg-fuchsia-700', textPrimary: 'text-fuchsia-600', bgLight: 'bg-fuchsia-50', gradient: 'from-fuchsia-500 to-pink-600', glow: 'bg-fuchsia-600', shadow: 'shadow-fuchsia-600/30' },
  cherry: { bgPrimary: 'bg-rose-700', bgHover: 'hover:bg-rose-800', textPrimary: 'text-rose-700', bgLight: 'bg-rose-100', gradient: 'from-rose-600 to-red-700', glow: 'bg-rose-700', shadow: 'shadow-rose-700/30' },
  clay: { bgPrimary: 'bg-amber-700', bgHover: 'hover:bg-amber-800', textPrimary: 'text-amber-700', bgLight: 'bg-amber-100', gradient: 'from-amber-600 to-orange-700', glow: 'bg-amber-600', shadow: 'shadow-amber-700/30' },
  zinc: { bgPrimary: 'bg-zinc-600', bgHover: 'hover:bg-zinc-700', textPrimary: 'text-zinc-600', bgLight: 'bg-zinc-50', gradient: 'from-zinc-500 to-slate-600', glow: 'bg-zinc-500', shadow: 'shadow-zinc-600/30' }
}

export const FONT_MAP: Record<Theme['font'], string> = {
  sans: 'font-sans',
  serif: 'font-serif tracking-wide',
  mono: 'font-mono'
}

export const DEFAULT_THEME: Theme = { color: 'orange', font: 'sans' }

export function PageRendererConfig({ theme, children }: { theme: Theme, children: React.ReactNode }) {
  return (
    <div className={`w-full min-h-screen ${FONT_MAP[theme.font] || FONT_MAP.sans} text-gray-900 bg-white selection:bg-${theme.color}-100`}>
      {children}
    </div>
  )
}

export function HeroSection({ s, products, cta, theme = DEFAULT_THEME }: { s: Section; products: Product[]; cta: string; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-20 px-6 text-center overflow-hidden">
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 ${colors.glow} opacity-10 rounded-full blur-3xl pointer-events-none`} />

      <div className="relative max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
          {s.title || 'Bienvenue'}
        </h1>
        {s.subtitle && <p className="text-gray-300 text-lg leading-relaxed">{s.subtitle}</p>}

        {products.length > 0 && (
          <div className="space-y-3 mt-8">
            {products.map(p => (
              <a
                key={p.id}
                href={`#product-${p.id}`}
                className={`block ${colors.bgPrimary} ${colors.bgHover} text-white font-bold py-4 px-8 rounded-2xl text-lg transition shadow-lg ${colors.shadow}`}
              >
                {s.cta || cta} — {p.price.toLocaleString('fr-FR')} FCFA
              </a>
            ))}
          </div>
        )}
        {products.length === 0 && s.cta && (
          <a href="#contact"
            className={`inline-block ${colors.bgPrimary} ${colors.bgHover} text-white font-bold py-4 px-10 rounded-2xl text-lg transition shadow-lg ${colors.shadow}`}>
            {s.cta}
          </a>
        )}
      </div>
    </section>
  )
}

export function BenefitsSection({ s, theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  const items = (s.items as string[] | undefined) || []
  if (items.length === 0) return null
  return (
    <section className="py-14 px-6 bg-white">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Pourquoi nous choisir ?</h2>
        <div className="grid grid-cols-1 gap-4">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center gap-4 ${colors.bgLight} rounded-2xl p-4`}>
              <div className={`w-8 h-8 ${colors.bgPrimary} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>✓</div>
              <span className="text-gray-800 font-medium">{typeof item === 'string' ? item : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection({ s, theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  const items = (s.items as Array<{ name: string; text: string; rating: number }> | undefined) || []
  if (items.length === 0) return null
  
  // Calculate average rating for Trustpilot-like summary
  const avg = items.reduce((acc, curr) => acc + (curr.rating || 5), 0) / items.length
  
  return (
    <section className="py-20 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Ce que disent nos clients</h2>
        
        {/* Résumé Trustpilot-like */}
        <div className="bg-white rounded-3xl p-8 mb-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="text-center md:text-left flex-shrink-0">
            <p className="text-6xl font-black text-gray-900 mb-2">{avg.toFixed(1)}</p>
            <div className={`text-2xl ${colors.textPrimary} flex mb-2 justify-center md:justify-start`}>
               ★★★★★
            </div>
            <p className="text-sm font-bold text-gray-500">Basé sur {items.length * 3 + 12} avis</p>
          </div>
          
          <div className="flex-1 w-full space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const percentage = star === 5 ? 85 : star === 4 ? 10 : star === 3 ? 3 : star === 2 ? 1 : 1
              return (
                <div key={star} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <span className="w-10">{star} <span className="text-gray-300">★</span></span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${star >= 4 ? colors.bgPrimary : 'bg-gray-300'} rounded-full`} style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="w-10 text-right text-gray-400">{percentage}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Liste des avis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-50">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-lg">
                   {t.name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <p className="text-base font-bold text-gray-900 flex items-center gap-2">
                     {t.name}
                     <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                        <span className="font-sans">✓</span> Achat vérifié
                     </span>
                   </p>
                   <div className="flex items-center gap-1 mt-1">
                     {'★★★★★'.split('').map((star, si) => (
                       <span key={si} className={`text-sm ${si < (t.rating || 5) ? colors.textPrimary : 'text-gray-200'}`}>{star}</span>
                     ))}
                   </div>
                 </div>
              </div>
              <p className="text-gray-600 text-base leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FaqSection({ s }: { s: Section; theme?: Theme }) {
  const items = (s.items as Array<{ q: string; a: string }> | undefined) || []
  if (items.length === 0) return null
  return (
    <section className="py-14 px-6 bg-white border-t border-gray-50">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Questions fréquentes</h2>
        <div className="space-y-4">
          {items.map((qa, i) => (
            <div key={i} className="border border-gray-100 bg-gray-50/50 rounded-2xl p-6">
              <p className="font-bold text-gray-900 mb-2">{qa.q}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{qa.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProgramSection({ s, theme: _theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const items = (s.items as string[] | undefined) || []
  if (items.length === 0) return null
  return (
    <section className="py-14 px-6 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Programme détaillé</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
              <span className="text-gray-800 font-medium">{typeof item === 'string' ? item : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ImageGallerySection({ s, theme: _theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  return (
    <section className="py-12 px-6 bg-white">
      <div className="max-w-xl mx-auto text-center">
        {s.text && <p className="text-gray-600 font-medium">{s.text}</p>}
      </div>
    </section>
  )
}

export function CoachProfileSection({ s, theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  const creds = s.credentials || []
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <div className={`w-24 h-24 mx-auto ${colors.bgLight} rounded-full flex items-center justify-center text-4xl`}>👤</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{s.name || 'Votre Coach'}</h2>
          {s.bio && <p className="text-gray-600 mt-4 leading-relaxed max-w-md mx-auto">{s.bio}</p>}
        </div>
        {creds.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            {creds.map((c, i) => (
               <span key={i} className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${colors.bgLight} ${colors.textPrimary}`}>
                 {c}
               </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function CtaSection({ s, products, theme = DEFAULT_THEME }: { s: Section; products: Product[]; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  return (
    <section className={`py-16 px-6 bg-gradient-to-r ${colors.gradient} text-white text-center`}>
      <div className="max-w-xl mx-auto space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold leading-tight">{s.cta || 'Passer commande maintenant'}</h2>
        {products.length > 0 && (
          <div className="space-y-3 pt-4">
             {products.map(p => (
              <a
                key={p.id}
                href={`#product-${p.id}`}
                className="block bg-white text-gray-900 font-bold py-4 px-8 rounded-2xl text-lg hover:bg-gray-50 transition shadow-lg"
              >
                Commander — {p.price.toLocaleString('fr-FR')} FCFA
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function ProductCards({ products, theme = DEFAULT_THEME }: { products: Product[]; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  if (products.length === 0) return null
  return (
    <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Nos produits</h2>
        <div className="space-y-6">
          {products.map(p => (
            <div key={p.id} id={`product-${p.id}`} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
              {p.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0]} alt={p.name} className="w-full h-56 object-cover" />
              )}
              <div className="p-6 md:p-8 space-y-4">
                <h3 className="font-bold text-gray-900 text-xl">{p.name}</h3>
                {p.description && <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>}
                
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className={`text-3xl font-black ${colors.textPrimary}`}>
                    {p.price.toLocaleString('fr-FR')} <span className="text-lg font-bold">FCFA</span>
                  </span>
                  <Link
                    href={`?checkout=${p.id}`}
                    scroll={false}
                    className={`text-center ${colors.bgPrimary} ${colors.bgHover} text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg ${colors.shadow}`}
                  >
                    Acheter
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function GenericSection({ s }: { s: Section }) {
  if (!s.text) return null
  return (
    <section className="py-12 px-6 bg-white">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-gray-600 leading-relaxed text-lg">{s.text}</p>
      </div>
    </section>
  )
}

export function CountdownSection({ s, theme: _theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  return (
    <section className="py-14 px-6 bg-red-50 border-y border-red-100">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h2 className="text-2xl font-black text-red-600 uppercase tracking-wide flex items-center justify-center gap-2">
           <span className="animate-pulse">⏳</span> {s.title || 'Offre Limitée'}
        </h2>
        {s.subtitle && <p className="text-red-800 font-medium">{s.subtitle}</p>}
        
        <div className="flex justify-center gap-4">
          <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-red-100 min-w-[70px]">
            <span className="block text-3xl font-black text-red-600">02</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Heures</span>
          </div>
          <div className="text-3xl font-black text-red-300 py-3">:</div>
          <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-red-100 min-w-[70px]">
            <span className="block text-3xl font-black text-red-600">14</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Minutes</span>
          </div>
          <div className="text-3xl font-black text-red-300 py-3">:</div>
          <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-red-100 min-w-[70px]">
            <span className="block text-3xl font-black text-red-600 " dangerouslySetInnerHTML={{__html: '59'}} />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secondes</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ComparisonSection({ s, theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  const items = (s.items as Array<{ name?: string; text?: string }>) || []
  
  const pros = items.find(i => i.name === 'Nous') || { name: 'Notre Solution', text: 'Efficace, Rapide, Rentable' }
  const cons = items.find(i => i.name !== 'Nous') || { name: 'Les Autres', text: 'Lent, Cher, Complexe' }

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">{s.title || 'Pourquoi nous choisir ?'}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          {/* Les Autres (Cons) */}
          <div className="bg-gray-50 p-8 md:px-12 md:py-10 border-r border-gray-100">
            <h3 className="text-xl font-bold text-gray-500 mb-6 flex items-center gap-2">
               <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-black">X</span>
               {cons.name || 'La Concurrence'}
            </h3>
            <ul className="space-y-4">
              {(cons.text || 'Lent, Cher').split(',').map((item, i) => (
                <li key={i} className="flex gap-3 text-gray-400 font-medium">
                  <span className="text-red-400 flex-shrink-0">✖</span> {item.trim()}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Nous (Pros) */}
          <div className={`${colors.bgLight} p-8 md:px-12 md:py-10 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${colors.glow} opacity-10 rounded-full blur-3xl`} />
            <h3 className={`text-xl font-bold ${colors.textPrimary} mb-6 flex items-center gap-2 relative z-10`}>
               <span className={`w-8 h-8 rounded-full ${colors.bgPrimary} flex items-center justify-center text-white text-sm font-black`}>✓</span>
               {pros.name || 'Notre Produit'}
            </h3>
            <ul className="space-y-4 relative z-10">
              {(pros.text || 'Rapide, Efficace').split(',').map((item, i) => (
                <li key={i} className="flex gap-3 font-bold text-gray-900">
                  <span className={`${colors.textPrimary} flex-shrink-0`}>✔</span> {item.trim()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export function VideoGallerySection({ s, theme: _theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const videos = (s.items as string[]) || []
  if (videos.length === 0) return null

  return (
    <section className="py-16 px-6 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{s.title || 'Découvrez le produit en vidéo'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {videos.map((_vid, i) => (
             <div key={i} className="aspect-[9/16] bg-gray-800 rounded-2xl overflow-hidden relative shadow-lg group">
                {/* Fallback Placeholder (Dans la vraie vie on embed TikTok/Youtube here) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3 group-hover:scale-110 transition-transform duration-500">
                   <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                     <span className="text-3xl ml-1">▶</span>
                   </div>
                   <p className="text-xs font-bold uppercase tracking-widest">{s.subtitle || 'Voir la vidéo'}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </section>
  )
}

export function CrossSellSection({ products, theme = DEFAULT_THEME }: { products: Product[]; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  if (!products || products.length === 0) return null
  
  return (
    <section className="py-16 px-6 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Découvrez aussi d'autres pépites</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition group">
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-base truncate mb-3">{p.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="font-black text-gray-900">{p.price.toLocaleString('fr-FR')} FCFA</span>
                  <Link
                    href={`?checkout=${p.id}&cross_sell=true`}
                    scroll={false}
                    className={`text-xs font-bold text-white px-4 py-2 rounded-lg ${colors.bgPrimary} ${colors.bgHover} shadow-sm transition-transform active:scale-95`}
                  >
                    Ajouter
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
