import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Yayyam',
    short_name: 'Yayyam',
    description: 'Créez votre boutique en ligne en 10 minutes. Vendez sur WhatsApp et encaissez par Mobile Money.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F9FAFB',
    theme_color: '#0F7A60',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
