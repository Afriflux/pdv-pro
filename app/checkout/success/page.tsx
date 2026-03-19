import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Check, X, CheckCircle2, MessageCircle } from 'lucide-react'

interface SuccessPageProps {
  searchParams: { order?: string; cod?: string; status?: string; simulated?: string }
}

async function SuccessContent({ 
  orderId, 
  isCod, 
  statusParam, 
  isSimulated 
}: { 
  orderId: string; 
  isCod: boolean; 
  statusParam: string;
  isSimulated: boolean;
}) {
  const isFailed = statusParam === 'failed'
  
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('Order')
    .select(`
      id, buyer_name, total, payment_method, status,
      product:Product(name, type, images),
      store:Store(name, primary_color, slug, whatsapp, closing_enabled)
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

  const product = (Array.isArray(order.product) ? order.product[0] : order.product) as { name: string; type: string; images: string[] } | null
  const store   = (Array.isArray(order.store)   ? order.store[0]   : order.store)   as { name: string } | null
  
  const formattedOrderId = order.id.split('-')[0].toUpperCase()

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
          {isSimulated && (
            <span className="block mb-2 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 py-1 px-2 rounded-lg uppercase tracking-widest">
              ⚡ Commande de test (Simulation)
            </span>
          )}
          Merci pour votre achat. Le vendeur a été notifié. {isCod && (store as any)?.closing_enabled 
            ? " Un de nos agents téléphoniques vous contactera sous peu pour confirmer l'expédition de votre commande."
            : isCod 
              ? " Paiement à la réception de votre commande."
              : product?.type === 'digital' 
                ? " Vous recevrez votre accès ou produit numérique très bientôt."
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
        
        {/* CTAs */}
        <div className="space-y-3">
          <Link href={`/${(store as any)?.slug || ''}`} className="block w-full text-white py-3 rounded-xl font-medium text-center transition shadow-lg" style={{ backgroundColor: accent }}>
            Retour à l'espace de vente
          </Link>
          {(store as any)?.whatsapp && (
             <a href={`https://wa.me/${(store as any).whatsapp}?text=Bonjour, concernant ma commande ${formattedOrderId}...`} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#25D366] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#20b858] transition shadow-lg">
               <MessageCircle size={18} />
               Contacter sur WhatsApp
             </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  // Les services de paiement tiers renvoient parfois order_id ou order
  const orderId = (searchParams as any).order_id || searchParams.order
  const isCod   = searchParams.cod === 'true'
  const isSimulated = searchParams.simulated === 'true'
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
        isSimulated={isSimulated} 
      />
    </Suspense>
  )
}
