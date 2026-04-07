// Badge "Propulsé par Yayyam" — discret, élégant, non intrusif
// Utilisé en bas des pages boutique et checkout

import Link from 'next/link'

export function PoweredByBadge() {
  return (
    <div className="flex items-center justify-center py-4">
      <Link
        href="https://yayyam.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-full
          text-[10px] font-semibold text-gray-400 hover:text-[#0F7A60] hover:border-[#0F7A60]/20
          transition-all shadow-sm hover:shadow group"
      >
        {/* Logo émeraude miniature */}
        <span
          className="w-3.5 h-3.5 rounded-full bg-[#0F7A60] flex items-center justify-center
            text-white text-[7px] font-black group-hover:scale-110 transition-transform"
        >
          P
        </span>
        Propulsé par{' '}
        <span className="text-[#0F7A60] font-black">Yayyam</span>
        <span className="text-[#C9A84C]">⚡</span>
      </Link>
    </div>
  )
}
