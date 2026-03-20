'use client'

import { TrendingUp, CheckCircle2, ShieldCheck, Zap, Percent } from 'lucide-react'

export default function SubscriptionsClient() {
  return (
    <div className="space-y-8 pb-12 max-w-5xl">
      
      {/* ── HERO ── */}
      <div className="bg-gradient-to-br from-emerald-deep to-emerald-dark rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-rich/30 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-emerald-light font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-white/10">
            <Zap size={14} className="text-gold" /> Nouveau modèle économique
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            Zéro abonnement.<br/>
            <span className="text-turquoise">100% à la commission.</span>
          </h1>
          <p className="text-emerald-light/90 text-sm md:text-base font-medium leading-relaxed max-w-xl">
            Chez PDV Pro, nous avons supprimé tous les abonnements mensuels et frais fixes. 
            Notre succès est directement lié au vôtre : nous ne gagnons de l'argent que si vous en gagnez !
          </p>
        </div>
      </div>

      {/* ── GRILLE DES COMMISSIONS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { range: '0 - 100K ₣', rate: '7%', color: 'bg-white border-gray-100 text-gray-500', isPop: false },
          { range: '100K - 500K ₣', rate: '6%', color: 'bg-emerald/5 border-emerald/10 text-emerald', isPop: false },
          { range: '500K - 1M ₣', rate: '5%', color: 'bg-emerald/10 border-emerald/20 text-emerald-rich', isPop: false },
          { range: '+ 1M ₣ / mois', rate: '4%', color: 'bg-emerald-deep border-emerald-rich text-white shadow-xl shadow-emerald/10', isPop: true },
        ].map((tier, i) => (
          <div key={i} className={`p-6 rounded-3xl border transition-all ${tier.color} ${tier.isPop ? 'scale-105 z-10' : 'hover:-translate-y-1'}`}>
            <p className={`text-xs font-black uppercase tracking-widest mb-2 ${tier.isPop ? 'text-turquoise' : 'opacity-70'}`}>
              Volume mensuel
            </p>
            <p className="font-bold text-sm mb-4">{tier.range}</p>
            <div className={`mt-auto text-4xl font-black flex items-baseline gap-1 ${tier.isPop ? 'text-white' : ''}`}>
              {tier.rate}
              <span className={`text-xs font-bold uppercase tracking-widest ${tier.isPop ? 'text-emerald-light' : 'opacity-50'}`}>
                / vente
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── AVANTAGES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald/10 text-emerald rounded-2xl flex items-center justify-center">
            <Percent size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-black text-ink text-lg mb-2">Frais tout compris</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              La commission inclut absolument tout : les frais de passerelles de paiement (Wave, Orange Money, CinetPay) et l'accès illimité à toute la plateforme.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-black text-ink text-lg mb-2">Risque Zéro</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Vous ne payez rien pour héberger votre boutique, afficher vos produits ou utiliser nos outils marketing avancés et nos workflows d'automatisation.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-black text-ink text-lg mb-2">Paliers dégressifs</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Plus vous vendez, moins vous payez. Le système calcule automatiquement votre palier en fonction de votre volume de ventes sur les 30 derniers jours.
            </p>
          </div>
        </div>
      </div>

      {/* ── BANNIÈRE BAS ── */}
      <div className="bg-cream border border-gold/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 text-emerald">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-black text-ink">Votre compte est actif et 100% fonctionnel</h4>
            <p className="text-sm text-gray-600 font-medium mt-1">
              Vous n'avez rien à configurer. Publiez des produits et commencez à encaisser immédiatement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
