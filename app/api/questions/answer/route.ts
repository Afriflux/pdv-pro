import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { question_id, answer } = await req.json()

    if (!question_id || !answer?.trim()) {
      return NextResponse.json({ error: 'La réponse ne peut pas être vide' }, { status: 400 })
    }

    // 1. Récupérer le store du vendeur
    const { data: store, error: storeError } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    // 2. Vérifier que la question appartient à un produit de cette boutique
    const { data: questionData, error: qError } = await supabase
      .from('ProductQuestion')
      .select('id, product_id, product:Product(store_id)')
      .eq('id', question_id)
      .single()

    if (qError || !questionData) {
      return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
    }

    // Le cast est nécessaire car Supabase type les relations dynamiques
    const product = Array.isArray(questionData.product) ? questionData.product[0] : questionData.product
    if ((product as any)?.store_id !== store.id) {
      return NextResponse.json({ error: 'Cette question ne vous appartient pas' }, { status: 403 })
    }

    // 3. Mettre à jour la réponse
    const { error: updateError } = await supabase
      .from('ProductQuestion')
      .update({ answer: answer.trim() })
      .eq('id', question_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('Erreur answer question:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
