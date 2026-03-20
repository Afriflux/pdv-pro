import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Space_Mono } from 'next/font/google'
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

const dm = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
})

const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://pdvpro.com'),
  title: "PDV Pro — Vendez en ligne en Afrique de l'Ouest",
  description: "Créez votre boutique en ligne en 10 minutes. Zéro abonnement. PDV Pro, la plateforme e-commerce pour l'Afrique de l'Ouest.",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon-192x192.png',
  },
  manifest: '/manifest.json',
  openGraph: { 
    type: 'website', 
    locale: 'fr_FR', 
    url: 'https://pdvpro.com', 
    siteName: 'PDV Pro', 
    title: "PDV Pro — La plateforme e-commerce #1 en Afrique de l'Ouest", 
    description: "Créez votre boutique en ligne gratuitement. Vendez vos produits physiques, digitaux et coaching. Zéro abonnement.", 
    images: [{ url: '/og-image.png', width: 1200, height: 630 }] 
  },
  twitter: { 
    card: 'summary_large_image', 
    title: 'PDV Pro', 
    description: "La plateforme e-commerce #1 en Afrique de l'Ouest", 
    images: ['/og-image.png'] 
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${dm.variable} ${mono.variable}`}>
      <body className={`antialiased font-body bg-cream text-ink selection:bg-gold/30 selection:text-ink`}>
        {children}
      </body>
    </html>
  );
}
