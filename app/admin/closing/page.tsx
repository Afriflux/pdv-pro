import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ClosingView } from './ClosingView'

export const metadata = {
  title: 'Centre Closing COD | PDV Pro',
}

export default async function ClosingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')



  const closingRequests = await prisma.closingRequest.findMany({
    orderBy: [
      { status: 'asc' }, // PENDING then others
      { created_at: 'desc' }
    ],
    include: {
      store: { select: { name: true } },
      history: { orderBy: { created_at: 'asc' } },
      order: {
        include: {
          product: { select: { name: true } }
        }
      }
    },
    take: 200 // More items for a real dashboard
  })

  // Load Buyer Score for the phones involved
  const phones = Array.from(new Set(closingRequests.map((r: any) => r.order.buyer_phone)))
  const buyerScores = await prisma.buyerScore.findMany({
    where: { phone: { in: phones } }
  })

  const scoresMap = buyerScores.reduce((acc: Record<string, any>, score: any) => {
    acc[score.phone] = score
    return acc
  }, {} as Record<string, any>)

  // Clean data for the client
  const formattedRequests = closingRequests.map((req: any) => ({
    id: req.id,
    orderId: req.order.id,
    status: req.status,
    createdAt: req.created_at.toISOString(),
    callAttempts: req.call_attempts,
    closingFee: req.closing_fee,
    buyerName: req.order.buyer_name,
    buyerPhone: req.order.buyer_phone,
    productName: Array.isArray(req.order.product) ? req.order.product[0]?.name : req.order.product?.name,
    storeName: req.store.name,
    orderTotal: req.order.total,
    score: scoresMap[req.order.buyer_phone] || null,
    notes: req.notes || '',
    scheduledAt: req.scheduled_at ? req.scheduled_at.toISOString() : null,
    lockedBy: req.locked_by,
    lockedUntil: req.locked_until ? req.locked_until.toISOString() : null,
    history: req.history ? req.history.map((h: any) => ({
      id: h.id,
      action: h.action,
      createdAt: h.created_at.toISOString(),
      agentName: h.agent_name,
      details: h.details
    })) : []
  }))

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
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black tracking-widest uppercase">
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
                PDV Pro <span className="text-emerald-400">Closing</span>
              </h1>
              <p className="mt-4 text-emerald-100/70 text-sm max-w-xl font-medium leading-relaxed">
                Traitement des appels téléphoniques et validation des expéditions par paiement à la livraison.
              </p>
            </div>

            {/* KPIs Header */}
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md min-w-[130px]">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">En File</p>
                <p className="text-3xl font-black text-white">{pendingCount}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md min-w-[130px]">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Validés</p>
                <p className="text-3xl font-black text-white">{validatedCount}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md min-w-[130px]">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Taux Succès</p>
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
