'use client'

// ─── WorkflowsClient — accessible à tous les vendeurs ────────────────────────
// Plus de guard isPro — le bouton et la card d'upgrade sont supprimés

import { useState } from 'react'
import { Workflow, Play, Plus, Share2, Mail, Bell, Zap, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function WorkflowsClient() {
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [betaEmail, setBetaEmail]           = useState('')

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!betaEmail.trim()) return

    // Simulation d'inscription locale
    toast.success("Merci ! Vous serez parmi les premiers notifiés 🚀")
    
    setShowComingSoon(false)
    setBetaEmail('')
  }

  return (
    <div className="space-y-8 pb-12 relative">
      {/* ── SECTION HERO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-line p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Workflow size={120} />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-ink">Smart Workflows</h3>
                <p className="text-xs text-dust font-bold uppercase tracking-widest">Le cerveau de votre boutique</p>
              </div>
            </div>

            <p className="text-slate text-sm max-w-xl leading-relaxed">
              Ne travaillez plus <strong>dans</strong> votre boutique, laissez votre boutique travailler <strong>pour vous</strong>.
              Configurez des séquences d&apos;actions automatiques déclenchées par chaque vente ou clic.
            </p>

            <div className="pt-4">
              <button
                onClick={() => setShowComingSoon(true)}
                className="w-full sm:w-auto bg-gold hover:bg-gold-light text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <Plus size={20} className="relative z-10 group-hover:rotate-90 transition-transform" />
                <span className="relative z-10">Créer mon premier workflow</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Card Statut intégrations ── */}
        <div className="bg-white rounded-3xl border border-line p-8 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-display font-black text-ink">Statut Intégrations</h3>
              <p className="text-xs text-dust font-bold uppercase tracking-widest">Connexion des services</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-cream rounded-xl">
                <div className="flex items-center gap-2">
                  <Share2 size={16} className="text-dust" />
                  <span className="text-xs font-bold text-ink">Webhooks API</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cream rounded-xl">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-dust" />
                  <span className="text-xs font-bold text-ink">SMTP Email</span>
                </div>
                <span className="text-[10px] text-dust font-bold">Non lié</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-line text-center text-[10px] text-dust font-bold uppercase">
            0 automatisations actives
          </div>
        </div>
      </div>

      {/* ── TIMELINE DE FONCTIONNEMENT ── */}
      <div className="bg-white rounded-3xl border border-line p-8 shadow-sm relative overflow-hidden">
        <h4 className="text-sm font-black text-ink uppercase tracking-[0.2em] mb-8 text-center relative z-10">Comment ça marche ?</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          {/* Ligne de connexion (Desktop) */}
          <div className="hidden md:block absolute top-[20px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-line via-gold/30 to-line -z-0"></div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-4 group">
            <div className="w-10 h-10 bg-gold text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-gold/20 ring-4 ring-gold/10 group-hover:scale-110 transition-transform">1</div>
            <div>
              <h5 className="font-display font-black text-ink">Trigger (Déclencheur)</h5>
              <p className="text-[11px] text-dust leading-relaxed px-4">Evènement : vente, nouveau client, panier abandonné...</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-4 group">
            <div className="w-10 h-10 bg-ink text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-ink/20 ring-4 ring-ink/10 group-hover:scale-110 transition-transform">2</div>
            <div>
              <h5 className="font-display font-black text-ink">Logic (Règles)</h5>
              <p className="text-[11px] text-dust leading-relaxed px-4">Si montant &gt; 10 000 F, alors... Attendre 24h, puis...</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-4 group">
            <div className="w-10 h-10 bg-emerald-deep text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-emerald/20 ring-4 ring-emerald/10 group-hover:scale-110 transition-transform">3</div>
            <div>
              <h5 className="font-display font-black text-ink">Action (Résultat)</h5>
              <p className="text-[11px] text-dust leading-relaxed px-4">Envoyer mail, Webhook, message WhatsApp, ajout Telegram...</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODÈLES POPULAIRES ── */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-dust uppercase tracking-widest pl-1 flex items-center gap-2">
          <Play size={14} className="text-gold" /> Modèles populaires
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {[
            { tag: 'E-commerce', title: 'Recuperation Panier Abandonné', desc: 'Envoie un rappel WhatsApp 2h après un abandon.', icon: Bell },
            { icon: Mail, tag: 'Marketing', title: 'Séquence de bienvenue', desc: 'Envoie 3 emails éducatifs après le premier achat.' },
            { icon: Share2, tag: 'CRM', title: 'Synchronisation Google Sheets', desc: 'Ajoute chaque nouvelle commande dans un tableur.' },
          ].map((tmp, i) => (
            <div 
              key={i} 
              onClick={() => setShowComingSoon(true)}
              className="bg-white border border-line p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group cursor-pointer border-b-4 hover:border-b-gold relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-cream opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[9px] font-black uppercase text-gold bg-gold/5 px-2 py-0.5 rounded-md border border-gold/10">{tmp.tag}</span>
                <h5 className="font-display font-black text-ink mt-3 mb-1 flex items-center justify-between">
                  {tmp.title}
                  <tmp.icon size={16} className="text-dust group-hover:text-gold transition-colors" />
                </h5>
                <p className="text-[11px] text-dust leading-relaxed">{tmp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL TEASER PREMUIUM (Bientôt disponible) ── */}
      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur animé */}
          <div 
            className="absolute inset-0 bg-ink/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowComingSoon(false)}
          />

          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative z-10">
            
            {/* Header visuel */}
            <div className="h-32 bg-gradient-to-br from-emerald to-emerald-dark relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl rotate-12 scale-110">
                ⚡
              </div>
              <button 
                aria-label="Fermer"
                title="Fermer"
                onClick={() => setShowComingSoon(false)} 
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition backdrop-blur-md"
              >
                <X size={16}/>
              </button>
            </div>
            
            <div className="p-8 text-center space-y-6">
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-emerald/10 text-emerald-dark font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                  <Sparkles size={12} /> Bientôt disponible
                </div>
                <h3 className="font-display font-black text-ink text-2xl leading-tight">
                  Les Workflows <br/> arrivent très bientôt !
                </h3>
                <p className="text-sm text-dust/90 leading-relaxed px-2">
                  Automatisez vos relances, notifications et actions répétitives en quelques clics. Votre boutique travaillera en pilote automatique.
                </p>
              </div>

              <form onSubmit={handleSubscribe} className="space-y-4 pt-2">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dust px-1">Être notifié en avant-première</label>
                  <input 
                    type="email" 
                    required 
                    value={betaEmail}
                    onChange={(e) => setBetaEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full bg-[#FAFAF7] border border-line rounded-2xl px-5 py-4 text-sm font-bold text-ink focus:ring-2 focus:ring-emerald/20 focus:border-emerald outline-none transition-all placeholder:text-dust/50"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-ink text-white font-black hover:bg-slate px-6 py-4 rounded-2xl transition-all shadow-xl shadow-ink/10 flex items-center justify-center gap-2 group"
                >
                  M&apos;inscrire à la bêta <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </form>

              <button 
                onClick={() => setShowComingSoon(false)}
                className="text-xs font-bold text-dust hover:text-ink transition underline decoration-dust/30 hover:decoration-ink/50"
              >
                Remettre à plus tard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
