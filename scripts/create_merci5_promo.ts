import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Needed to bypass RLS potentially

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE URL or SERVICE_MODE_KEY")
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function createMerci5() {
  console.log("Creating MERCI5 promo code...")
  
  // Get an arbitrary store to attach it to, or perhaps it's a global code?
  // Since it's global, we can pick a store_id = NULL if allowed, or we must attach it to all stores, or first store.
  // Actually, wait, does PromoCode table require store_id? Let's check schema. We might not have it loaded.
  // Let's just try inserting without store_id first, if it fails, we fetch a random store_id.
  
  const { data: stores } = await supabaseAdmin.from('Store').select('id')
  
  if (!stores || stores.length === 0) {
      console.log("No stores found.")
      return
  }

  const inserts = stores.map(s => ({
      id: crypto.randomUUID(),
      store_id: s.id,
      code: "MERCI5",
      type: "percentage",
      value: 5,
      active: true,
      min_order: 0,
      max_uses: 999999,
      uses: 0,
      expires_at: "2026-12-31T23:59:59Z"
  }))

  const { error } = await supabaseAdmin.from('PromoCode').upsert(inserts, { onConflict: 'store_id,code' })

  if (error) {
     console.error("Error inserting for all stores:", error)
  } else {
     console.log("Successfully created MERCI5 for all stores.")
  }
}

createMerci5()
