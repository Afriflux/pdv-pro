import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface ProductInput {
  name: string
  price: number
  stock?: number
  description?: string
  category?: string
}

interface BatchResult {
  created: number
  skipped: number
  errors: Array<{ index: number; reason: string }>
}

// ----------------------------------------------------------------
// POST /api/products/batch
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // 1. Auth Supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Récupérer le corps de la requête
    const body = await req.json()
    const { products } = body as { products: ProductInput[] }

    // 3. Valider le body
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'La liste des produits est vide' }, { status: 400 })
    }

    if (products.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 produits par lot' }, { status: 400 })
    }

    // 4. Récupérer le store_id (Admin requis pour bypass RLS si nécessaire)
    const supabaseAdmin = createAdminClient()
    const { data: store, error: storeError } = await supabaseAdmin
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      console.error('[Batch API] Store error:', storeError)
      return NextResponse.json({ error: 'Espace vendeur introuvable' }, { status: 404 })
    }

    const store_id = store.id

    // 5. Filtrer et valider les produits
    const validProductsRows: {
      store_id: string
      name: string
      price: number
      stock: number
      description: string | null
      category: string | null
      is_active: boolean
      views: number
      created_at: string
      updated_at: string
    }[] = []

    const batchResult: BatchResult = {
      created: 0,
      skipped: 0,
      errors: []
    }

    products.forEach((p, index) => {
      const name = p.name?.trim() || ''
      const price = p.price
      
      // Validation stricte par produit
      if (name.length < 2) {
        batchResult.skipped++
        batchResult.errors.push({ index, reason: "Nom trop court (min 2 chars)" })
        return
      }

      if (typeof price !== 'number' || price <= 0) {
        batchResult.skipped++
        batchResult.errors.push({ index, reason: "Prix invalide (> 0)" })
        return
      }

      // Ajout aux lignes à insérer
      validProductsRows.push({
        store_id,
        name,
        price,
        stock: p.stock ?? 0,
        description: p.description?.trim() ?? null,
        category: p.category?.trim() ?? null,
        is_active: true,
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    // 6. Si aucun produit n'est valide
    if (validProductsRows.length === 0) {
      return NextResponse.json({ 
        error: 'Aucun produit valide trouvé dans la liste',
        details: batchResult.errors 
      }, { status: 400 })
    }

    // 7. Insertion groupée via supabaseAdmin
    const { error: insertError } = await supabaseAdmin
      .from('Product')
      .insert(validProductsRows)

    if (insertError) {
      console.error('[Batch API] Insert error:', insertError)
      return NextResponse.json({ error: "Erreur lors de l'insertion en base de données" }, { status: 500 })
    }

    // Succès
    batchResult.created = validProductsRows.length

    return NextResponse.json(batchResult)

  } catch (error) {
    console.error('[Batch API] Internal error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
