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

import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 60 // Refresh cache every minute to apply admin SEO changes

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createAdminClient()
  const { data: configRows } = await supabase
    .from('PlatformConfig')
    .select('key, value')
    .in('key', ['seo_title', 'seo_description', 'seo_keywords', 'seo_og_image', 'platform_name'])

  const kv = (configRows || []).reduce((acc: Record<string, string>, r) => {
    if (r.key && r.value) acc[r.key] = r.value
    return acc
  }, {})

  const siteTitle = kv['seo_title'] || kv['platform_name'] || "Yayyam — Vendez en ligne en Afrique de l'Ouest"
  const siteDesc  = kv['seo_description'] || "Créez votre boutique en ligne en 10 minutes. Zéro abonnement. Yayyam, la plateforme e-commerce pour l'Afrique de l'Ouest."
  const siteKeys  = kv['seo_keywords'] ? kv['seo_keywords'].split(',').map(k => k.trim()) : ["ecommerce", "afrique", "boutique en ligne"]
  const siteImage = kv['seo_og_image'] || '/og-image.png'

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'),
    title: {
      template: `%s | ${kv['platform_name'] || 'Yayyam'}`,
      default: siteTitle,
    },
    description: siteDesc,
    keywords: siteKeys,
    icons: {
      icon: '/icon-192x192.png',
      apple: '/icon-192x192.png',
    },
    manifest: '/manifest.json',
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: 'https://yayyam.com',
      siteName: kv['platform_name'] || 'Yayyam',
      title: siteTitle,
      description: siteDesc,
      images: [{ url: siteImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDesc,
      images: [siteImage],
    }
  }
}

import FooterWrapper from '@/components/FooterWrapper'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'
import { Suspense } from 'react'
import AffiliateTracker from '@/components/affiliation/AffiliateTracker'
import MaintenanceScreen from '@/components/MaintenanceScreen'
import { headers } from 'next/headers'



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Query maintenance mode using the Admin Client
  const supabase = createAdminClient()
  const { data: configRows } = await supabase
    .from('PlatformConfig')
    .select('key, value')
    .in('key', ['maintenance_active', 'maintenance_message'])

  const kv = (configRows || []).reduce((acc: Record<string, string>, row) => {
    if (row.key && row.value) acc[row.key] = row.value
    return acc
  }, {})

  const isMaintenanceActive = kv['maintenance_active'] === 'true'
  const pathname = headers().get('x-pathname') || ''
  
  // By-pass maintenance for any /admin... route
  const isAdminRoute = pathname.startsWith('/admin')
  const showMaintenance = isMaintenanceActive && !isAdminRoute

  return (
    <html lang="fr" className={`${cormorant.variable} ${dm.variable} ${mono.variable}`}>
      <body className={`antialiased font-body bg-cream text-ink selection:bg-gold/30 selection:text-ink`}>
        {showMaintenance ? (
          <MaintenanceScreen message={kv['maintenance_message']} />
        ) : (
          <>
            <OrganizationJsonLd />
            <WebSiteJsonLd />
            <Suspense fallback={null}>
              <AffiliateTracker />
            </Suspense>
            {children}
            <FooterWrapper />
          </>
        )}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {})
          }
        ` }} />
      </body>
    </html>
  );
}
