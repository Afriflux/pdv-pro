import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { code, storeId, subtotal, productId } = await req.json()

    if (!code || !storeId || subtotal == null) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase()

    const supabase = await createClient()

    // 1. Chercher le code
    const { data: promo, error } = await supabase
      .from('PromoCode')
      .select('*')
      .eq('store_id', storeId)
      .eq('code', cleanCode)
      .single()

    if (error || !promo) {
      return NextResponse.json({ error: 'Code promo invalide.' }, { status: 404 })
    }

    // 2. Vérifications de validité
    if (!promo.active) {
      return NextResponse.json({ error: 'Ce code promo est inactif.' }, { status: 400 })
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Ce code promo a expiré.' }, { status: 400 })
    }

    if (promo.max_uses && promo.uses >= promo.max_uses) {
      return NextResponse.json({ error: 'Ce code promo a atteint sa limite d\'utilisation.' }, { status: 400 })
    }

    if (promo.min_order && subtotal < promo.min_order) {
      return NextResponse.json({ 
        error: `Ce code nécessite un minimum de commande de ${promo.min_order} FCFA.` 
      }, { status: 400 })
    }

    if (promo.product_ids && promo.product_ids.length > 0) {
      if (!productId || !promo.product_ids.includes(productId)) {
        return NextResponse.json({ 
          error: 'Ce code n\'est pas applicable sur ce produit.' 
        }, { status: 400 })
      }
    }

    // 3. Calcul de la réduction (sécurisé pour ne pas descendre sous 0)
    let discountAmount = 0
    if (promo.type === 'percentage') {
      discountAmount = (subtotal * promo.value) / 100
    } else {
      discountAmount = promo.value
    }

    // On ne retourne pas un montant négatif
    if (discountAmount > subtotal) {
      discountAmount = subtotal
    }

    return NextResponse.json({
      success: true,
      promo_id: promo.id,
      discount_amount: discountAmount,
      type: promo.type,
      value: promo.value
    })

  } catch (err: any) {
    console.error('Erreur API Promo:', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
