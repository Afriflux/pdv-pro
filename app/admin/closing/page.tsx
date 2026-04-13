import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClosingView } from './ClosingView'

export const metadata = {
  title: 'Centre Closing COD | Yayyam',
}

export default async function ClosingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Fetch closing requests via Supabase instead of Prisma (avoids direct DB connection issues)
  const { data: closingRequests, error } = await admin
    .from('ClosingRequest')
    .select(`
      id, status, created_at, call_attempts, closing_fee, notes, scheduled_at, locked_by, locked_until,
      store:Store!store_id(name),
      order:Order!order_id(id, buyer_name, buyer_phone, total, product:OrderItem(product_title))
    `)
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[Closing] Query error:', error.message)
  }

  // Load history for each request
  const requestIds = (closingRequests ?? []).map((r: any) => r.id) // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data: allHistory } = await admin
    .from('ClosingHistory')
    .select('id, closing_request_id, action, created_at, agent_name, details')
    .in('closing_request_id', requestIds.length > 0 ? requestIds : ['none'])
    .order('created_at', { ascending: true })

  // Load Buyer Scores
  const phones = Array.from(new Set((closingRequests ?? []).map((r: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const order = r.order as any // eslint-disable-line @typescript-eslint/no-explicit-any
    return order?.buyer_phone
  }).filter(Boolean)))

  const { data: buyerScores } = await admin
    .from('BuyerScore')
    .select('phone, score, total_orders, confirmed_orders, cancelled_orders')
    .in('phone', phones.length > 0 ? phones : ['none'])

  const scoresMap = (buyerScores ?? []).reduce((acc: Record<string, any>, score: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    acc[score.phone] = score
    return acc
  }, {} as Record<string, any>) // eslint-disable-line @typescript-eslint/no-explicit-any

  const historyMap = (allHistory ?? []).reduce((acc: Record<string, any[]>, h: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!acc[h.closing_request_id]) acc[h.closing_request_id] = []
    acc[h.closing_request_id].push({
      id: h.id,
      action: h.action,
      createdAt: h.created_at,
      agentName: h.agent_name,
      details: h.details
    })
    return acc
  }, {})

  // Format for client
  const formattedRequests = (closingRequests ?? []).map((req: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const order = req.order as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const store = req.store as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const products = order?.product as any[] ?? [] // eslint-disable-line @typescript-eslint/no-explicit-any
    return {
      id: req.id,
      orderId: order?.id ?? '',
      status: req.status,
      createdAt: req.created_at,
      callAttempts: req.call_attempts ?? 0,
      closingFee: req.closing_fee ?? 0,
      buyerName: order?.buyer_name ?? 'Inconnu',
      buyerPhone: order?.buyer_phone ?? '',
      productName: products[0]?.product_title ?? 'Produit',
      storeName: store?.name ?? 'Boutique',
      orderTotal: order?.total ?? 0,
      score: scoresMap[order?.buyer_phone] || null,
      notes: req.notes || '',
      scheduledAt: req.scheduled_at || null,
      lockedBy: req.locked_by,
      lockedUntil: req.locked_until || null,
      history: historyMap[req.id] || []
    }
  })

  // KPI Calculations
  const pendingCount = formattedRequests.filter(r => r.status === 'PENDING').length
  const validatedCount = formattedRequests.filter(r => r.status === 'VALIDATED').length
  const rejectedCount = formattedRequests.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLATION_REQUESTED').length
  
  const processedCount = validatedCount + rejectedCount + formattedRequests.filter(r => r.status === 'NO_REPLY').length
  const successRate = processedCount > 0 ? Math.round((validatedCount / processedCount) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 font-sans overflow-x-hidden">
      
      {/* ── EN-TÊTE FULL BLEED IMMERSIF ── */}
      <div className="relative bg-gradient-to-br from-[#012928] via-[#0A4138] to-[#04332A] pt-12 pb-36 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden">
        {/* Motif Glassmorphism de fond */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        {/* Glow Effects */}
        <div className="absolute top-0 right-10 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -z-0 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[100px] -z-0 pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="w-full relative z-10 flex flex-col pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-widest uppercase">
                  Service Call-Center
                </span>
                {pendingCount > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Yayyam <span className="text-emerald-400">Closing</span>
              </h1>
              <p className="mt-4 text-emerald-100/70 text-sm max-w-xl font-medium leading-relaxed">
                Traitement des appels téléphoniques et validation des expéditions par paiement à la livraison.
              </p>
            </div>

            {/* KPIs Header */}
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md min-w-[130px]">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">En File</p>
                <p className="text-3xl font-black text-white">{pendingCount}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md min-w-[130px]">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Validés</p>
                <p className="text-3xl font-black text-white">{validatedCount}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md min-w-[130px]">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Taux Succès</p>
                <p className="text-3xl font-black text-white">{successRate}%</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL (Pleine largeur) ── */}
      <div className="w-full flex-col flex -mt-24 relative z-20 px-0">
        <ClosingView initialRequests={formattedRequests as any} />
      </div>
    </div>
  )
}
