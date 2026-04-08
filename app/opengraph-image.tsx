import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Image metadata
export const alt = 'Yayyam - Plateforme e-commerce #1 en Afrique de l\'Ouest'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAF7', // Cream background
          position: 'relative',
        }}
      >
        {/* Background glow effects */}
        <div style={{ position: 'absolute', top: -300, left: -300, width: 800, height: 800, borderRadius: '50%', backgroundColor: '#0F7A60', filter: 'blur(200px)', opacity: 0.15 }} />
        <div style={{ position: 'absolute', bottom: -200, right: -200, width: 600, height: 600, borderRadius: '50%', backgroundColor: '#C9A84C', filter: 'blur(150px)', opacity: 0.15 }} />

        {/* Central Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#052E22', // Dark green Emerald
            borderRadius: 40,
            padding: '60px 80px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
            border: '2px solid rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              backgroundColor: '#1E443A', // Lighter green inner
              borderRadius: 30,
              marginBottom: 40,
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C9A84C" // Gold stroke
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
              <path d="M2 7h20" />
              <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
            </svg>
          </div>

          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.05em',
              marginBottom: 20,
              textAlign: 'center',
              display: 'flex',
            }}
          >
            Yayyam
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              display: 'flex',
              letterSpacing: '0em',
            }}
          >
            Plateforme E-commerce Africaine
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
