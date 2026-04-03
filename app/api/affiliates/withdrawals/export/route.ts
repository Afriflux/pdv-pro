import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    // 1. Authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Non autorisé', { status: 401 })
    }

    // 2. Vérification du Store de l'utilisateur
    const supabaseAdmin = createAdminClient()
    const { data: store, error: storeError } = await supabaseAdmin
      .from('Store')
      .select('id, slug')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return new NextResponse('Boutique introuvable', { status: 404 })
    }

    // 3. Récupérer les retraits affiliés pour ce store (en attente ou tous, on inclut tout ici, ou seulement "pending" ?)
    // Par défaut, l'outil d'export est souvent fait pour les "en attente" pour les "mass payouts", mais on va télécharger tous les retraits et laisser le vendeur filtrer, ou filtrer par query param si besoin.
    // L'url d'export de l'UI est `/api/affiliates/withdrawals/export?storeId=...`
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // Optionnel: "pending", etc.

    let query = supabaseAdmin
      .from('AffiliateWithdrawal')
      .select(`
        id, amount, status, payment_method, phone, requested_at,
        Affiliate!inner(code, store_id, user:User(name, email, phone))
      `)
      .eq('Affiliate.store_id', store.id)
      .order('requested_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data: withdrawals, error: withdrawalsError } = await query

    if (withdrawalsError) {
      console.error("Erreur Fetch Withdrawals Export:", withdrawalsError)
      return new NextResponse('Erreur Serveur', { status: 500 })
    }

    // 4. Générer le CSV
    // Format Mass Payout / Standard : Date | Affilié | Méthode | Numéro/Téléphone | Montant | Statut
    const headers = [
      'Date de Demande',
      'Affilie (Nom)',
      'Affilie (Email)',
      'Code Affilie',
      'Methode Paiement',
      'Contact / Compte',
      'Montant',
      'Statut'
    ]

    const csvRows = [headers.join(',')]

    for (const w of (withdrawals as any[]) || []) {
      const dateDemande = new Date(w.requested_at).toLocaleDateString('fr-FR')
      // On échappe les guillemets s'il y en a dans le nom
      const nom = `"${(w.Affiliate?.user?.name || '').replace(/"/g, '""')}"`
      const email = `"${w.Affiliate?.user?.email || ''}"`
      const code = `"${w.Affiliate?.code || ''}"`
      const methode = `"${w.payment_method || ''}"`
      
      // La méthode de paiement peut exiger le champ 'phone' du Withdrawal ou celui du user
      const contact = `"${(w.phone || w.Affiliate?.user?.phone || '').replace(/"/g, '""')}"`
      
      const montant = w.amount.toString()
      const statut = w.status === 'pending' ? 'En Attente' : w.status === 'completed' ? 'Paye' : 'Rejete'

      csvRows.push([dateDemande, nom, email, code, methode, contact, montant, statut].join(','))
    }

    const csvString = csvRows.join('\n')

    // 5. Retourner la réponse
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export_retraits_affilies_${store.slug || store.id}.csv"`,
      },
    })

  } catch (error) {
    console.error('Export Withdrawals Error:', error)
    return new NextResponse('Erreur Interne', { status: 500 })
  }
}
