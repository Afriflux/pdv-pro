/* eslint-disable react/forbid-dom-props, @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface BioLinkHeaderClientProps {
  bioLink: any
  brandColor: string
  theme: string
  customAppearance?: any
}

export default function BioLinkHeaderClient({ bioLink, brandColor, theme, customAppearance }: BioLinkHeaderClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Si on a scrollé de plus de 50px
      setIsScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const bannerHeightClass = isScrolled ? 'h-16 md:h-20' : 'h-40 md:h-48'
  const fallbackBannerHeightClass = isScrolled ? 'h-16 md:h-20' : 'h-32 md:h-40'
  const avatarSizeClass = isScrolled ? 'w-12 h-12 md:w-14 md:h-14 -mt-6 md:-mt-7 border-2' : 'w-20 h-20 md:w-24 md:h-24 -mt-10 md:-mt-14 ring-4'
  const titleSizeClass = isScrolled ? 'text-lg md:text-xl' : 'text-xl md:text-2xl mt-3'

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col items-center shrink-0 transition-all duration-300 shadow-xl overflow-hidden rounded-t-[40px] md:rounded-t-[40px]">
      
      {/* Banner Section */}
      {bioLink.banner_url ? (
        <div 
          className={`w-full bg-cover bg-center shrink-0 transition-all duration-300 ${bannerHeightClass}`} 
          {...{ style: { backgroundImage: `url(${bioLink.banner_url})` } }}
        ></div>
      ) : (
        <div 
          className={`w-full shrink-0 transition-all duration-300 ${fallbackBannerHeightClass}`} 
          {...{ style: { backgroundColor: brandColor, opacity: 0.8 } }}
        ></div>
      )}

      {/* Profile Header Block */}
      <div className={`w-full flex flex-col items-center px-6 md:px-10 pb-4 backdrop-blur-xl transition-colors duration-500 ${
        theme === 'custom' ? (customAppearance?.button_style === 'glass' ? 'bg-white/10 border-b border-white/20 text-white' : 'bg-white/80 border-b border-gray-100 text-gray-900') :
        theme === 'dark' ? 'bg-[#1A1A1A]/90 border-b border-gray-800 text-white' : 
        theme === 'glass' ? 'bg-white/20 border-b border-white/20 text-white' : 
        'bg-white/95 border-b border-gray-100 text-gray-900'
      }`}>
        <div className={`rounded-full flex items-center justify-center font-black shadow-lg shrink-0 overflow-hidden transition-all duration-300 ${avatarSizeClass} ${
          theme === 'custom' ? (customAppearance?.button_style === 'glass' ? 'bg-white/20 backdrop-blur-md ring-transparent text-white border-white/40' : 'bg-white ring-white text-current border-white') :
          theme === 'dark' ? 'bg-gray-800 ring-[#1A1A1A] text-white border-[#1A1A1A]' :
          theme === 'glass' ? 'bg-white/20 backdrop-blur-md ring-transparent text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.3)]' :
          'bg-white ring-white text-[#0F7A60] border-white'
        }`}>
          {bioLink.avatar_url ? (
            <Image 
              src={bioLink.avatar_url} 
              alt={bioLink.title || 'Profile'} 
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <span {...{ style: { color: brandColor, fontSize: isScrolled ? '1.25rem' : '1.875rem' } }} className="transition-all duration-300">
              {bioLink.title ? bioLink.title.charAt(0).toUpperCase() : bioLink.user?.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        <h1 className={`font-black tracking-tight text-center transition-all duration-300 ${titleSizeClass}`}>
          {bioLink.user?.name || bioLink.title}
        </h1>
        {bioLink.title && bioLink.user?.name && !isScrolled && (
          <p className={`text-xs md:text-sm font-bold mt-1 tracking-wide animate-in fade-in ${
            theme === 'dark' ? 'text-gray-500' :
            theme === 'glass' ? 'text-white/60' :
            'text-gray-400'
          }`}>
            {bioLink.title}
          </p>
        )}
      </div>
    </div>
  )
}
