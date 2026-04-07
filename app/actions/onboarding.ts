'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function completeOnboarding(data: { slug: string, sector: string, whatsapp: string }) {
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  
  if (!user) {
    throw new Error('Non authentifié')
  }

  try {


    // Attention, le client envoie `sector`, pas `secteur`.
    await prisma.store.upsert({
      where: { user_id: user.id },
      create: {
        id: randomUUID(),
        user_id: user.id,
        slug: data.slug,
        name: data.slug.replace(/-/g, ' '),
        category: data.sector,
        whatsapp: data.whatsapp,
        onboarding_completed: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      update: {
        slug: data.slug,
        category: data.sector,
        whatsapp: data.whatsapp,
        onboarding_completed: true,
        updated_at: new Date(),
      },
    })

    // Récupérer le store créé
    const storeCreated = await prisma.store.findUnique({
      where: { user_id: user.id },
      select: { id: true }
    })

    if (!storeCreated) throw new Error('Store non trouvé')

    // Créer Wallet avec ID explicite
    const walletId = randomUUID()
    await prisma.wallet.upsert({
      where: { vendor_id: storeCreated.id },
      create: {
        id: walletId,
        vendor_id: storeCreated.id,
        balance: 0,
        pending: 0,
        total_earned: 0,
      },
      update: {},
    })

  } catch (err) {
    console.error('ERREUR completeOnboarding:', err)
    throw err
  }

  // On retourne { success: true } car sur le client page.tsx, 
  // catch(e) intercepterait un vrai redirect() comme une erreur.
  return { success: true }
}
