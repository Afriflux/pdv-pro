'use client'

import { useEffect, useRef } from 'react'

export interface LandingTestimonial {
  name: string
  biz: string
  quote: string
  badge: string
}

export function TestimonialSlider({ testimonials }: { testimonials: LandingTestimonial[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll pour mobile
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let timer: NodeJS.Timeout
    const startScroll = () => {
      timer = setInterval(() => {
        if (!el) return
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
          el.scrollLeft = 0 // Retour au début
        } else {
          el.scrollBy({ left: 300, behavior: 'smooth' })
        }
      }, 5000) // Scroll auto toutes les 5 secondes
    }

    startScroll()
    
    // Pause au survol/touch
    el.addEventListener('mouseenter', () => clearInterval(timer))
    el.addEventListener('touchstart', () => clearInterval(timer), { passive: true })
    el.addEventListener('mouseleave', startScroll)
    el.addEventListener('touchend', startScroll)

    return () => clearInterval(timer)
  }, [])

  return (
    <div 
      ref={scrollRef}
      className="flex gap-6 xl:gap-10 overflow-x-auto md:justify-center snap-x snap-mandatory pb-8 custom-scrollbar pt-4 px-6 md:px-0"
    >
      <style>{`
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: thin;
          scrollbar-color: rgba(15,122,96,0.2) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(15,122,96,0.2); 
          border-radius: 10px;
        }
      `}</style>
      
      {testimonials.map((test, i) => (
        <div 
          key={i} 
          className="snap-center shrink-0 w-[85vw] md:w-[400px] lg:w-[450px] flex-1 max-w-[500px] bg-white p-8 rounded-[2rem] border border-line relative shadow-sm hover:border-emerald/30 hover:shadow-xl transition-all flex flex-col group"
        >
          {/* Decorative quote */}
          <div className="font-display text-9xl text-emerald/5 absolute top-4 right-8 leading-none select-none group-hover:text-emerald/10 transition-colors">"</div>
          
          <div className="flex gap-1 mb-6">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-charcoal font-light mb-8 relative z-10 text-lg leading-relaxed italic flex-1">
            "{test.quote}"
          </p>
          
          <div className="bg-cream border border-line rounded-lg px-3 py-1.5 text-xs font-bold text-slate w-max mb-6">
            📍 {test.badge}
          </div>

          <div className="flex items-center gap-4 border-t border-line pt-6 mt-auto">
            {/* Photo placeholder */}
            <div className="w-12 h-12 rounded-full bg-emerald text-white font-display font-bold flex items-center justify-center text-xl shrink-0 shadow-sm border-2 border-emerald-light/20">
              {test.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-ink">{test.name}</h4>
              <p className="text-slate text-sm font-medium">{test.biz}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
