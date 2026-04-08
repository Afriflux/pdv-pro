import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/portal/',
          '/closer/',
          '/client/',
          '/api/',
          '/onboarding/',
          '/checkout/',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://yayyam.com/sitemap.xml',
  }
}
