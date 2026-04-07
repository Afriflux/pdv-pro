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
      product:Product!Order_product_id_fkey(id, name, images, type, price),
      bump_product:Product!Order_bump_product_id_fkey(id, name, images, type, price),
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
    bump_product: Array.isArray(order.bump_product) ? order.bump_product[0] : order.bump_product,
    variant: Array.isArray(order.variant) ? order.variant[0] : order.variant,
    invoices: Array.isArray(order.invoices) ? order.invoices : order.invoices ? [order.invoices] : []
  }))

  return (
    <div className="w-full relative z-10 px-6 lg:px-10 pb-20">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-[#1A1A1A] shadow-[0_8px_30px_rgb(26,26,26,0.12)] border border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Vos Commandes</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Gérez vos expéditions, suivez l'état de vos ventes et téléchargez vos factures.</p>
            </div>
          </div>
        </header>
        
        <OrdersView 
          initialOrders={formattedOrders as any} 
          storeName={store.name}
          storeId={store.id} 
        />
      </div>
    </div>
  )
}
