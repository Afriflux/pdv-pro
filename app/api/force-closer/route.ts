import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Vous n'êtes pas connecté. Veuillez vous connecter d'abord." });
    }

    const supabaseAdmin = createAdminClient();
    
    // Force the role to 'closer'
    const { error } = await supabaseAdmin
      .from('User')
      .update({ role: 'closer' })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message });
    }
        
    return NextResponse.redirect(new URL("/closer", request.url));

  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
