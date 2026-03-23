import { Client } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const client = new Client({ connectionString: process.env.DATABASE_URL })

async function run() {
  await client.connect()
  console.log('Connected to Supabase.')
  try {
    await client.query(`
      ALTER TABLE "Product" 
      ADD COLUMN IF NOT EXISTS affiliate_active BOOLEAN,
      ADD COLUMN IF NOT EXISTS affiliate_margin DOUBLE PRECISION;
    `)
    console.log('Product table altered.')
    
    await client.query(`
      ALTER TABLE "SalePage" 
      ADD COLUMN IF NOT EXISTS affiliate_active BOOLEAN,
      ADD COLUMN IF NOT EXISTS affiliate_margin DOUBLE PRECISION;
    `)
    console.log('SalePage table altered.')

    // Notify postgrest to reload the schema
    await client.query(`NOTIFY pgrst, 'reload schema';`)
    console.log('Schema reloaded successfully.')
  } catch (e) {
    console.error(e)
  }
  await client.end()
}
run()
