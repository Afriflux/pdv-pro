import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrdersView from './OrdersView'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  const { data: orders } = await supabase
    .from('Order')
    .select(`
      id, buyer_name, buyer_phone, total, status,
      payment_method, quantity, created_at,
      product:Product(name, images)
    `)
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Adaptation du type pour Product
  const formattedOrders = (orders ?? []).map(order => ({
    ...order,
    product: Array.isArray(order.product) ? order.product[0] : order.product
  }))

  return (
    <>
      <header className="bg-white border-b border-line shadow-sm px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-ink text-xl font-bold">Mes Commandes</h1>
          </div>
        </div>
      </header>
      <OrdersView 
        initialOrders={formattedOrders as any} 
        storeName={store.name}
        storeId={store.id} 
      />
    </>
  )
}
