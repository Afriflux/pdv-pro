import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });
  await client.connect();
  
  // Checking triggers on Store table
  const triggers = await client.query(`
    SELECT event_object_table, trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'Store';
  `);
  console.log("Triggers on Store:", triggers.rows);

  await client.end();
}

run().catch(console.error);
