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
      id, buyer_name, buyer_phone, delivery_address,
      quantity, subtotal, platform_fee, vendor_amount, total,
      status, payment_method, payment_ref, created_at,
      product:Product(id, name, images, type, price),
      variant:ProductVariant(value_1, value_2, dimension_1, dimension_2),
      invoices:Invoice(pdf_url)
    `)
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Adaptation du type pour Product, Variant, Invoices
  const formattedOrders = (orders ?? []).map(order => ({
    ...order,
    product: Array.isArray(order.product) ? order.product[0] : order.product,
    variant: Array.isArray(order.variant) ? order.variant[0] : order.variant,
    invoices: Array.isArray(order.invoices) ? order.invoices : order.invoices ? [order.invoices] : []
  }))

  return (
    <>
      <header className="bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 shadow-sm px-6 py-5 sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[#1A1A1A] text-xl font-bold">Mes Commandes</h1>
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
