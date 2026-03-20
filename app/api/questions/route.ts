// app/api/questions/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/questions?product_id=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')
  
  if (!productId) {
    return NextResponse.json({ error: 'product_id requis' }, { status: 400 })
  }

  const supabase = await createClient()
  
  // Utiliser une jointure sur user_id si on avait une table users exposée sur Supabase
  // Mais si user_id est le uuid de la session Auth on peut juste recuperer sans le nom
  // ou on recupere le user local de Supabase. Prisma a 'User' mais ici on fait simple
  const { data, error } = await supabase
    .from('ProductQuestion')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  // On va ajouter une requête manuelle pour mapper les noms (si on veut, ou sinon on garde user_id)
  // Pour rester simple et réactif on utilise une fausse résolution du nom s'il n'y a pas de jointure
  // Idéalement on joint la table User publique, on simule ici pour l'affichage :
  const questions = data || []

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Optionnel : Récupérer les noms des acheteurs via prisma si on veut
  // Ici on retourne telles quelles
  return NextResponse.json({ questions })
}

// POST /api/questions
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Vérification de l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { product_id, question } = body

    if (!product_id || !question) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ProductQuestion')
      .insert({
        product_id,
        user_id: user.id, // ID sécurisé par Auth
        question: question.trim()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, question: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
