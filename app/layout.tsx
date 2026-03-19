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
