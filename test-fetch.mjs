import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: stores } = await supabase.from('Store').select('id, name').limit(1)
  if (!stores || stores.length === 0) return console.log('No stores')
  const storeId = stores[0].id
  
  const { data: prods } = await supabase.from('Product').select('id, name, active').eq('store_id', storeId)
  console.log('Products:', prods)
  
  const { data: pages } = await supabase.from('SalePage').select('id, title, active').eq('store_id', storeId)
  console.log('SalePages:', pages)
}
run()
