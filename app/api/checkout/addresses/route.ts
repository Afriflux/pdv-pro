import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Lookup des adresses de livraison enregistrées par un client.
 * Utilisé par le checkout pour pré-remplir l'adresse de livraison.
 * Recherche par email OU téléphone (champs publics du formulaire checkout).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.trim()
  const phone = searchParams.get('phone')?.trim()

  if (!email && !phone) {
    return NextResponse.json({ addresses: [] })
  }

  try {
    // Trouver l'utilisateur par email ou téléphone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ]
      },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ addresses: [] })
    }

    // Récupérer ses adresses de livraison
    const addresses = await prisma.deliveryAddress.findMany({
      where: { user_id: user.id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
      select: {
        label: true,
        name: true,
        phone: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        delivery_notes: true,
        is_default: true,
      }
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('[Checkout Addresses Lookup]', error)
    return NextResponse.json({ addresses: [] })
  }
}
