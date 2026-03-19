'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function completeOnboarding(data: { slug: string, sector: string, whatsapp: string }) {
  console.log('=== completeOnboarding START ===')
  console.log('data reçue:', data)
  
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('user:', user?.id)
  console.log('error auth:', error)
  
  if (!user) {
    console.log('PAS DE USER — abandon')
    throw new Error('Non authentifié')
  }

  try {
    // Vérifier slug existant
    const existing = await prisma.store.findUnique({
      where: { slug: data.slug }
    })
    console.log('Store existant avec ce slug:', existing)

    // Attention, le client envoie `sector`, pas `secteur`.
    const store = await prisma.store.upsert({
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
    console.log('Store créé/mis à jour:', store)

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
    console.log('Wallet créé')

  } catch (err) {
    console.error('ERREUR completeOnboarding:', err)
    throw err
  }

  console.log('=== completeOnboarding END ===')
  // On retourne { success: true } car sur le client page.tsx, 
  // catch(e) intercepterait un vrai redirect() comme une erreur.
  return { success: true }
}
