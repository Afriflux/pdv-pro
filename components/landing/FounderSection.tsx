'use client'

import { Quote } from 'lucide-react'

interface FounderSectionProps {
  founderName?: string
  founderTitle?: string
  founderMessage?: string
  founderImageUrl?: string
}

export function FounderSection({
  founderName = "Cheikh Abdoul Khadre Djeylani Djitté",
  founderTitle = "Fondateur & CEO de Yayyam",
  founderMessage = `J'ai grandi en voyant des millions d'entrepreneurs africains construire des empires depuis un téléphone. Mais derrière cette force, il y avait toujours la même frustration : pas de vitrine pro, pas d'automatisation, pas de système pour scaler.

Yayyam est la plateforme que j'aurais aimé avoir quand j'ai lancé mon premier business. Un outil simple et puissant, pensé pour nos réalités — Mobile Money, WhatsApp, paiement à la livraison — avec la puissance d'un système professionnel.

On construit l'avenir du commerce africain ensemble. Bienvenue. 🤝`,
  founderImageUrl = '/founder.jpg',
}: FounderSectionProps) {
  return (
    <section className="py-24 px-6 bg-white relative overflow-hidden border-y border-line/10">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-emerald/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gold/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1800px] mx-auto w-full px-4 md:px-12 lg:px-20 xl:px-32 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block bg-ink/10 text-ink font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 shadow-sm border border-ink/10">
            Le Mot du Fondateur
          </span>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-pearl/50 rounded-[2rem] p-8 md:p-12 border border-line/50 relative shadow-sm">
            {/* Quote icon */}
            <div className="absolute -top-5 left-8 md:left-12 w-10 h-10 bg-emerald rounded-xl flex items-center justify-center shadow-lg shadow-emerald/20">
              <Quote size={20} className="text-white" />
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start mt-4">
              {/* Founder photo */}
              <div className="shrink-0 mx-auto md:mx-0">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl relative">
                  {founderImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={founderImageUrl} 
                      alt={founderName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald to-emerald-rich flex items-center justify-center">
                      <span className="text-4xl md:text-5xl font-black text-white">
                        {founderName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                  )}
                  {/* Verified badge */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald rounded-full border-2 border-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="flex-1 text-center md:text-left">
                <blockquote className="text-slate leading-relaxed font-light text-[15px] whitespace-pre-line mb-6">
                  {founderMessage}
                </blockquote>

                <div className="pt-4 border-t border-line/30">
                  <h4 className="font-black text-ink text-lg">{founderName}</h4>
                  <p className="text-sm text-emerald font-bold">{founderTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
