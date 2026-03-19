/* eslint-disable react/forbid-dom-props */
'use client'

interface StoreSocialLinksProps {
  socialLinks: Record<string, string> | null
}

const NETWORKS = [
  { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C' },
  { key: 'tiktok',    label: 'TikTok',    emoji: '🎵', color: '#010101' },
  { key: 'facebook',  label: 'Facebook',  emoji: '👥', color: '#1877F2' },
  { key: 'youtube',   label: 'YouTube',   emoji: '▶️', color: '#FF0000' },
  { key: 'whatsapp',  label: 'WhatsApp',  emoji: '💬', color: '#25D366' },
  { key: 'website',   label: 'Site web',  emoji: '🌐', color: '#0F7A60' },
]

export default function StoreSocialLinks({ socialLinks }: StoreSocialLinksProps) {
  if (!socialLinks) return null

  // On récupère uniquement les réseaux qui ont un lien renseigné
  const activeNetworks = NETWORKS.filter(net => socialLinks[net.key])

  if (activeNetworks.length === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
      {activeNetworks.map(net => {
        let href = socialLinks[net.key]

        // Formatage spécifique des liens
        if (net.key === 'instagram') {
          href = `https://instagram.com/${href.replace('@', '')}`
        } else if (net.key === 'tiktok') {
          href = `https://tiktok.com/@${href.replace('@', '')}`
        } else if (net.key === 'whatsapp') {
          href = href.startsWith('http') ? href : `https://wa.me/${href.replace(/\+/g, '')}`
        } else if (net.key === 'website') {
          href = href.startsWith('http') ? href : `https://${href}`
        }

        return (
          <a
            key={net.key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={net.label}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-white/40 shadow-sm flex items-center justify-center text-lg hover:scale-110 active:scale-95 transition-all duration-300 relative group overflow-hidden"
          >
            {/* Petit halo de couleur au survol */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
              style={{ backgroundColor: net.color }}
            />
            <span className="relative z-10">{net.emoji}</span>
          </a>
        )
      })}
    </div>
  )
}
