// ─── PixelTracker — injecte Meta Pixel, TikTok Pixel, Google Tag ─────────────
// Composant Server Component : zéro re-render, résout au moment du build/request.
// Importé par [slug]/page.tsx et checkout/[id]/page.tsx
//
// Props :
//   metaId    — Meta Pixel ID (ex: "1234567890123456")
//   tiktokId  — TikTok Pixel ID (ex: "CXXXXXX")
//   googleId  — Google Tag Manager / GA4 ID (ex: "GTM-XXXX" ou "G-XXXX")
//   storeName — Nom de la boutique (pour dataLayer GTM)
// ─────────────────────────────────────────────────────────────────────────────

import Script from 'next/script'

interface PixelTrackerProps {
  metaId?:    string | null
  tiktokId?:  string | null
  googleId?:  string | null
  storeName?: string
}

export function PixelTracker({
  metaId,
  tiktokId,
  googleId,
  storeName = '',
}: PixelTrackerProps) {
  // Si aucun pixel configuré, ne rien rendre
  if (!metaId && !tiktokId && !googleId) return null

  return (
    <>
      {/* ── META (FACEBOOK) PIXEL ─────────────────────────────────────────── */}
      {metaId && (
        <>
          {/* noscript fallback */}
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              className="hidden"
              src={`https://www.facebook.com/tr?id=${metaId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){
                if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaId}');
              fbq('track', 'PageView');
            `}
          </Script>
        </>
      )}

      {/* ── TIKTOK PIXEL ──────────────────────────────────────────────────── */}
      {tiktokId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;
              var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktokId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* ── GOOGLE TAG MANAGER / GA4 ──────────────────────────────────────── */}
      {googleId && (
        <>
          <Script
            id="gtag-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleId}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleId}', {
                page_title: '${storeName.replace(/'/g, "\\'")}',
              });
            `}
          </Script>
        </>
      )}
    </>
  )
}
