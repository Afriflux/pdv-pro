import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    // 1. Vérif Auth
    const supabaseSession = await createClient()
    const { data: { user } } = await supabaseSession.auth.getUser()
    if (!user) return new NextResponse('Non autorisé', { status: 401 })

    // 2. Vérif Rôle Super Admin ou Gestionnaire
    const supabaseAdmin = createAdminClient()
    const { data: adminUser } = await supabaseAdmin.from('User').select('role').eq('id', user.id).single()
    if (!adminUser || !['super_admin', 'gestionnaire'].includes(adminUser.role)) {
      return new NextResponse('Interdit', { status: 403 })
    }

    // 3. Lire les filtres URL
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const q = searchParams.get('q') || ''
    const dateFrom = searchParams.get('from') || ''
    const dateTo = searchParams.get('to') || ''
    const codOnly = searchParams.get('cod') === 'true'

    // 4. Construire la requête Supabase
    let query = supabaseAdmin.from('Order').select(`
      id, buyer_name, buyer_phone, total, status, payment_method, 
      created_at, store_id, cod_cash_collected, cod_fraud_suspected,
      platform_fee, vendor_amount
    `)

    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (codOnly) {
      query = query.eq('payment_method', 'cod')
    }

    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString())
    }
    
    if (dateTo) {
      const endOfDay = new Date(dateTo)
      endOfDay.setUTCHours(23, 59, 59, 999)
      query = query.lte('created_at', endOfDay.toISOString())
    }

    // Gérer la recherche textuelle (q)
    if (q) {
      // Pour cibler l'ID, Buyer Name, ou Buyer Phone
      query = query.or(`id.ilike.%${q}%,buyer_name.ilike.%${q}%,buyer_phone.ilike.%${q}%`)
      // Note: Pour chercher par nom de boutique, c'est plus complexe sans jointure native robuste,
      // on se limite ici aux champs directs de la commande pour la vitesse d'export massive.
    }

    // Exécuter
    const { data: orders, error } = await query.order('created_at', { ascending: false }).limit(2000) // Limite de sécurité

    if (error) {
       console.error('[API Export CSV] Erreur requete:', error)
       return new NextResponse('Erreur BDD', { status: 500 })
    }

    // Convertir en CSV
    const headers = [
      'ID Commande', 'Date', 'Acheteur', 'Telephone', 'Total (FCFA)', 
      'Commission Yayyam', 'Revenu Vendeur', 'Moyen Paiement', 'Statut', 
      'ID Boutique', 'Risque COD (Fraude)'
    ]

    const csvRows = [headers.join(';')]

    for (const order of orders || []) {
      const row = [
        order.id,
        new Date(order.created_at).toLocaleString('fr-FR'),
        order.buyer_name?.replace(/;/g, ',') || '',
        order.buyer_phone || '',
        order.total,
        order.platform_fee,
        order.vendor_amount,
        order.payment_method,
        order.status,
        order.store_id,
        order.cod_fraud_suspected ? 'OUI' : 'NON'
      ]
      csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    }

    const csvContent = csvRows.join('\n')

    // Retourner le fichier
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Yayyam_Orders_${Date.now()}.csv"`,
      },
    })
  } catch (err: any) {
    return new NextResponse('Internal Error : ' + err.message, { status: 500 })
  }
}
