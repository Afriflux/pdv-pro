import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Récupérer les 5 derniers produits
    const { data: products } = await supabase
      .from('Product')
      .select('id, name, created_at, store:Store(name)')
      .order('created_at', { ascending: false })
      .limit(5)

    // 2. Récupérer les 5 dernières boutiques
    const { data: stores } = await supabase
      .from('Store')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // 3. Récupérer les 5 dernières commandes
    const { data: orders } = await supabase
      .from('Order')
      .select('id, total, created_at, Store(name)')
      .order('created_at', { ascending: false })
      .limit(5)

    // 4. Formater toutes les activités
    const activities: any[] = []

    if (products) {
      products.forEach((p: any) => {
        const storeName = Array.isArray(p.store) ? p.store[0]?.name : p.store?.name
        activities.push({
          id: `prod-${p.id}`,
          type: 'product',
          title: 'Nouveau Produit',
          subtitle: `${p.name} (Boutique: ${storeName || 'Anonyme'})`,
          time: formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: fr }),
          timestamp: new Date(p.created_at).getTime(),
          link: `/admin/products?q=${encodeURIComponent(p.name)}`
        })
      })
    }

    if (stores) {
      stores.forEach((s: any) => {
        activities.push({
          id: `store-${s.id}`,
          type: 'store',
          title: 'Nouvelle Boutique',
          subtitle: `${s.name} a été créée`,
          time: formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: fr }),
          timestamp: new Date(s.created_at).getTime(),
          link: `/admin/vendeurs/${s.id}`
        })
      })
    }

    if (orders) {
      orders.forEach((o: any) => {
        const storeName = Array.isArray(o.Store) ? o.Store[0]?.name : o.Store?.name
        activities.push({
          id: `order-${o.id}`,
          type: 'order',
          title: 'Nouvelle Vente !',
          subtitle: `${o.total} FCFA (Boutique: ${storeName || 'Inconnu'})`,
          time: formatDistanceToNow(new Date(o.created_at), { addSuffix: true, locale: fr }),
          timestamp: new Date(o.created_at).getTime(),
          link: `/admin/orders`
        })
      })
    }

    // 5. Trier chronologiquement (plus récent en haut) et limiter à 15
    const sortedActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15)

    return NextResponse.json({ activities: sortedActivities })
  } catch (error: any) {
    console.error('Error in /api/admin/activities:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
