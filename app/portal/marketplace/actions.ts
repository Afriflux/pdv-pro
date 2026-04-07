'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function generateAffiliateToken(length: number = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function applyForAffiliation(storeId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Non autorisé')

    // On vérifie que la boutique a de l'affiliation active
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    })

    if (!store || !store.affiliate_active) {
      throw new Error('Ce programme d\'affiliation n\'est plus disponible.')
    }

    // Vérifier si une demande existe déjà
    const existing = await prisma.affiliate.findFirst({
      where: { user_id: user.id, vendor_id: storeId }
    })

    if (existing) {
      throw new Error('Vous avez déjà postulé à ce programme.')
    }

    // On crée l'affiliation (status: pending)
    await prisma.affiliate.create({
      data: {
        user_id: user.id,
        store_id: storeId,
        vendor_id: storeId,
        status: 'pending', // Validation requise par le vendeur
        commission_rate: store.affiliate_margin * 100, // stocké en pourcentage pour l'affichage (si store marge = 0.1 => 10)
        token: `AFF_${generateAffiliateToken()}`,
        code: generateAffiliateToken()
      }
    })

    // Créer une notification pour le vendeur
    await prisma.notification.create({
      data: {
        user_id: store.user_id,
        title: 'Nouveau Partenaire Affilié 🤝',
        message: 'Un nouvel affilié souhaite promouvoir vos produits. Allez dans Affiliation pour valider sa demande.',
        type: 'affiliate_request',
        link: '/dashboard/affiliates' // route vendeur
      }
    })

    revalidatePath('/portal/marketplace')
    return { success: true, status: 'pending' }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
