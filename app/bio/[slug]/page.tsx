import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BioLinkClientModules, TrackedLink } from './BioLinkClientModules'
import BioLinkHeaderClient from './BioLinkHeaderClient'
import BioBlockRenderer from './BioBlockRenderer'
import type { BioBlock } from './BioBlockRenderer'

import { Metadata } from 'next'

/* eslint-disable @typescript-eslint/no-explicit-any, react/forbid-dom-props */
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const bioLink = await prisma.bioLink.findUnique({
    where: { slug: params.slug },
    include: {
      user: {
        select: { name: true, store: { select: { store_name: true, name: true } } }
      }
    }
  })

  if (!bioLink) return { title: 'Lien introuvable | Yayyam' }

  const storeData = bioLink.user?.store
  const storeName = Array.isArray(storeData) ? (storeData[0]?.store_name || storeData[0]?.name) : (storeData?.store_name || storeData?.name)
  const title = bioLink.title || `Le Link-in-Bio de ${storeName || bioLink.user?.name || 'Yayyam'}`
  const description = bioLink.bio || 'Découvrez tous mes liens et tunnels de vente.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://yayyam.com/bio/${params.slug}`,
      siteName: 'Yayyam',
      images: bioLink.avatar_url ? [{ url: bioLink.avatar_url, width: 400, height: 400, alt: title }] : [{ url: 'https://yayyam.com/og-image.svg', width: 1200, height: 630, alt: 'Yayyam' }],
      locale: 'fr_FR',
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: bioLink.avatar_url ? [bioLink.avatar_url] : [],
    }
  }
}

