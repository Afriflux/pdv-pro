const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) console.log("NO URL");
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('MarketplaceApp').delete().ilike('name', '%Dropshipping%');
  console.log("Deleted Dropshipping:", error || data);
  const { data: apps } = await supabase.from('MarketplaceApp').select('id, name, icon_url');
  console.log("Remaining apps:", apps);
}
main();
