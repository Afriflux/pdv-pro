import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_ADDRESSES = 3

/**
 * POST /api/checkout/save-address
 * Permet de sauvegarder une adresse de livraison post-achat.
 * Lookup par email pour trouver le User correspondant.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, name, phone, address, label } = await req.json() as {
      email: string
      name: string
      phone: string
      address: string
      label: string
    }

    if (!email || !name || !phone || !address || !label) {
      return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
    }

    // Trouver l'utilisateur par email
    const user = await prisma.user.findFirst({
      where: { email: email.trim() },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 })
    }

    // Vérifier la limite
    const count = await prisma.deliveryAddress.count({ where: { user_id: user.id } })
    if (count >= MAX_ADDRESSES) {
      return NextResponse.json({ error: 'Limite atteinte.' }, { status: 400 })
    }

    // Vérifier qu'il n'existe pas déjà une adresse identique
    const existing = await prisma.deliveryAddress.findFirst({
      where: { user_id: user.id, address: address.trim() }
    })
    if (existing) {
      return NextResponse.json({ message: 'Adresse déjà enregistrée.' })
    }

    const shouldBeDefault = count === 0

    if (shouldBeDefault) {
      await prisma.deliveryAddress.updateMany({
        where: { user_id: user.id },
        data: { is_default: false }
      })
    }

    await prisma.deliveryAddress.create({
      data: {
        user_id: user.id,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        label,
        is_default: shouldBeDefault,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Save Address]', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
