import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BioLinkClientModules, TrackedLink } from './BioLinkClientModules'

export const dynamic = 'force-dynamic'

export default async function BioLinkPage({ params }: { params: { slug: string } }) {
  const bioLink = await prisma.bioLink.findUnique({
    where: { slug: params.slug },
    include: {
      user: {
        select: {
          name: true,
          store: { select: { id: true, slug: true, whatsapp: true } }
        }
      }
    }
  })

  if (!bioLink) {
    notFound()
  }

  // Increment views
  await prisma.bioLink.update({
    where: { id: bioLink.id },
    data: { views: { increment: 1 } }
  }).catch(() => {}) // non-blocking

  const links = (bioLink.links as any[]) || []
  
  const theme = bioLink.theme || 'light';
  const brandColor = bioLink.brand_color || '#0F7A60';

  const isLight = (hex: string) => {
    const color = hex.charAt(0) === '#' ? hex.substring(1, 7) : hex;
    const r = parseInt(color.substring(0, 2), 16); 
    const g = parseInt(color.substring(2, 4), 16); 
    const b = parseInt(color.substring(4, 6), 16); 
    const uicolors = [r / 255, g / 255, b / 255];
    const c = uicolors.map((col) => {
      if (col <= 0.03928) return col / 12.92;
      return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return L > 0.179;
  };
  const ctaTextColor = isLight(brandColor) ? '#000000' : '#FFFFFF';

  let bgClass = "bg-[#FAFAF7] text-gray-900";
  let wrapperClass = "bg-white text-gray-900 shadow-xl border-gray-100";
  if (theme === 'dark') {
    bgClass = "bg-black text-white";
    wrapperClass = "bg-[#1A1A1A] text-white border-gray-800 shadow-2xl";
  } else if (theme === 'glass') {
    bgClass = "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white";
    wrapperClass = "bg-white/10 backdrop-blur-xl border border-white/20 shadow-[-10px_10px_30px_rgba(0,0,0,0.1)] text-white";
  }

  return (
    <main className={`min-h-screen flex flex-col items-center selection:bg-black/10 transition-colors duration-500 ${bgClass}`}>
      <div className={`w-full max-w-lg min-h-screen md:min-h-[90vh] md:my-10 md:rounded-[40px] flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out overflow-hidden border ${wrapperClass}`}>
        
        {/* Banner Section */}
        {bioLink.banner_url ? (
          <div className="w-full h-40 md:h-48 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${bioLink.banner_url})` }}></div>
        ) : (
          <div className="w-full h-32 md:h-40 shrink-0" style={{ backgroundColor: brandColor, opacity: 0.8 }}></div>
        )}

        {/* Sticky Profile Header */}
        <div className={`sticky top-0 z-50 w-full flex flex-col items-center px-6 md:px-10 pt-2 pb-4 backdrop-blur-xl shadow-sm transition-colors duration-500 ${
          theme === 'dark' ? 'bg-[#1A1A1A]/80 border-b border-gray-800' : 
          theme === 'glass' ? 'bg-white/10 border-b border-white/20' : 
          'bg-white/90 border-b border-gray-100'
        }`}>
          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full -mt-10 md:-mt-14 mb-3 flex items-center justify-center text-3xl font-black shadow-xl shrink-0 overflow-hidden ring-4 transition-all duration-300 ${
            theme === 'dark' ? 'bg-gray-800 ring-[#1A1A1A] text-white' :
            theme === 'glass' ? 'bg-white/20 backdrop-blur-md ring-transparent text-white border cursor-glow' :
            'bg-white ring-white text-[#0F7A60]'
          }`}>
            {bioLink.avatar_url ? (
              <img 
                src={bioLink.avatar_url} 
                alt={bioLink.title || 'Profile'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span style={{ color: brandColor }}>
                {bioLink.title ? bioLink.title.charAt(0).toUpperCase() : bioLink.user?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-center">{bioLink.title || bioLink.user?.name}</h1>
        </div>

        <div className="px-6 md:px-10 pb-16 flex flex-col items-center w-full relative z-10 flex-1">
          {bioLink.bio && (
            <p className={`mt-3 text-sm md:text-base font-medium leading-relaxed max-w-sm mx-auto whitespace-pre-wrap text-center ${
              theme === 'dark' ? 'text-gray-400' :
              theme === 'glass' ? 'text-white/80' :
              'text-gray-500'
            }`}>
              {bioLink.bio}
            </p>
          )}

          {/* Links Section */}
          <div className="space-y-4 w-full flex flex-col mt-10">
            {links.filter((l: any) => l.isActive !== false).map((link: any, idx: number) => {
              const delay = `${(idx * 75) + 200}ms`
              
              const isPrimary = link.isPrimary;
              
              return (
                <TrackedLink 
                  key={link.id} 
                  href={link.url}
                  slug={bioLink.slug}
                  className={`w-full rounded-2xl py-4 px-4 shadow-sm hover:shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] font-bold text-sm text-center flex items-center justify-center gap-2 ${
                    isPrimary ? 'shadow-lg' : ''
                  } ${link.animation === 'pulse' ? 'animate-pulse' : link.animation === 'bounce' ? 'animate-bounce' : ''}`}
                  style={{
                    animationDelay: delay, 
                    animationFillMode: 'both',
                    ...(isPrimary ? {
                      backgroundColor: link.bgColor ? link.bgColor : (theme === 'glass' ? 'rgba(255, 255, 255, 0.95)' : brandColor),
                      color: link.textColor ? link.textColor : (theme === 'glass' ? brandColor : ctaTextColor),
                      borderColor: link.bgColor ? 'transparent' : (theme === 'glass' ? 'rgba(255, 255, 255, 1)' : brandColor),
                    } : {
                      backgroundColor: link.bgColor ? link.bgColor : (theme === 'dark' ? '#2A2A2A' : theme === 'glass' ? 'rgba(255,255,255,0.1)' : '#FFFFFF'),
                      color: link.textColor ? link.textColor : (theme === 'dark' || theme === 'glass' ? '#FFFFFF' : '#1A1A1A'),
                      border: link.bgColor ? 'none' : (theme === 'glass' ? '1px solid rgba(255,255,255,0.2)' : theme === 'light' ? '1px solid #E5E7EB' : '1px solid transparent')
                    })
                  }}
                >
                  {link.icon && <span>{link.icon}</span>}
                  {link.title}
                </TrackedLink>
              )
            })}
          </div>

          <BioLinkClientModules 
            storeId={bioLink.user_id} 
            theme={theme}
            brandColor={brandColor}
            ctaTextColor={ctaTextColor}
            newsletterActive={bioLink.newsletter_active || false}
            newsletterText={bioLink.newsletter_text ?? undefined}
            tipActive={bioLink.tip_active || false}
            tipText={bioLink.tip_text ?? undefined}
            whatsappNumber={bioLink.user?.store?.whatsapp ?? undefined}
            phoneActive={bioLink.phone_active || false}
            phoneNumber={bioLink.phone_number ?? undefined}
            phoneText={bioLink.phone_text ?? undefined}
          />

          <div className="mt-auto pt-16 text-center animate-in fade-in" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
            <a 
              href={`https://${process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'yayyam.sn'}?ref=biolink`} 
              target="_blank" 
              rel="noreferrer"
              className={`inline-flex items-center gap-2 text-xs font-bold transition-colors ${
                theme === 'glass' ? 'text-white/60 hover:text-white' : 
                theme === 'dark' ? 'text-gray-600 hover:text-gray-400' :
                'text-gray-400 hover:text-[#0F7A60]'
              }`}
            >
              Propulsé par 
              <span className={`font-black tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-current'}`}>Yayyam</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
