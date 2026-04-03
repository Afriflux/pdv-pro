import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

async function run() {
  const { data, error } = await supabaseAdmin
    .from('Order')
    .select('id, Store(name, slug), Review(id, rating)')
    .limit(1);

  console.log("DATA:", data);
  if (error) console.error("ERROR:", error);
}

run();
