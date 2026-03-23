const { Client } = require('pg')
require('dotenv').config({ path: '.env' })

async function main() {
  console.log("Adding announcement fields to Store table using pure pg client...")
  
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
  })

  try {
    await client.connect()
    
    await client.query(`
      ALTER TABLE "public"."Store"
      ADD COLUMN IF NOT EXISTS "announcement_active" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "announcement_text" TEXT,
      ADD COLUMN IF NOT EXISTS "announcement_bg_color" TEXT;
    `);
    console.log("Success! Added announcement columns to Store.")
  } catch (error) {
    console.error("Error adding columns:", error)
  } finally {
    await client.end()
  }
}

main()
