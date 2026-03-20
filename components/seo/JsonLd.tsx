'use client'
import Script from 'next/script'

// ─── Organization (global, dans layout.tsx) ──────────────────
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PDV Pro",
    "url": "https://pdvpro.com",
    "logo": "https://pdvpro.com/icon-512x512.png",
    "description": "Plateforme e-commerce pour les entrepreneurs d'Afrique de l'Ouest",
    "sameAs": [
      "https://www.facebook.com/pdvpro",
      "https://www.instagram.com/pdvpro",
      "https://www.tiktok.com/@pdvpro"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+221-77-000-0000",
      "contactType": "customer service",
      "areaServed": ["SN", "CI", "ML", "BF", "GN", "TG", "BJ", "NE"],
      "availableLanguage": "French"
    }
  }
  return <Script id="org-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

// ─── Product (sur chaque page produit) ───────────────────────
export function ProductJsonLd({ product, storeName, storeSlug }: {
  product: { id: string; name: string; price: number; description?: string | null; images?: string[]; rating?: number | null; review_count?: number | null }
  storeName: string
  storeSlug: string
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || '',
    "image": product.images?.[0] || '',
    "brand": { "@type": "Brand", "name": storeName },
    "offers": {
      "@type": "Offer",
      "url": `https://pdvpro.com/p/${storeSlug}/${product.id}`,
      "priceCurrency": "XOF",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": storeName }
    },
    ...(product.rating ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.review_count || 0
      }
    } : {})
  }
  return <Script id={`product-jsonld-${product.id}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

// ─── WebSite (pour la search box dans Google) ────────────────
export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PDV Pro",
    "url": "https://pdvpro.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://pdvpro.com/vendeurs?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  return <Script id="website-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
