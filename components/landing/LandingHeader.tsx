'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

interface LandingHeaderProps {
  isLoggedIn: boolean;
  dashboardUrl: string;
}

export function LandingHeader({ isLoggedIn, dashboardUrl }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <div className="sticky top-4 z-50 px-4 md:px-0 flex justify-center pointer-events-none">
      <header className="pointer-events-auto w-full max-w-4xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-emerald/5 rounded-full h-16 flex items-center justify-between px-6 transition-all duration-300 hover:bg-white/80 relative">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group" onClick={closeMenu}>
          <Logo size="sm" />
        </Link>
        
        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6 font-bold text-xs uppercase tracking-widest text-charcoal">
          <a href="#features" className="hover:text-emerald hover:scale-105 transition-all">Atouts</a>
          <a href="#pricing" className="hover:text-emerald hover:scale-105 transition-all">Tarifs</a>
          <Link href="/vendeurs" className="hover:text-emerald hover:scale-105 transition-all flex items-center gap-1">
             <span suppressHydrationWarning>Marché</span>
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
          </Link>
        </div>

        {/* DESKTOP CTAs */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isLoggedIn ? (
            <Link
              href={dashboardUrl}
              className="bg-emerald hover:bg-emerald-rich text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-lg shadow-emerald/20"
            >
              Mon espace →
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-xs uppercase tracking-widest font-bold text-charcoal hover:text-emerald hover:scale-105 active:scale-95 transition-all">
                Connexion
              </Link>
              <Link href="/register" className="bg-emerald hover:bg-emerald-rich active:scale-95 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-emerald/20 hover:shadow-emerald/40 hover:-translate-y-0.5">
                Démarrer gratuitement
              </Link>
            </>
          )}
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button 
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-emerald/10 text-emerald hover:bg-emerald/20 transition-colors shrink-0"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* MOBILE DROPDOWN MENU */}
        {mobileMenuOpen && (
          <div className="absolute top-[110%] left-0 w-full bg-white/95 backdrop-blur-xl border border-line shadow-2xl rounded-2xl p-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col gap-4 text-center border-b border-line pb-6">
              <a href="#features" onClick={closeMenu} className="font-bold text-sm uppercase tracking-widest text-charcoal hover:text-emerald">Atouts</a>
              <a href="#pricing" onClick={closeMenu} className="font-bold text-sm uppercase tracking-widest text-charcoal hover:text-emerald">Tarifs</a>
              <Link href="/vendeurs" onClick={closeMenu} className="flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-widest text-charcoal hover:text-emerald">
                 Marché
                 <svg className="text-emerald" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              </Link>
            </nav>
            <div className="flex flex-col gap-3">
              {isLoggedIn ? (
                <Link
                  href={dashboardUrl}
                  onClick={closeMenu}
                  className="bg-emerald text-white px-6 py-4 rounded-xl text-center font-bold shadow-lg shadow-emerald/20"
                >
                  Mon espace →
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={closeMenu} className="bg-pearl text-charcoal px-6 py-4 rounded-xl text-center font-bold border border-line">
                    Connexion
                  </Link>
                  <Link href="/register" onClick={closeMenu} className="bg-emerald text-white px-6 py-4 rounded-xl text-center font-bold shadow-lg shadow-emerald/20">
                    Démarrer gratuitement
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  )
}
