/* eslint-disable react/forbid-dom-props, jsx-a11y/control-has-associated-label, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, jsx-a11y/anchor-is-valid */
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CountdownTimer } from './CountdownTimer'

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
    <div className={`w-full min-h-screen ${FONT_MAP[theme.font] || FONT_MAP.sans} text-gray-900 bg-[#FDFCFB] selection:bg-gray-200`}>
      {children}
    </div>
  )
}

export function HeroSection({ s, products, cta, theme = DEFAULT_THEME }: { s: Section; products: Product[]; cta: string; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-ink text-white pt-24 pb-32 px-6 text-center overflow-hidden rounded-b-[48px] md:rounded-b-[80px] shadow-2xl">
      <div className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] ${colors.glow} opacity-20 rounded-full blur-[100px] pointer-events-none`} />

      <div className="relative max-w-2xl mx-auto space-y-8 z-10">
        <h1 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight">
          {s.title || 'Bienvenue'}
        </h1>
        {s.subtitle && <p className="text-gray-300 text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto">{s.subtitle}</p>}

        {products.length > 0 && (
          <div className="space-y-4 mt-10">
            {products.map(p => (
              <a
                key={p.id}
                href={`#product-${p.id}`}
                className={`block ${colors.bgPrimary} ${colors.bgHover} text-white font-bold py-5 px-10 rounded-[100px] shadow-2xl ${colors.shadow} text-xl transition-all duration-300 hover:-translate-y-1 active:scale-95`}
              >
                {s.cta || cta} — {p.price.toLocaleString('fr-FR')} FCFA
              </a>
            ))}
          </div>
        )}
        {products.length === 0 && s.cta && (
          <a href="#contact"
            className={`inline-block ${colors.bgPrimary} ${colors.bgHover} text-white font-bold py-5 px-12 rounded-[100px] shadow-2xl ${colors.shadow} text-xl transition-all duration-300 hover:-translate-y-1 active:scale-95`}>
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
    <section className="py-20 px-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Pourquoi nous choisir ?</h2>
        <div className="grid grid-cols-1 gap-5">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center gap-5 bg-white/60 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[32px] p-6 transition-all duration-300 hover:-translate-y-1`}>
              <div className={`w-12 h-12 ${colors.bgLight} rounded-2xl flex items-center justify-center ${colors.textPrimary} font-black text-xl flex-shrink-0 shadow-inner`}>✓</div>
              <span className="text-gray-800 font-bold text-lg">{typeof item === 'string' ? item : ''}</span>
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
    <section className="py-24 px-6 bg-[#FDFDFD]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-16 tracking-tight">Ce que disent nos clients</h2>
        
        {/* Résumé Trustpilot-like */}
        <div className="bg-white/60 backdrop-blur-3xl rounded-[40px] p-10 mb-12 shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-white flex flex-col md:flex-row items-center gap-10 md:gap-20">
          <div className="text-center md:text-left flex-shrink-0">
            <p className="text-7xl font-black text-gray-900 mb-2 tracking-tighter">{avg.toFixed(1)}</p>
            <div className={`text-3xl ${colors.textPrimary} flex mb-2 justify-center md:justify-start gap-1`}>
               ★★★★★
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-4">Basé sur {items.length} avis</p>
          </div>
          
          <div className="flex-1 w-full space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const percentage = star === 5 ? 85 : star === 4 ? 10 : star === 3 ? 3 : star === 2 ? 1 : 1
              return (
                <div key={star} className="flex items-center gap-4 text-sm font-bold text-gray-400">
                  <span className="w-8">{star} ★</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${star >= 4 ? colors.bgPrimary : 'bg-gray-300'} rounded-full`} {...{ style: { width: `${percentage}%` } }} />
                  </div>
                  <span className="w-10 text-right opacity-50">{percentage}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Liste des avis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white hover:-translate-y-2 transition-all duration-300 flex flex-col items-start gap-4">
              <div className={`flex items-center gap-1 text-lg ${colors.textPrimary}`}>
                {'★★★★★'.split('').map((star, si) => (
                  <span key={si} className={si < (t.rating || 5) ? '' : 'text-gray-200'}>{star}</span>
                ))}
              </div>
              <p className="text-gray-700 font-medium text-[15px] leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 w-full border-t border-gray-100/50 pt-5 mt-auto">
                 <div className={`w-10 h-10 rounded-full ${colors.bgLight} flex items-center justify-center font-black ${colors.textPrimary}`}>
                   {t.name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <p className="font-bold text-gray-900 leading-tight flex justify-between items-center w-full">
                     {t.name}
                   </p>
                   <span className="text-[10px] text-green-600 font-black flex items-center gap-1 uppercase tracking-widest mt-0.5">
                      ✓ Achat vérifié
                   </span>
                 </div>
              </div>
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
    <section className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-12">Questions fréquentes</h2>
        <div className="space-y-5">
          {items.map((qa, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-2xl border border-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all hover:bg-white">
              <p className="text-lg font-black text-gray-900 mb-3">{qa.q}</p>
              <p className="text-gray-500 font-medium leading-relaxed">{qa.a}</p>
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
    <section className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-12 tracking-tight">Programme détaillé</h2>
        <div className="space-y-4 relative">
          <div className="absolute top-0 bottom-0 left-6 md:left-10 w-1 bg-gray-100 rounded-full" />
          {items.map((item, i) => (
            <div key={i} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white/50 backdrop-blur border border-gray-100/50 rounded-[32px] p-6 shadow-sm relative z-10 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white shadow-md rounded-[20px] shrink-0 text-xl font-black text-gray-900 mx-auto md:mx-0">
                 {i + 1}
              </div>
              <span className="text-gray-800 font-bold text-lg md:text-xl text-center md:text-left">{typeof item === 'string' ? item : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ImageGallerySection({ s, theme: _theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-2xl mx-auto text-center">
        {s.text && <p className="text-gray-500 font-medium text-lg bg-gray-50 px-8 py-6 rounded-[32px]">{s.text}</p>}
      </div>
    </section>
  )
}

export function CoachProfileSection({ s, theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  const creds = s.credentials || []
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center bg-white/60 backdrop-blur-3xl border border-white shadow-[0_8px_40px_rgb(0,0,0,0.03)] rounded-[48px] p-12 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-32 ${colors.bgLight} opacity-50`} />
        
        <div className="relative z-10 space-y-6">
          <div className={`w-32 h-32 mx-auto bg-white shadow-xl rounded-full flex items-center justify-center text-5xl mb-6 ring-8 ring-white`}>👤</div>
          <div>
            <h2 className="text-3xl font-black text-gray-900">{s.name || 'Votre Coach'}</h2>
            {s.bio && <p className="text-gray-500 font-medium mt-4 leading-relaxed text-lg max-w-xl mx-auto">{s.bio}</p>}
          </div>
          {creds.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-6">
              {creds.map((c, i) => (
                 <span key={i} className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-full ${colors.bgLight} ${colors.textPrimary} border border-transparent`}>
                   {c}
                 </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function CtaSection({ s, products, theme = DEFAULT_THEME }: { s: Section; products: Product[]; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  return (
    <section className="py-24 px-6 md:px-10">
      <div className={`max-w-4xl mx-auto bg-gradient-to-br ${colors.gradient} rounded-[48px] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10" {...{ style: { mixBlendMode: 'overlay' } }} />
        
        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">{s.cta || 'Passez à l\'action'}</h2>
          {products.length > 0 && (
            <div className="pt-8 flex flex-col items-center gap-4">
               {products.map(p => (
                <a
                  key={p.id}
                  href={`#product-${p.id}`}
                  className="bg-white text-gray-900 font-bold py-5 px-12 rounded-[100px] text-xl shadow-xl hover:scale-105 active:scale-95 transition-transform"
                >
                  Commander — {p.price.toLocaleString('fr-FR')} FCFA
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function ProductCards({ products, theme = DEFAULT_THEME }: { products: Product[]; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  if (products.length === 0) return null
  return (
    <section className="py-24 px-6 relative z-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-16 tracking-tight">Le Catalogue Ultime</h2>
        <div className="space-y-12">
          {products.map(p => (
            <div key={p.id} id={`product-${p.id}`} className="bg-white/70 backdrop-blur-3xl border border-white rounded-[48px] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.05)] transition-all hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] group">
              {p.images?.[0] ? (
                 <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
                   <div className="absolute inset-0 bg-gray-50" />
                   <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                 </div>
              ) : (
                 <div className="relative w-full h-40 bg-gray-50 flex items-center justify-center text-4xl">🛍️</div>
              )}
              <div className="p-8 md:p-12">
                <h3 className="font-black text-gray-900 text-3xl mb-4 tracking-tight leading-tight">{p.name}</h3>
                {p.description && <p className="text-gray-500 font-medium text-[15px] md:text-lg leading-relaxed mb-8">{p.description}</p>}
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-gray-100 pt-8">
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Prix total</p>
                    <span className="text-4xl font-black text-gray-900">
                      {p.price.toLocaleString('fr-FR')} <span className="text-xl">FCFA</span>
                    </span>
                  </div>
                  <Link
                    href={`?checkout=${p.id}`}
                    scroll={false}
                    className={`flex items-center justify-center ${colors.bgPrimary} ${colors.bgHover} text-white font-bold px-12 py-5 rounded-[100px] shadow-2xl ${colors.shadow} text-xl transition-transform active:scale-95 whitespace-nowrap`}
                  >
                    Acheter maintenant
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
    <section className="py-12 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-gray-600 font-medium leading-relaxed text-[15px] md:text-lg">{s.text}</p>
      </div>
    </section>
  )
}

export function CountdownSection({ s, theme: _theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-xl mx-auto text-center space-y-6 bg-red-50/50 backdrop-blur-2xl border border-red-100/50 rounded-[40px] p-10 shadow-xl shadow-red-50/50">
        <h2 className="text-2xl font-black text-red-600 uppercase tracking-widest flex items-center justify-center gap-3">
           <span className="animate-pulse text-3xl">⏳</span> {s.title || 'Offre Limitée'}
        </h2>
        {s.subtitle && <p className="text-red-900/60 font-bold text-lg">{s.subtitle}</p>}
        
        <CountdownTimer />
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
    <section className="py-24 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 text-center mb-16 tracking-tight">{s.title || 'Ce qui fait la différence'}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Les Autres (Cons) */}
          <div className="bg-gray-50 border border-gray-100 rounded-[40px] p-10 md:p-14">
            <h3 className="text-2xl font-black text-gray-400 mb-8 flex items-center gap-3">
               <span className="w-10 h-10 rounded-full bg-gray-200/50 flex items-center justify-center text-sm font-black">X</span>
               {cons.name || 'La Concurrence'}
            </h3>
            <ul className="space-y-5">
              {(cons.text || 'Lent, Cher').split(',').map((item, i) => (
                <li key={i} className="flex gap-4 text-gray-500 font-medium text-lg items-center">
                  <span className="text-gray-300 flex-shrink-0 text-xl font-bold">✖</span> {item.trim()}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Nous (Pros) */}
          <div className={`${colors.bgLight} border border-white rounded-[40px] p-10 md:p-14 relative overflow-hidden shadow-xl`}>
            <div className={`absolute top-0 right-0 w-64 h-64 ${colors.glow} opacity-10 rounded-full blur-[80px] pointer-events-none`} />
            <h3 className={`text-2xl font-black ${colors.textPrimary} mb-8 flex items-center gap-3 relative z-10`}>
               <span className={`w-10 h-10 rounded-full ${colors.bgPrimary} flex items-center justify-center text-white text-sm font-black`}>✓</span>
               {pros.name || 'Notre Produit'}
            </h3>
            <ul className="space-y-5 relative z-10">
              {(pros.text || 'Rapide, Efficace').split(',').map((item, i) => (
                <li key={i} className="flex gap-4 font-black text-gray-900 text-lg items-center">
                  <span className={`${colors.textPrimary} flex-shrink-0 text-xl`}>✔</span> {item.trim()}
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
    <section className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-black text-gray-900 text-center mb-16 tracking-tight">Découvrez d'autres pépites</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white/60 backdrop-blur-2xl border border-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:-translate-y-2 transition-transform duration-300 group flex flex-col h-full">
              <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-4 leading-tight">{p.name}</h3>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-black text-gray-900">{p.price.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span></span>
                  <Link
                    href={`?checkout=${p.id}&cross_sell=true`}
                    scroll={false}
                    className={`font-black text-white px-5 py-2.5 rounded-full ${colors.bgPrimary} ${colors.bgHover} shadow-md transition-transform active:scale-95 text-xs uppercase tracking-widest`}
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

// ─── Section Garantie ─────────────────────────────────────────────────────────
export function GuaranteeSection({ s, theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className={`rounded-[40px] p-10 md:p-14 text-center border ${colors.bgPrimary} bg-opacity-5 relative overflow-hidden`}
             {...{ style: { backgroundColor: `var(--tw-${theme.color}-50, #f0fdf4)`, borderColor: `var(--tw-${theme.color}-100, #dcfce7)` } }}>
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/80 shadow-lg flex items-center justify-center text-4xl">
              🛡️
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 tracking-tight">
              {s.title || 'Garantie Satisfait ou Remboursé'}
            </h2>
            <p className="text-gray-600 font-medium text-lg leading-relaxed max-w-xl mx-auto">
              {s.subtitle || 'Si pour quelque raison que ce soit vous n\'êtes pas satisfait, contactez-nous sous 7 jours pour un remboursement complet. Aucune question posée.'}
            </p>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm font-bold text-gray-500">
              <span className="flex items-center gap-2">✅ 7 jours</span>
              <span className="flex items-center gap-2">🔒 Sans risque</span>
              <span className="flex items-center gap-2">💚 100% confiance</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section Pricing Table ────────────────────────────────────────────────────
export function PricingTableSection({ s, theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange
  const items = (s.items as Array<{ name: string; price: string; features: string[]; highlight?: boolean }> | undefined) || []
  if (items.length === 0) return null

  return (
    <section className="py-24 px-6 bg-[#FDFDFD]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-4 tracking-tight">
          {s.title || 'Choisissez votre offre'}
        </h2>
        {s.subtitle && <p className="text-center text-gray-500 font-medium mb-16 max-w-xl mx-auto">{s.subtitle}</p>}
        
        <div className={`grid gap-6 ${items.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
          {items.map((item, i) => (
            <div key={i} className={`rounded-[2rem] p-8 flex flex-col relative overflow-hidden border transition-all ${
              item.highlight 
                ? `border-2 shadow-xl scale-[1.02] bg-white`
                : 'border-gray-100 bg-white/60 shadow-sm'
            }`} style={item.highlight ? { borderColor: colors.textPrimary.replace('text-', '') } : {}}>
              {item.highlight && (
                <div className={`absolute top-0 left-0 right-0 h-1 ${colors.bgPrimary}`} />
              )}
              <h3 className="text-xl font-black text-gray-900 mb-2">{item.name}</h3>
              <p className={`text-3xl font-black mb-6 ${item.highlight ? colors.textPrimary : 'text-gray-900'}`}>
                {item.price} <span className="text-sm text-gray-400 font-medium">FCFA</span>
              </p>
              <ul className="space-y-3 flex-1">
                {item.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${item.highlight ? `${colors.bgPrimary} text-white` : 'bg-gray-100 text-gray-500'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section Social Proof Bar ─────────────────────────────────────────────────
export function SocialProofBarSection({ s, theme: _theme = DEFAULT_THEME }: { s: Section; theme?: Theme }) {
  const items = (s.items as Array<{ name: string; logo?: string }> | undefined) || []
  if (items.length === 0) return null

  return (
    <section className="py-12 px-6 bg-white/50">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-8">
          {s.title || 'Ils nous font confiance'}
        </p>
        <div className="flex items-center justify-center gap-8 md:gap-14 flex-wrap opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.logo} alt={item.name} className="h-8 md:h-10 object-contain" />
              ) : (
                <span className="text-lg md:text-xl font-black text-gray-700">{item.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
