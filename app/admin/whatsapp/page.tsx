import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { MessageCircle, Settings, Phone, Globe, Clock, Shield, Smartphone, Zap, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Configuration Chat WhatsApp | Yayyam Admin',
}

export default async function WhatsAppConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Get WhatsApp integration config from IntegrationKey table
  const { data: waConfig } = await admin
    .from('IntegrationKey')
    .select('key, value')
    .in('key', ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_VERIFY_TOKEN'])

  const waMap: Record<string, string> = {}
  for (const c of (waConfig ?? [])) {
    waMap[c.key] = c.value
  }

  const whatsappPhoneId = waMap['WHATSAPP_PHONE_NUMBER_ID'] || 'Non configuré'
  const hasToken = !!waMap['WHATSAPP_ACCESS_TOKEN']
  const hasVerifyToken = !!waMap['WHATSAPP_VERIFY_TOKEN']
  const whatsappEnabled = hasToken && !!waMap['WHATSAPP_PHONE_NUMBER_ID']

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-[#012928] via-[#0A4138] to-[#04332A] pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-[#25D366]/20 text-white shadow-2xl backdrop-blur-md ring-4 ring-[#25D366]/20">
              <MessageCircle className="w-6 h-6 text-[#25D366]" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Chat WhatsApp</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                Configuration du widget de chat intégré en page d&apos;accueil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${whatsappEnabled ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-red-500/20 text-red-300'}`}>
              <div className={`w-2 h-2 rounded-full ${whatsappEnabled ? 'bg-[#25D366] animate-pulse' : 'bg-red-500'}`} />
              {whatsappEnabled ? 'Chat actif' : 'Chat désactivé'}
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-10 -mt-16 relative z-20 pb-20 space-y-8">
        
        {/* Config Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-[#FAFAF7]/50">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Settings size={18} className="text-emerald-500" /> Paramètres du Widget
            </h2>
            <p className="text-xs text-gray-400 mt-1">Les modifications se refléteront immédiatement sur le site.</p>
          </div>
          
          <div className="p-8 space-y-8">
            
            {/* Chat Contact Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Phone size={14} /> Numéro Chat Visiteurs
                </label>
                <div className="flex items-center gap-3 bg-[#25D366]/5 border border-[#25D366]/20 rounded-2xl px-5 py-4">
                  <span className="text-2xl">🇸🇳</span>
                  <span className="text-lg font-black text-gray-900">+221 77 658 17 41</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold">
                  Le numéro vers lequel les visiteurs sont transférés depuis le widget chat.
                  Modifiable dans <span className="text-emerald-600">WhatsAppFloatingButton.tsx</span>
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Smartphone size={14} /> Phone Number ID (Meta Cloud API)
                </label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
                  <span className="text-2xl">💬</span>
                  <span className="text-lg font-black text-gray-900 font-mono">{whatsappPhoneId}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold">
                  ID Meta pour les bots, templates et relances. Configuré dans <span className="text-emerald-600">Intégrations → WhatsApp Business</span>
                </p>
              </div>
            </div>

            {/* Statut intégration */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-3">
                <Zap size={14} /> Statut de l&apos;intégration Meta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
                  <span className="text-xs font-bold text-gray-600">Access Token</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${hasToken ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {hasToken ? '✅ Configuré' : '❌ Manquant'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
                  <span className="text-xs font-bold text-gray-600">Verify Token</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${hasVerifyToken ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {hasVerifyToken ? '✅ Configuré' : '❌ Manquant'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
                  <span className="text-xs font-bold text-gray-600">Phone Number ID</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${whatsappPhoneId !== 'Non configuré' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {whatsappPhoneId !== 'Non configuré' ? '✅ Configuré' : '❌ Manquant'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" /> Fonctionnalités Actives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: MessageCircle, name: 'Bot FAQ Automatique', desc: 'Réponses intelligentes aux questions fréquentes', active: true },
              { icon: Smartphone, name: 'Quick Replies', desc: '4 boutons de réponse rapide pour les visiteurs', active: true },
              { icon: Globe, name: 'Transfert WhatsApp Live', desc: 'Lien direct vers la conversation WhatsApp réelle', active: true },
              { icon: Clock, name: 'Tooltip intelligent', desc: 'Apparition automatique après 5 secondes', active: true },
              { icon: Shield, name: 'Anti-spam', desc: 'Rate limiting sur les messages du bot', active: true },
              { icon: Settings, name: 'Persistance Messages', desc: 'L\'historique reste durant la session', active: true },
            ].map(feat => (
              <div key={feat.name} className="rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all hover:border-emerald-200 group flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${feat.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                  <feat.icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">{feat.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Answers Config */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-[#FAFAF7]/50">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <MessageCircle size={18} className="text-[#25D366]" /> Réponses Automatiques du Bot
            </h2>
            <p className="text-xs text-gray-400 mt-1">Le bot détecte les mots-clés et répond automatiquement. Personnalisable dans le code.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { trigger: 'boutique, ouvrir, créer', response: 'Guide étape par étape pour ouvrir une boutique en 2 min' },
              { trigger: 'tarif, prix, commission, combien', response: 'Explication des paliers (8% → 5%) et COD fixe 5%' },
              { trigger: 'retirer, argent, paiement, wave', response: 'Infos Wave, Orange Money, PayTech — minimum 5 000 FCFA' },
              { trigger: 'affilié, affili, parrain', response: 'Programme affiliation : lien unique + commissions auto' },
              { trigger: 'merci, super, ok', response: 'Message de remerciement et encouragement' },
              { trigger: '(autres messages)', response: 'Message d\'attente + invitation WhatsApp live' },
            ].map((faq, i) => (
              <div key={i} className="flex items-start gap-4 px-8 py-5 hover:bg-[#FAFAF7] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-xs font-black">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {faq.trigger.split(', ').map(kw => (
                      <span key={kw} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-100">
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">{faq.response}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
