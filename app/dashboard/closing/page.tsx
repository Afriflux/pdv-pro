import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ClosingView } from './ClosingView'

export const metadata = {
  title: 'Centre Closing COD | Yayyam',
}

export default async function ClosingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')



  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // Load all recent closing requests (pending first)
  const closingRequests = await prisma.closingRequest.findMany({
    where: { store_id: store.id },
    orderBy: [
      { status: 'asc' }, // PENDING will usually sort before VALIDATED or REJECTED
      { created_at: 'desc' }
    ],
    include: {
      store: { select: { name: true } },
      history: { orderBy: { created_at: 'asc' } },
      order: {
        include: {
          product: {
            select: { name: true }
          }
        }
      }
    },
    take: 50
  })

  // Load Buyer Score for the phones involved
  type ClosingRequestPayload = typeof closingRequests[0]
  const phones = Array.from(new Set(closingRequests.map((r: ClosingRequestPayload) => r.order.buyer_phone)))
  const buyerScores = await prisma.buyerScore.findMany({
    where: { phone: { in: phones } }
  })

  type ScorePayload = typeof buyerScores[0]
  const scoresMap = buyerScores.reduce((acc: Record<string, ScorePayload>, score: ScorePayload) => {
    acc[score.phone] = score
    return acc
  }, {} as Record<string, ScorePayload>)

  // Clean data for the client
  const formattedRequests = closingRequests.map((req: any) => {
    const p = req.order.product
    const productName = Array.isArray(p) ? p[0]?.name : p?.name

    return {
      id: req.id,
      orderId: req.order.id,
      status: req.status,
      createdAt: req.created_at.toISOString(),
      callAttempts: req.call_attempts,
      closingFee: req.closing_fee,
      buyerName: req.order.buyer_name,
      buyerPhone: req.order.buyer_phone,
      productName: productName,
      storeName: req.store.name,
      orderTotal: req.order.total,
      score: scoresMap[req.order.buyer_phone] || null,
      notes: req.notes || '',
      scheduledAt: req.scheduled_at ? req.scheduled_at.toISOString() : null,
      lockedBy: req.locked_by,
      lockedUntil: req.locked_until ? req.locked_until.toISOString() : null,
      history: req.history.map((h: any) => ({
        id: h.id,
        action: h.action,
        createdAt: h.created_at.toISOString(),
        agentName: h.agent_name,
        details: h.details
      }))
    }
  })

  return (
    <>
      <header className="bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 shadow-sm px-6 py-5 sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[#1A1A1A] text-xl font-bold">Centre de Validation COD</h1>
            <p className="text-sm text-gray-500 mt-1">Gérez les appels de confirmation pour protéger vos livraisons.</p>
          </div>
        </div>
      </header>
      <ClosingView initialRequests={formattedRequests} />
    </>
  )
}
