import { NextRequest, NextResponse } from 'next/server'
import { checkBuyerForCOD } from '@/lib/anti-fraud/buyer-check'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { phone, storeId } = await req.json() as { phone: string, storeId?: string }

    if (!phone || phone.trim().length < 8) {
      return NextResponse.json({ error: 'Numéro invalide.' }, { status: 400 })
    }

    // App Store verification: Only run fraud check if 'fraud-cod' app is installed
    if (storeId) {
      const isInstalled = await prisma.installedApp.findUnique({
        where: { store_id_app_id: { store_id: storeId, app_id: 'fraud-cod' } }
      })
      if (!isInstalled || isInstalled.status !== 'active') {
        return NextResponse.json({ allowed: true, message: null, riskLevel: 'unknown', score: null })
      }
    }

    const result = await checkBuyerForCOD(phone.trim())
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Erreur de vérification.' }, { status: 500 })
  }
}
