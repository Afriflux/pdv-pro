// POST /api/products/import-csv
// FormData avec fichier CSV
// Parse et INSERT produits pour le store du vendeur connecté
// Retourne { imported: number, errors: string[] }

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Types CSV attendus
type ProductType = 'digital' | 'physical' | 'coaching'

interface ProductInsert {
  store_id:    string
  name:        string
  description: string | null
  price:       number
  type:        ProductType
  category:    string | null
  stock:       number | null
  active:      boolean
  images:      string[]
}

const VALID_TYPES: ProductType[] = ['digital', 'physical', 'coaching']

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le store du vendeur
    const { data: store } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Espace introuvable' }, { status: 404 })
    }

    // Lire le fichier CSV
    const formData = await req.formData()
    const file     = formData.get('file')

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Fichier CSV requis' }, { status: 400 })
    }

    const text  = await file.text()
    const lines = text.split('\n').filter(l => l.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV vide ou sans données' }, { status: 400 })
    }

    const errors:   string[]       = []
    const products: ProductInsert[] = []

    // Parser ligne par ligne (ignorer le header ligne 0)
    lines.slice(1).forEach((line, idx) => {
      const lineNum = idx + 2 // Numéro de ligne dans le CSV (1-indexed + header)

      // Split simple (ne gère pas les virgules dans les guillemets)
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))

      const rawName  = cols[0] ?? ''
      const rawDesc  = cols[1] ?? ''
      const rawPrice = cols[2] ?? ''
      const rawType  = cols[3] ?? ''
      const rawCat   = cols[4] ?? ''
      const rawStock = cols[5] ?? ''

      // Validation du nom
      if (!rawName) {
        errors.push(`Ligne ${lineNum} : nom manquant`)
        return
      }

      // Validation du prix
      const price = parseFloat(rawPrice)
      if (isNaN(price) || price < 0) {
        errors.push(`Ligne ${lineNum} (${rawName}) : prix invalide "${rawPrice}"`)
        return
      }

      // Validation du type
      const type = rawType.toLowerCase().trim() as ProductType
      if (!VALID_TYPES.includes(type)) {
        errors.push(`Ligne ${lineNum} (${rawName}) : type invalide "${rawType}" (attendu: digital, physical, coaching)`)
        return
      }

      // Stock (optionnel, null pour les digitaux)
      const stock = rawStock ? parseInt(rawStock) : null

      products.push({
        store_id:    store.id,
        name:        rawName.slice(0, 200),
        description: rawDesc || null,
        price,
        type,
        category:    rawCat || null,
        stock:       type === 'digital' ? null : stock,
        active:      true,
        images:      [],
      })
    })

    // Insertion par batch de 50
    let imported = 0
    const BATCH  = 50
    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH)
      const { error: insertErr } = await supabase.from('Product').insert(batch)
      if (insertErr) {
        errors.push(`Batch ${Math.floor(i / BATCH) + 1} : ${insertErr.message}`)
      } else {
        imported += batch.length
      }
    }

    return NextResponse.json({ imported, errors })
  } catch (err: unknown) {

    return NextResponse.json({ imported: 0, errors: [err instanceof Error ? err.message : 'Erreur'] }, { status: 500 })
  }
}
