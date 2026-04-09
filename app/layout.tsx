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
import type { Viewport } from 'next'
import { unstable_cache } from 'next/cache'

export const viewport: Viewport = {
  themeColor: '#0F7A60',
}

export const revalidate = 60 // Refresh cache every minute to apply admin SEO changes

const getCachedSeoConfig = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data: configRows } = await supabase
      .from('PlatformConfig')
      .select('key, value')
      .in('key', ['seo_title', 'seo_description', 'seo_keywords', 'seo_og_image', 'platform_name'])
    return configRows || []
  },
  ['layout-seo-config'],
  { revalidate: 60 }
)

const getCachedMaintenanceConfig = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data: configRows } = await supabase
      .from('PlatformConfig')
      .select('key, value')
      .in('key', ['maintenance_active', 'maintenance_message'])
    return configRows || []
  },
  ['layout-maintenance-config'],
  { revalidate: 60 }
)

export async function generateMetadata(): Promise<Metadata> {
  const configRows = await getCachedSeoConfig()

  const kv = configRows.reduce((acc: Record<string, string>, r) => {
    if (r.key && r.value) acc[r.key] = r.value
    return acc
  }, {})

  const siteTitle = kv['seo_title'] || kv['platform_name'] || "Yayyam — Vendez en ligne en Afrique de l'Ouest"
  const siteDesc  = kv['seo_description'] || "Créez votre boutique en ligne en 10 minutes. Zéro abonnement. Yayyam, la plateforme e-commerce pour l'Afrique de l'Ouest."
  const siteKeys  = kv['seo_keywords'] ? kv['seo_keywords'].split(',').map(k => k.trim()) : ["ecommerce", "afrique", "boutique en ligne"]
  const siteImage = kv['seo_og_image']

  // Note: If siteImage is empty, Next.js will automatically fall back to app/opengraph-image.tsx

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'),
    title: {
      template: `%s | ${kv['platform_name'] || 'Yayyam'}`,
      default: siteTitle,
    },
    description: siteDesc,
    keywords: siteKeys,
    manifest: '/manifest.json',
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: 'https://yayyam.com',
      siteName: kv['platform_name'] || 'Yayyam',
      title: siteTitle,
      description: siteDesc,
      images: siteImage ? [{ url: siteImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDesc,
      images: siteImage ? [siteImage] : undefined,
    },
    verification: {
      google: 'BuV3odayhfQipIFEfebOQHI3w2EU8nO7Skjh5s8FI_0',
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
  // Query maintenance mode using the Cached Admin Client
  const configRows = await getCachedMaintenanceConfig()

  const kv = configRows.reduce((acc: Record<string, string>, row) => {
    if (row.key && row.value) acc[row.key] = row.value
    return acc
  }, {})

  const isMaintenanceActive = kv['maintenance_active'] === 'true'
  const pathname = headers().get('x-pathname') || ''
  
  // By-pass maintenance for any /admin... route
  const isAdminRoute = pathname.startsWith('/admin')
  const showMaintenance = isMaintenanceActive && !isAdminRoute

  return (
    <html lang="fr" className={`${cormorant.variable} ${dm.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className={`antialiased font-body bg-cream text-ink selection:bg-gold selection:text-white`} suppressHydrationWarning>
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
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for (var i = 0; i < registrations.length; i++) {
                registrations[i].unregister();
              }
            });
            if (caches) {
              caches.keys().then(function(names) {
                for (var i = 0; i < names.length; i++) {
                  caches.delete(names[i]);
                }
              });
            }
          }
        ` }} />
      </body>
    </html>
  );
}
