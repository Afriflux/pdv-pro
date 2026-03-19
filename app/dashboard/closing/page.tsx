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
  const formattedRequests = closingRequests.map((req: ClosingRequestPayload) => {
    const p = req.order.product as unknown as { name: string } | { name: string }[]
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
      score: scoresMap[req.order.buyer_phone] || null
    }
  })

  return (
    <>
      <header className="bg-white border-b border-line shadow-sm px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-ink text-xl font-bold">Centre de Validation COD</h1>
            <p className="text-sm text-gray-500 mt-1">Gérez les appels de confirmation pour protéger vos livraisons.</p>
          </div>
        </div>
      </header>
      <ClosingView initialRequests={formattedRequests} />
    </>
  )
}