export default async function BioLinkPage({ params }: { params: { slug: string } }) {
  const bioLink = await prisma.bioLink.findUnique({
    where: { slug: params.slug },
    include: {
      user: {
        select: {
          name: true,
          store: { select: { id: true, slug: true, whatsapp: true } }
        }
      }
    }
  })

  if (!bioLink) {
    notFound()
  }

  // Increment views
  await prisma.bioLink.update({
    where: { id: bioLink.id },
    data: { views: { increment: 1 } }
  }).catch(() => {}) // non-blocking

  const links = (bioLink.links as any[]) || []
  
  const theme = bioLink.theme || 'light';
  const brandColor = bioLink.brand_color || '#0F7A60';

  const isLight = (hex: string) => {
    const color = hex.charAt(0) === '#' ? hex.substring(1, 7) : hex;
    const r = parseInt(color.substring(0, 2), 16); 
    const g = parseInt(color.substring(2, 4), 16); 
    const b = parseInt(color.substring(4, 6), 16); 
    const uicolors = [r / 255, g / 255, b / 255];
    const c = uicolors.map((col) => {
      if (col <= 0.03928) return col / 12.92;
      return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return L > 0.179;
  };
  const ctaTextColor = isLight(brandColor) ? '#000000' : '#FFFFFF';

  const isDarkTheme = ['dark', 'luxury', 'richy', 'show', 'shadow', 'ambiance', 'music'].includes(theme);
  const isGlassTheme = ['glass', 'magnet', 'été'].includes(theme);
  const isLightTheme = !isDarkTheme && !isGlassTheme;

  const customApp = (bioLink as any).custom_appearance || { bg_type: 'color', bg_value: '#FAFAF7', button_shape: 'rounded-xl', font_family: 'inter' };
  
  let bgClass = "bg-[#FAFAF7] text-gray-900";
  let wrapperClass = "bg-white text-gray-900 shadow-xl border-gray-100";
  
  switch(theme) {
    case 'dark':
      bgClass = "bg-black text-white";
      wrapperClass = "bg-[#1A1A1A] text-white border-gray-800 shadow-2xl";
      break;
    case 'glass':
      bgClass = "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white";
      wrapperClass = "bg-white/10 backdrop-blur-xl border border-white/20 shadow-[-10px_10px_30px_rgba(0,0,0,0.1)] text-white";
      break;
    case 'girly':
      bgClass = "bg-pink-50 text-pink-900";
      wrapperClass = "bg-white text-pink-900 border-pink-100 shadow-[0_10px_40px_rgba(236,72,153,0.1)]";
      break;
    case 'pinky':
      bgClass = "bg-pink-500 text-white";
      wrapperClass = "bg-pink-400 text-white border-pink-300 shadow-xl";
      break;
    case 'luxury':
      bgClass = "bg-black text-amber-100";
      wrapperClass = "bg-[#0A0A0A] text-amber-100 border-[#FFD700]/30 shadow-[0_0_40px_rgba(255,215,0,0.1)]";
      break;
    case 'richy':
      bgClass = "bg-[#082212] text-emerald-50";
      wrapperClass = "bg-[#0A2E18] text-emerald-50 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]";
      break;
    case 'pro':
      bgClass = "bg-slate-100 text-slate-900";
      wrapperClass = "bg-white text-slate-900 shadow-2xl border-slate-200";
      break;
    case 'magnet':
      bgClass = "bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 text-white";
      wrapperClass = "bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl text-white";
      break;
    case 'argenté':
      bgClass = "bg-gradient-to-b from-gray-100 to-gray-300 text-gray-900";
      wrapperClass = "bg-gradient-to-br from-white to-gray-50 text-gray-900 shadow-2xl border-white/50";
      break;
    case 'services':
      bgClass = "bg-blue-50 text-blue-950";
      wrapperClass = "bg-white text-blue-950 border-blue-100 shadow-xl shadow-blue-900/5";
      break;
    case 'expresse':
      bgClass = "bg-red-50 text-red-950";
      wrapperClass = "bg-white text-red-950 border-red-100 shadow-xl shadow-red-900/5";
      break;
    case 'été':
      bgClass = "bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 text-white";
      wrapperClass = "bg-white/20 backdrop-blur-xl border-white/30 text-white shadow-2xl";
      break;
    case 'show':
      bgClass = "bg-zinc-950 text-white";
      wrapperClass = "bg-zinc-900 text-white border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)]";
      break;
    case 'shadow':
      bgClass = "bg-[#050505] text-gray-300";
      wrapperClass = "bg-[#0A0A0A] text-gray-300 shadow-[inset_0_0_50px_rgba(255,255,255,0.02)] border-gray-800/50";
      break;
    case 'ambiance':
      bgClass = "bg-gradient-to-tr from-orange-900 via-amber-900 to-black text-amber-50";
      wrapperClass = "bg-black/40 backdrop-blur-xl text-amber-50 border-amber-900/50 shadow-2xl";
      break;
    case 'music':
      bgClass = "bg-indigo-950 text-indigo-50";
      wrapperClass = "bg-indigo-900/40 backdrop-blur-xl text-indigo-50 border-indigo-500/30 shadow-2xl shadow-indigo-900/50";
      break;
    case 'custom':
      bgClass = customApp?.bg_type === 'gradient' ? customApp.bg_value : "bg-transparent";
      wrapperClass = customApp?.button_style === 'glass' ? "bg-white/10 backdrop-blur-xl border border-white/20" : "bg-white/80 border-gray-200 shadow-2xl";
      break;
  }

  let customBgStyle = ''
  if (theme === 'custom') {
    if (customApp?.bg_type === 'color') {
       customBgStyle = `.custom-bg { background-color: ${customApp.bg_value} !important; }`
    } else if (customApp?.bg_type === 'image') {
       customBgStyle = `.custom-bg { background-image: url('${customApp.bg_value}') !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important; }`
    }
  }

  return (
    <>
      <main 
        className={`min-h-screen flex flex-col items-center selection:bg-black/10 transition-colors duration-500 ${bgClass} ${theme === 'custom' ? ('font-' + (customApp.font_family || 'inter') + ' custom-bg') : ''}`}
      >
        {customBgStyle && <style>{customBgStyle}</style>}
      <div className={`w-full max-w-lg min-h-screen md:min-h-[90vh] md:my-10 md:rounded-[40px] flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out border ${wrapperClass}`}>
        {/* Sticky Header with Banner & Profile */}
        <BioLinkHeaderClient bioLink={bioLink} brandColor={brandColor} theme={theme} customAppearance={customApp} />

        <div className="px-6 md:px-10 pb-16 flex flex-col items-center w-full relative z-10 flex-1">
          {bioLink.bio && (
            <p className={`mt-3 text-sm md:text-base font-medium leading-relaxed max-w-sm mx-auto whitespace-pre-wrap text-center ${
              isDarkTheme ? 'text-gray-400' :
              isGlassTheme ? 'text-white/80' :
              'text-gray-500'
            }`}>
              {bioLink.bio}
            </p>
          )}

          {/* Blocks & Links Section */}
          <div className="space-y-4 w-full flex flex-col mt-10">
            {links.filter((l: any) => l.isActive !== false).map((block: any, idx: number) => {
              // ── Rich blocks (gallery, media-kit, products, portfolio, faq, text, divider)
              const blockType = block.type || 'link'
              if (blockType !== 'link') {
                return (
                  <BioBlockRenderer
                    key={block.id}
                    block={block as BioBlock}
                    theme={theme}
                    brandColor={brandColor}
                    idx={idx}
                  />
                )
              }

              // ── Classic link rendering (backward compatible)
              const delay = `${(idx * 75) + 200}ms`
              const isPrimary = block.isPrimary;

              const detectIcon = (url: string): string | null => {
                if (!url) return null
                const u = url.toLowerCase()
                if (u.includes('facebook.com') || u.includes('fb.com')) return '📘'
                if (u.includes('instagram.com')) return '📸'
                if (u.includes('youtube.com') || u.includes('youtu.be')) return '▶️'
                if (u.includes('tiktok.com')) return '🎵'
                if (u.includes('twitter.com') || u.includes('x.com')) return '🐦'
                if (u.includes('linkedin.com')) return '💼'
                if (u.includes('wa.me') || u.includes('whatsapp.com')) return '💬'
                if (u.includes('t.me') || u.includes('telegram')) return '✈️'
                if (u.includes('github.com')) return '🐙'
                if (u.includes('snapchat.com')) return '👻'
                if (u.includes('pinterest.com')) return '📌'
                if (u.includes('spotify.com')) return '🎧'
                if (u.includes('apple.com/music') || u.includes('music.apple')) return '🎶'
                return null
              }
              
              const autoIcon = block.icon || detectIcon(block.url)
              const shapeClass = block.buttonShape && block.buttonShape !== 'default' ? block.buttonShape : theme === 'custom' ? customApp?.button_shape : 'rounded-2xl';
              
              return (
                <TrackedLink 
                  key={block.id} 
                  href={block.url}
                  slug={bioLink.slug}
                  className={`w-full py-4 px-4 shadow-sm hover:shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] font-bold text-sm text-center flex items-center justify-center gap-2 ${shapeClass} ${
                    isPrimary ? 'shadow-lg' : ''
                  } ${block.animation === 'pulse' ? 'animate-pulse' : block.animation === 'bounce' ? 'animate-bounce' : ''}`}
                  {...{ style: {
                    animationDelay: delay, 
                    animationFillMode: 'both',
                    ...(theme === 'custom' && !block.bgColor && customApp?.button_style === 'outline' ? {
                      backgroundColor: 'transparent',
                      borderColor: brandColor,
                      color: brandColor,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    } : theme === 'custom' && !block.bgColor && customApp?.button_style === 'glass' ? {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      color: '#ffffff',
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    } :
                    isPrimary ? {
                      backgroundColor: block.bgColor ? block.bgColor : (isGlassTheme ? 'rgba(255, 255, 255, 0.95)' : brandColor),
                      color: block.textColor ? block.textColor : (isGlassTheme ? brandColor : ctaTextColor),
                      borderColor: block.bgColor ? 'transparent' : (isGlassTheme ? 'rgba(255, 255, 255, 1)' : brandColor),
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    } : {
                      backgroundColor: block.bgColor ? block.bgColor : (isDarkTheme ? '#2A2A2A' : isGlassTheme ? 'rgba(255,255,255,0.1)' : '#FFFFFF'),
                      color: block.textColor ? block.textColor : (isDarkTheme || isGlassTheme ? '#FFFFFF' : '#1A1A1A'),
                      border: block.bgColor ? 'none' : (isGlassTheme ? '1px solid rgba(255,255,255,0.2)' : isLightTheme ? '1px solid #E5E7EB' : '1px solid transparent')
                    })
                  } }}
                >
                  {autoIcon && <span>{autoIcon}</span>}
                  {block.title}
                </TrackedLink>
              )
            })}
          </div>

          <BioLinkClientModules 
            storeId={bioLink.user?.store?.id || bioLink.user_id} 
            theme={theme}
            brandColor={brandColor}
            ctaTextColor={ctaTextColor}
            newsletterActive={bioLink.newsletter_active || false}
            newsletterText={bioLink.newsletter_text ?? undefined}
            tipActive={bioLink.tip_active || false}
            tipText={bioLink.tip_text ?? undefined}
            whatsappNumber={bioLink.user?.store?.whatsapp ?? undefined}
            phoneActive={bioLink.phone_active || false}
            phoneNumber={bioLink.phone_number ?? undefined}
            phoneText={bioLink.phone_text ?? undefined}
          />

          <div className="mt-auto pt-16 text-center animate-in fade-in" {...{ style: { animationDelay: '800ms', animationFillMode: 'both' } }}>
            <a 
              href={`https://${process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'yayyam.com'}?ref=biolink`} 
              target="_blank" 
              rel="noreferrer"
              className={`inline-flex items-center gap-2 text-xs font-bold transition-colors ${
                isGlassTheme ? 'text-white/60 hover:text-white' : 
                isDarkTheme ? 'text-gray-600 hover:text-gray-400' :
                'text-gray-400 hover:text-[#0F7A60]'
              }`}
            >
              Propulsé par 
              <span className={`font-black tracking-tight ${isLightTheme ? 'text-gray-900' : 'text-current'}`}>Yayyam</span>
            </a>
          </div>
        </div>
      </div>
      </main>
    </>
  )
}
