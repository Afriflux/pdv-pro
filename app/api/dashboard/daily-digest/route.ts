import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('storeId')
  if (!storeId) {
    return NextResponse.json(null, { status: 400 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const digest = await prisma.dailyDigest.findUnique({
    where: { store_id_date: { store_id: storeId, date: today } },
    select: {
      id: true,
      summary: true,
      metrics: true,
      suggestions: true,
      score: true,
      read: true,
      date: true,
    },
  })

  if (!digest) {
    return NextResponse.json(null, { status: 404 })
  }

  return NextResponse.json(digest)
}

// Mark digest as read
export async function PATCH(req: NextRequest) {
  try {
    const { digestId } = await req.json() as { digestId: string }
    if (!digestId) {
      return NextResponse.json({ error: 'Missing digestId' }, { status: 400 })
    }

    await prisma.dailyDigest.update({
      where: { id: digestId },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
