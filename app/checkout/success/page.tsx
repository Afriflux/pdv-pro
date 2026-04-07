import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Check, X, CheckCircle2, MessageCircle, Star, Share2 } from 'lucide-react'
import { PromoCopyButton } from './PromoCopyButton'

interface SuccessPageProps {
  searchParams: { order?: string; cod?: string; status?: string }
}

async function SuccessContent({ 
  orderId, 
  isCod, 
  statusParam
}: { 
  orderId: string; 
  isCod: boolean; 
  statusParam: string;
}) {
  const isFailed = statusParam === 'failed'
  
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('Order')
    .select(`
      id, buyer_name, buyer_phone, total, payment_method, status, product_id,
      product:Product(name, type, images, booking_link),
      store:Store(name, primary_color, slug, whatsapp, closing_enabled),
      booking:Booking(date, start_time, end_time)
    `)
    .eq('id', orderId)
    .single()

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-5xl">❌</div>
          <p className="text-gray-600">Commande introuvable.</p>
          <Link href="/" className="text-emerald hover:text-emerald-rich underline text-sm transition-colors">Retour à l&apos;accueil</Link>
        </div>
      </div>
    )
  }

  const product = (Array.isArray(order.product) ? order.product[0] : order.product) as { name: string; type: string; images: string[]; booking_link: string } | null
  const store   = (Array.isArray(order.store)   ? order.store[0]   : order.store)   as { name: string; primary_color: string; slug: string; whatsapp: string; closing_enabled: boolean } | null
  const booking = (Array.isArray(order.booking) ? order.booking[0] : order.booking) as { date: string; start_time: string; end_time: string } | null
  
  let telegramCommunity: { chat_title: string } | null = null
  if (order?.product_id) {
    const { data: community } = await supabase
      .from('TelegramCommunity')
      .select('chat_title')
      .eq('product_id', order.product_id)
      .eq('is_active', true)
      .maybeSingle()
    telegramCommunity = community
  }

  const formattedOrderId = order.id.split('-')[0].toUpperCase()

  // Generation de l'ICS si c'est un coaching
  let icsDataUrl = ''
  let visioLink = ''
  if (booking) {
    const dStr = booking.date.split('T')[0].replace(/-/g, '') // YYYYMMDD
    const st = booking.start_time.replace(':', '') + '00'
    const et = booking.end_time ? booking.end_time.replace(':', '') + '00' : st
    const icsString = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${dStr}T${st}Z
DTEND:${dStr}T${et}Z
SUMMARY:Réservation - ${product?.name}
DESCRIPTION:Lien Visio: ${product?.booking_link || `https://meet.jit.si/YayyamPro_${orderId}`}
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '%0A').replace(/ /g, '%20')
    icsDataUrl = `data:text/calendar;charset=utf8,${icsString}`
    visioLink = product?.booking_link || `https://meet.jit.si/YayyamPro_${orderId}`
  }

  if (isFailed) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
        <div className="bg-white border border-line rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          
          <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <X size={40} strokeWidth={2.5} />
          </div>
          
          <h1 className="font-display text-ink text-2xl font-bold mb-2">
            Paiement échoué
          </h1>
          
          <p className="text-slate text-sm mb-6">
            Une erreur est survenue lors de votre tentative de paiement.
          </p>
          
          <div className="bg-cream rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-dust">Commande</span>
              <span className="text-ink font-mono text-xs font-semibold">#{formattedOrderId}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-dust">Statut</span>
              <span className="text-red-600 font-medium">Échoué ✗</span>
            </div>
          </div>
          
          <Link href="/" className="block w-full bg-red-600 text-white py-3 rounded-xl font-medium text-center hover:bg-red-700 transition">
            Réessayer
          </Link>
        </div>
      </div>
    )
  }

  const accent = (store as any)?.primary_color || '#0F7A60'

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
      <div className="bg-white border border-line rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        
        {/* Icône succès animée */}
        <div className="w-20 h-20 border-2 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce" style={{ backgroundColor: `${accent}11`, borderColor: `${accent}33`, color: accent }}>
          <CheckCircle2 size={40} strokeWidth={2.5} />
        </div>
        
        {/* Titre */}
        <h1 className="font-display text-ink text-2xl font-bold mb-2">
          Commande confirmée !
        </h1>
        
        {/* Sous-titre dynamique */}
        <p className="text-slate text-sm mb-6">
          Merci pour votre achat. Le vendeur a été notifié. {isCod && (store as any)?.closing_enabled 
            ? " Un de nos agents téléphoniques vous contactera sous peu pour confirmer l'expédition de votre commande."
            : isCod 
              ? " Paiement à la réception de votre commande."
              : product?.type === 'digital' 
                ? telegramCommunity 
                  ? " Cliquez ci-dessous pour débloquer votre accès au groupe VIP Telegram."
                  : " Vous recevrez votre accès ou produit numérique très bientôt."
                : " Vous serez contacté pour le suivi de votre livraison."}
        </p>
        
        {/* Récap commande */}
        <div className="bg-cream rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-dust">Commande</span>
            <span className="text-ink font-mono text-xs font-semibold">#{formattedOrderId}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-dust">Produit</span>
            <span className="text-ink font-medium max-w-[60%] text-right truncate">{product?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-dust">Montant</span>
            <span className="text-ink font-bold">{order.total.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-line">
            <span className="text-dust">Statut</span>
            {isCod ? (
              <span className="text-amber-600 font-medium font-mono text-xs">À LA LIVRAISON</span>
            ) : (
              <span className="font-medium flex items-center gap-1" style={{ color: accent }}>Payé <Check size={14} /></span>
            )}
          </div>
        </div>
        
        {/* Réservation Booking / Coaching */}
        {booking && (
          <div className="bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-xl p-5 mb-6 text-left space-y-3">
            <h3 className="font-bold text-[#0F7A60] flex items-center gap-2 mb-2">
              <span className="text-lg">📅</span> Votre rendez-vous
            </h3>
            <p className="text-sm text-ink mb-1">
              <strong>Date :</strong> {new Date(booking.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-ink mb-3">
              <strong>Heure :</strong> {booking.start_time} {booking.end_time ? `- ${booking.end_time}` : ''}
            </p>
            <div className="flex gap-2">
              <a href={visioLink} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 bg-[#0F7A60] hover:bg-[#0c624d] text-white text-xs font-bold uppercase tracking-wider text-center rounded-lg transition">
                Rejoindre Visio
              </a>
              <a href={icsDataUrl} download={`YayyamPro_Booking_${formattedOrderId}.ics`} className="flex-1 py-2.5 bg-white border border-line hover:bg-cream text-[#0F7A60] text-xs font-bold uppercase tracking-wider text-center rounded-lg transition">
                + Agenda
              </a>
            </div>
            
            {(store as any)?.whatsapp && (
              <div className="mt-2">
                <a suppressHydrationWarning href={`https://wa.me/${(store as any).whatsapp}?text=${encodeURIComponent(`Bonjour, j'ai réservé une session de "${product?.name}" le ${new Date(booking.date).toLocaleDateString('fr-FR')} à ${booking.start_time} (Commande #${formattedOrderId}). J'ai un imprévu, est-il possible de reprogrammer ce rendez-vous s'il vous plaît ?`)}`} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 bg-white border border-line hover:bg-cream text-dust text-xs font-bold uppercase tracking-wider text-center rounded-lg transition">
                  Demander une reprogrammation
                </a>
              </div>
            )}
          </div>
        )}
        
        {/* Notification accès Telegram */}
        {telegramCommunity && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 text-left shadow-inner">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-lg">✈️</span>
              </div>
              <div>
                <p className="font-bold text-blue-900 text-sm leading-tight">
                  Groupe VIP : "{telegramCommunity.chat_title}"
                </p>
                <p className="text-blue-700 text-xs mt-0.5 font-medium">
                  Votre accès sécurisé est prêt.
                </p>
              </div>
            </div>
            
            <a 
              href={`https://t.me/YayyamProBot?start=${orderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full bg-[#0088cc] hover:bg-[#0077b5] text-white py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              Récupérer mon accès VIP
            </a>
            <p className="text-[11px] text-blue-600/70 text-center mt-3 font-medium leading-relaxed">
              Discutez avec notre bot officiel pour récupérer<br/>votre lien d'invitation à usage unique.
            </p>
          </div>
        )}
        
        {/* CTAs */}
        <div className="space-y-3">
          <Link href={`/track?ref=${orderId}`} className="block w-full bg-slate-900 text-white py-3 rounded-xl font-medium text-center hover:bg-black transition shadow-lg">
            Suivre ma commande
          </Link>
          <Link href={`/${(store as any)?.slug || ''}`} className="block w-full text-slate border border-line py-3 rounded-xl font-medium text-center hover:bg-gray-50 transition">
            Retour à l'espace de vente
          </Link>
          
          {/* Micro-affiliation */}
          <div className="mt-8 bg-emerald/5 border border-emerald/20 rounded-xl p-5 text-left text-sm">
            <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
              <Share2 className="text-emerald" size={18} />
              Gagnez de l'argent en partageant !
            </h3>
            <p className="text-slate mb-4 leading-snug">Partagez ce lien avec vos amis. Pour chaque achat via votre lien, vous gagnez une commission.</p>
            <div className="flex gap-2">
              <input type="text" readOnly value={`https://yayyam.com/checkout/${order.product_id}?ref=${order.buyer_phone || ''}`} className="flex-1 text-xs px-3 py-2 bg-white border border-line rounded-lg text-dust outline-none truncate" />
              <a suppressHydrationWarning href={`https://wa.me/?text=Découvre %20${encodeURIComponent(product?.name || '')}%20sur%20Yayyam%20Pro:%20https://yayyam.com/checkout/${order.product_id}?ref=${order.buyer_phone || ''}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[#25D366] text-white rounded-lg flex items-center justify-center hover:bg-[#20b858] transition">
                <Share2 size={16} />
              </a>
            </div>
          </div>
          
          {(store as any)?.whatsapp && (
             <a suppressHydrationWarning href={`https://wa.me/${(store as any).whatsapp}?text=Bonjour, concernant ma commande ${formattedOrderId}...`} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#25D366] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#20b858] transition shadow-lg mb-8">
               <MessageCircle size={18} />
               Contacter sur WhatsApp
             </a>
          )}
        </div>

        {/* ── ENCARTS POST-ACHAT ── */}
        <div className="mt-8 space-y-4 pt-8 border-t border-line text-left">
          
          {/* 1. Laissez un avis */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center transition hover:shadow-md">
            <h4 className="font-bold text-amber-900 mb-1">Satisfait de votre achat ?</h4>
            <p className="text-xs text-amber-700 mb-3">Laissez un avis au vendeur pour l'encourager.</p>
            <Link href={`/${(store as any)?.slug}/${order.product_id}#reviews`} className="flex justify-center gap-1 group">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={28} className="text-amber-300 group-hover:text-amber-500 fill-amber-300 group-hover:fill-amber-500 transition-colors cursor-pointer" />
              ))}
            </Link>
          </div>

          {/* 2. Partagez votre trouvaille */}
          <div className="bg-[#FAFAF7] border border-line rounded-xl p-5 text-center">
            <h4 className="font-bold text-ink mb-1 flex items-center justify-center gap-2"><Share2 size={16}/> Partagez votre trouvaille</h4>
            <p className="text-xs text-slate mb-4">Recommandez ce produit à vos amis.</p>
            <div className="flex justify-center gap-3">
              <a href={`https://wa.me/?text=Je viens d'acheter sur ${(store as any)?.name || 'cette boutique'} via Yayyam ! Regarde : https://yayyam.com/${(store as any)?.slug}/${order.product_id}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition">WA</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=https://yayyam.com/${(store as any)?.slug}/${order.product_id}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition">FB</a>
            </div>
          </div>

          {/* 3. Promo code */}
          <div className="bg-emerald/5 border border-emerald/20 rounded-xl p-5 text-center">
             <h4 className="font-bold text-emerald-rich mb-1">Cadeau pour votre prochaine commande</h4>
             <p className="text-xs text-emerald/80 mb-3">Profitez de -5% sur tous les produits de la boutique.</p>
             <PromoCopyButton code="MERCI5" />
          </div>

        </div>

      </div>
    </div>
  )
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  // Les services de paiement tiers renvoient parfois order_id ou order
  const orderId = (searchParams as any).order_id || searchParams.order
  const isCod   = searchParams.cod === 'true'
  const status  = searchParams.status || 'success'

  if (!orderId) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
        <div className="bg-white border border-line rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald/10 border-2 border-emerald/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-emerald text-4xl">✓</span>
          </div>
          <h1 className="font-display text-ink text-2xl font-bold mb-2">Commande confirmée !</h1>
          <p className="text-slate text-sm mb-6">Vous recevrez une confirmation WhatsApp dans quelques instants.</p>
          <a href="/" className="block w-full bg-emerald text-white py-3 rounded-xl font-medium text-center hover:bg-emerald-rich transition shadow-md shadow-emerald/20">
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent 
        orderId={orderId as string} 
        isCod={isCod} 
        statusParam={status} 
      />
    </Suspense>
  )
}
