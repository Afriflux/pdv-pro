import React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  ArrowRight,
  Clock,
  Shield,
  Headphones,
  HelpCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Contact — Yayyam | Support & Assistance',
  description: 'Contactez l\'équipe Yayyam par WhatsApp, email ou formulaire. Support réactif pour vendeurs et acheteurs en Afrique de l\'Ouest.',
}

const getCachedContactConfig = unstable_cache(
  async () => {
    const supabaseAdmin = createAdminClient()
    const { data: cfgRows } = await supabaseAdmin
      .from('PlatformConfig')
      .select('key, value')
      .in('key', [
        'landing_whatsapp_support',
        'landing_instagram_url',
        'landing_facebook_url',
        'contact_email',
        'contact_phone',
        'contact_address',
        'contact_hours',
        'contact_hero_title',
        'contact_hero_subtitle',
        'contact_form_title',
        'contact_tiktok_url',
        'contact_linkedin_url',
        'contact_maps_url',
      ])
    return cfgRows || []
  },
  ['contact-config-v2'],
  { revalidate: 60 }
)

export default async function ContactPage() {
  const supabaseServer = await createClient()
  const { data: { session } } = await supabaseServer.auth.getSession()
  const isLoggedIn = !!session

  let dashboardUrl = '/dashboard'
  if (isLoggedIn && session?.user) {
    const supabaseAdmin = createAdminClient()
    const { data: userRow } = await supabaseAdmin.from('User').select('role').eq('id', session.user.id).single()
    const role = userRow?.role
    if (role === 'acheteur' || role === 'client') dashboardUrl = '/client'
    else if (role === 'affilie') dashboardUrl = '/portal'
    else if (role === 'super_admin' || role === 'gestionnaire' || role === 'support') dashboardUrl = '/admin'
  }

  const cfgRows = await getCachedContactConfig()
  const cfg = cfgRows.reduce<Record<string, string>>((acc, { key, value }) => {
    if (key && value) acc[key] = value
    return acc
  }, {})

  const whatsapp = cfg['landing_whatsapp_support'] || '221780476393'
  const email = cfg['contact_email'] || 'contact@yayyam.com'
  const phone = cfg['contact_phone'] || ''
  const instagram = cfg['landing_instagram_url'] || '#'
  const facebook = cfg['landing_facebook_url'] || '#'
  const address = cfg['contact_address'] || 'Dakar, Sénégal'
  const hours = cfg['contact_hours'] || 'Lun-Sam · 9h-19h (GMT)'
  const heroTitle = cfg['contact_hero_title'] || 'On est là pour vous.'
  const heroSubtitle = cfg['contact_hero_subtitle'] || 'Une question, un souci technique, ou juste envie de dire bonjour ? Notre équipe répond en moins de 2h sur WhatsApp.'
  const formTitle = cfg['contact_form_title'] || 'Envoyez-nous un message'
  const tiktok = cfg['contact_tiktok_url'] || '#'
  const linkedin = cfg['contact_linkedin_url'] || '#'
  const mapsUrl = cfg['contact_maps_url'] || ''

  return (
    <div className="bg-cream min-h-screen text-ink font-body selection:bg-emerald-light/20 selection:text-ink">
      <LandingHeader isLoggedIn={isLoggedIn} dashboardUrl={dashboardUrl} />

      <main>
        {/* ── HERO DARK PREMIUM ────────────────────────────────────────────── */}
        <section className="pt-40 pb-48 px-6 relative overflow-hidden bg-ink text-white">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald/40 via-gold/10 to-transparent blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-turquoise/20 via-transparent to-transparent blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 mb-8 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-light opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-light" />
              </span>
              <span className="text-sm font-bold text-emerald-light tracking-widest uppercase">
                Support Yayyam 24/7
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mb-8 leading-[1.05]">
              {heroTitle.split('.').length > 1 ? (
                <>{heroTitle.split('.')[0]}.<span className="text-emerald-light inline-block relative ml-2">{heroTitle.split('.').slice(1).join('.')}</span></>
              ) : heroTitle}
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-light max-w-2xl mx-auto leading-relaxed">
              {heroSubtitle}
            </p>
          </div>
        </section>

        {/* ── BENTO CARDS DE CONTACT ───────────────────────────────── */}
        <section className="px-6 relative z-20 -mt-24 pb-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* WhatsApp — Glowing */}
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Bonjour, je vous contacte depuis yayyam.com 👋')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-br from-[#25D366] to-[#1DA851] rounded-[2.5rem] p-10 text-white relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(37,211,102,0.3)] transition-all duration-500 hover:-translate-y-2 border border-white/10 flex flex-col justify-between"
            >
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg">
                  <MessageCircle size={32} />
                </div>
                <h3 className="text-3xl font-display font-black mb-3">WhatsApp</h3>
                <p className="text-white/90 font-medium mb-8 text-[15px] leading-relaxed">Réponse la plus rapide, idéale pour vos questions courantes ou pour l'assistance vendeurs.</p>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-sm font-black bg-white/20 backdrop-blur-md w-fit px-5 py-3 rounded-full border border-white/20 hover:bg-white/30 transition-colors">
                  <Phone size={16} />
                  +{whatsapp.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}
                </div>
              </div>
            </a>

            {/* Email — Light */}
            <a
              href={`mailto:${email}`}
              className="bg-white rounded-[2.5rem] p-10 relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(10,31,26,0.06)] transition-all duration-500 hover:-translate-y-2 border border-ink/5 flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mb-8 text-emerald group-hover:scale-110 group-hover:-rotate-6 transition-transform border border-ink/5 shadow-sm">
                  <Mail size={32} />
                </div>
                <h3 className="text-3xl font-display font-black text-ink mb-3">Email</h3>
                <p className="text-ink/60 font-medium mb-8 text-[15px] leading-relaxed">Privilégié pour les opportunités de partenariats, de presse, et pour les requêtes administratives complexes.</p>
              </div>
              <div className="relative z-10">
                <span className="text-sm font-bold text-emerald bg-cream border border-ink/5 px-5 py-3 rounded-full inline-block group-hover:bg-emerald group-hover:text-white transition-colors">{email}</span>
              </div>
            </a>

            {/* Localisation — Dark Mode Glass */}
            <div className="bg-ink rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-white/10 hover:shadow-[0_20px_40px_rgba(10,31,26,0.3)] transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gold/20 blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/10 text-gold group-hover:scale-110 transition-transform shadow-lg">
                  <Clock size={32} />
                </div>
                <h3 className="text-2xl font-display font-black mb-2">Support Actif</h3>
                <p className="text-white/60 text-[15px] font-medium">{hours}</p>
              </div>
              
              <div className="relative z-10 pt-8 border-t border-white/10 mt-8">
                <div className="flex items-center gap-2 text-gold mb-2">
                  <MapPin size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Opérations</span>
                </div>
                <p className="text-white text-lg font-bold">{address}</p>
                {phone && <p className="text-white/50 text-sm mt-1">{phone}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* ── FORMULAIRE PREMIUM ──────────────────────────── */}
        <section className="pb-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-[0_20px_80px_-15px_rgba(10,31,26,0.06)] border border-ink/5 relative overflow-hidden group/card">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-turquoise/5 blur-[120px] rounded-full pointer-events-none transition-transform duration-[2s] group-hover/card:scale-110" />
              
              <div className="relative z-10">
                <div className="text-center mb-16">
                  <div className="w-20 h-20 bg-cream rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-emerald-light border border-ink/5 shadow-sm transform -rotate-3 group-hover/card:rotate-0 transition-transform duration-500">
                    <Send size={36} />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-display font-black text-ink mb-4 tracking-tighter">{formTitle}</h2>
                  <p className="text-lg text-ink/60 font-medium">Une demande très précise ? Remplissez ce formulaire et obtenez une réponse claire dans votre boite mail.</p>
                </div>

                <form action={`https://formsubmit.co/${email}`} method="POST" className="space-y-6">
                  {/* Anti-spam */}
                  <input type="hidden" name="_captcha" value="false" />
                  <input type="hidden" name="_next" value="https://yayyam.com/contact?success=1" />
                  <input type="hidden" name="_subject" value="Nouveau message — yayyam.com/contact" />
                  <input type="text" name="_honey" aria-label="Honeypot" title="Honeypot" className="hidden" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group/input">
                      <label htmlFor="contact-name" className="block text-xs font-black text-ink/40 mb-2 uppercase tracking-widest group-focus-within/input:text-emerald-light transition-colors">
                        Nom complet
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        placeholder="Ex: Aida Ndiaye"
                        className="w-full px-5 py-4 rounded-2xl bg-cream border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-emerald-light focus:ring-4 focus:ring-emerald-light/10 transition-all font-medium hover:border-ink/20"
                      />
                    </div>
                    <div className="group/input">
                      <label htmlFor="contact-email" className="block text-xs font-black text-ink/40 mb-2 uppercase tracking-widest group-focus-within/input:text-emerald-light transition-colors">
                        Email
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        placeholder="contact@exemple.com"
                        className="w-full px-5 py-4 rounded-2xl bg-cream border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-emerald-light focus:ring-4 focus:ring-emerald-light/10 transition-all font-medium hover:border-ink/20"
                      />
                    </div>
                  </div>

                  <div className="group/input">
                    <label htmlFor="contact-subject" className="block text-xs font-black text-ink/40 mb-2 uppercase tracking-widest group-focus-within/input:text-emerald-light transition-colors">
                      Sujet
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      required
                      className="w-full px-5 py-4 rounded-2xl bg-cream border border-ink/10 text-ink focus:outline-none focus:border-emerald-light focus:ring-4 focus:ring-emerald-light/10 transition-all font-medium hover:border-ink/20 appearance-none cursor-pointer"
                    >
                      <option value="">Choisir un sujet...</option>
                      <option value="question_generale">Question générale</option>
                      <option value="probleme_technique">Problème technique (Bugs)</option>
                      <option value="paiement_retrait">Questions relatives aux Paiements / Retraits</option>
                      <option value="partenariat">Demande de Partenariat / Collaboration</option>
                      <option value="signalement">Signaler un vendeur ou un abus interne</option>
                      <option value="suggestion">Suggérer une amélioration</option>
                      <option value="presse">Demande Presse / Médias</option>
                    </select>
                  </div>

                  <div className="group/input">
                    <label htmlFor="contact-message" className="block text-xs font-black text-ink/40 mb-2 uppercase tracking-widest group-focus-within/input:text-emerald-light transition-colors">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={6}
                      required
                      placeholder="Décrivez votre demande en détail..."
                      className="w-full px-5 py-4 rounded-2xl bg-cream border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-emerald-light focus:ring-4 focus:ring-emerald-light/10 transition-all font-medium resize-none hover:border-ink/20"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-ink hover:bg-emerald text-white font-bold py-5 rounded-2xl transition-all shadow-[0_20px_40px_-15px_rgba(10,31,26,0.6)] hover:shadow-[0_20px_40px_-10px_rgba(13,92,74,0.6)] active:scale-[0.98] flex items-center justify-center gap-3 group/btn text-lg"
                    >
                      Envoyer le message
                      <ArrowRight size={20} className="group-hover/btn:translate-x-1.5 transition-transform" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ── RÉSEAUX SOCIAUX & CARTES ───────────────────────── */}
        <section className="pb-32 px-6">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24">
            
            <div className="lg:w-1/3 pt-4">
               <span className="inline-block bg-emerald/10 text-emerald font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 border border-emerald/20">
                 Communauté
               </span>
               <h3 className="text-4xl font-display font-black text-ink mb-6 tracking-tighter">Social Club.</h3>
               <p className="text-lg text-ink/60 font-light mb-10 leading-relaxed">
                 Retrouvez-nous là où l'écosystème Yayyam grandit. Astuces e-commerce, coulisses, nouveautés et moments forts.
               </p>

               <div className="flex flex-wrap gap-4">
                 <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-2xl bg-[#25D366] text-white flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all shadow-lg shadow-[#25D366]/30"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle size={24} />
                  </a>
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all shadow-lg shadow-pink-500/30"
                    aria-label="Instagram"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </a>
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all shadow-lg shadow-[#1877F2]/30"
                    aria-label="Facebook"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                  <a
                    href={tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all shadow-lg shadow-black/30"
                    aria-label="TikTok"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.88 2.89 2.89 0 012.89-2.89c.28 0 .55.04.81.11V9.02a6.25 6.25 0 00-.81-.05A6.36 6.36 0 003.13 15.3 6.36 6.36 0 009.49 21.7a6.36 6.36 0 006.36-6.36V8.86a8.32 8.32 0 004.87 1.56V7a4.82 4.82 0 01-1.13-.31z"/></svg>
                  </a>
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-2xl bg-[#0A66C2] text-white flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all shadow-lg shadow-[#0A66C2]/30"
                    aria-label="LinkedIn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                  </a>
               </div>
            </div>

            <div className="lg:w-2/3">
              {mapsUrl ? (
                <div className="w-full h-full min-h-[350px] rounded-[3rem] overflow-hidden shadow-[0_20px_50px_-15px_rgba(10,31,26,0.1)] border border-ink/5 relative group">
                  <div className="absolute inset-0 bg-ink/5 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
                  <iframe
                    src={mapsUrl}
                    width="100%"
                    height="100%"
                    style={Object.assign({}, { border: 0 })}
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 grayscale-[0.2] contrast-[1.05]"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localisation Yayyam"
                  />
                </div>
              ) : (
                <div className="w-full h-full min-h-[350px] rounded-[3rem] bg-ink/5 border border-ink/10 flex flex-col items-center justify-center text-center p-10">
                   <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-ink/40 mb-6 shadow-sm">
                     <MapPin size={32} />
                   </div>
                   <h4 className="text-xl font-display font-black text-ink mb-2">Bureau de Dakar</h4>
                   <p className="text-ink/60 max-w-sm">Siège des opérations Yayyam au Sénégal. Accès réservé aux employés et partenaires.</p>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ── TRUST BADGES ───────────────────────────────────── */}
        <section className="py-20 px-6 border-y border-ink/5 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-light/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center group">
              <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald border border-ink/5 group-hover:-translate-y-1 group-hover:shadow-md transition-all">
                <Headphones size={28} />
              </div>
              <h4 className="font-display font-black text-xl text-ink mb-2">Support Humain</h4>
              <p className="text-sm text-ink/60 leading-relaxed px-4">Pas de chatbot qui tourne en boucle. Vous parlez à de vraies personnes basées en d'Afrique de l'Ouest.</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald border border-ink/5 group-hover:-translate-y-1 group-hover:shadow-md transition-all">
                <Shield size={28} />
              </div>
              <h4 className="font-display font-black text-xl text-ink mb-2">Confidentiel</h4>
              <p className="text-sm text-ink/60 leading-relaxed px-4">Vos données et celles de vos clients sont chiffrées de bout en bout et hébergées sur des serveurs sécurisés.</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald border border-ink/5 group-hover:-translate-y-1 group-hover:shadow-md transition-all">
                <HelpCircle size={28} />
              </div>
              <h4 className="font-display font-black text-xl text-ink mb-2">Centre d'Aide</h4>
              <p className="text-sm text-ink/60 leading-relaxed px-4">
                Une base de connaissances complète pour <Link href="/#faq" className="text-emerald-light font-bold hover:underline">répondre aux questions fréquentes</Link> en toute autonomie.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER MINI ──────────────────────────────────────── */}
      <footer className="bg-ink py-10 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo textClassName="text-white" />
          </div>
          <p className="text-[13px] text-white/40 font-medium">
            © {new Date().getFullYear()} Yayyam. Tous droits réservés. · <Link href="/conditions-utilisation" className="hover:text-white/70 transition px-1">CGU</Link> · <Link href="/politique-confidentialite" className="hover:text-white/70 transition px-1">Confidentialité</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
