import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { 
  sendWelcomeEmail, 
  sendFirstSaleEmail, 
  sendEmptyStoreEmail, 
  sendMasterclassReminderEmail 
} from '@/lib/brevo/brevo-service'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // On vérifie le rôle admin simple
    const { data: profile } = await supabase
      .from('Profile')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const payload = await request.json()
    const { type, email, contextData } = payload

    if (!type || !email) {
      return NextResponse.json({ error: 'Paramètres manquants: type ou email.' }, { status: 400 })
    }

    console.log(`[API Trigger Email] Type: ${type}, Destinataire: ${email}`, contextData)

    let success = false;

    switch (type) {
      case 'WELCOME':
        success = await sendWelcomeEmail(email, contextData?.storeName || 'Boutique (Test)')
        break;
      case 'FIRST_SALE':
        success = await sendFirstSaleEmail(email, contextData?.productName || 'Produit Test', contextData?.amount || 15000)
        break;
      case 'EMPTY_STORE':
        success = await sendEmptyStoreEmail(email, contextData?.vendorName || 'Vendeur (Test)')
        break;
      case 'MASTERCLASS_REMINDER':
        success = await sendMasterclassReminderEmail(email, contextData?.vendorName || 'Vendeur (Test)')
        break;
      default:
        return NextResponse.json({ error: 'Type d\'email inconnu.' }, { status: 400 })
    }

    if (success) {
      return NextResponse.json({ message: 'Email envoyé avec succès.' }, { status: 200 })
    } else {
      return NextResponse.json({ error: 'Echec de l\'envoi via Brevo.' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[API Trigger Email] Erreur interne:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
