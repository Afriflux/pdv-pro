'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function installAppAction(appId: string, settings?: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non autorisé" }

  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) return { success: false, error: "Boutique non trouvée" }

  try {
    await prisma.installedApp.upsert({
      where: {
        store_id_app_id: { store_id: store.id, app_id: appId }
      },
      update: {
        status: 'active',
        settings: settings || {}
      },
      create: {
        store_id: store.id,
        app_id: appId,
        status: 'active',
        settings: settings || {}
      }
    })

    // Synchronisation pour la fusion de l'app Telegram
    if (appId === 'telegram') {
      await prisma.installedApp.upsert({
        where: { store_id_app_id: { store_id: store.id, app_id: 'telegram-alerts' } },
        update: { status: 'active' },
        create: { store_id: store.id, app_id: 'telegram-alerts', status: 'active' }
      }).catch((e) => { console.error('[Apps] Telegram sync install failed:', e) })
    }
    
    // On force la mise à jour de la disposition entière (Sidebar)
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function uninstallAppAction(appId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non autorisé" }

  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) return { success: false, error: "Boutique non trouvée" }

  try {
    await prisma.installedApp.delete({
      where: {
        store_id_app_id: { store_id: store.id, app_id: appId }
      }
    })

    // Synchronisation suppression
    if (appId === 'telegram') {
      await prisma.installedApp.deleteMany({
        where: { store_id: store.id, app_id: 'telegram-alerts' }
      }).catch((e) => { console.error('[Apps] Telegram sync uninstall failed:', e) })
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (err: any) {
    if (err.code === 'P2025') return { success: true } // n'existait pas
    console.error(err)
    return { success: false, error: err.message }
  }
}
