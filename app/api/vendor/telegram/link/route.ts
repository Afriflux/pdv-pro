import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    // Récupérer les produits
    const { data: products } = await supabase
      .from('Product')
      .select('id, name')
      .eq('store_id', store.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Récupérer les communautés liées
    const { data: communities } = await supabase
      .from('TelegramCommunity')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return NextResponse.json({ products, communities })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { store_id, product_id, chat_id, chat_title } = await req.json()

    if (!store_id || !product_id || !chat_id) {
      return NextResponse.json({ error: 'Veuillez fournir le produit, le store et l\'ID du chat.' }, { status: 400 })
    }

    // Vérifier l'appartenance de la boutique
    const { data: store } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', store_id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Upsert la configuration (on lie un product_id particulier)
    // On cherche d'abord si le produit a déjà une communauté
    const { data: existingProductComm } = await supabase
      .from('TelegramCommunity')
      .select('id')
      .eq('product_id', product_id)
      .maybeSingle()

    let result;

    if (existingProductComm) {
      // Update
      const { data, error } = await supabase
        .from('TelegramCommunity')
        .update({
          chat_id,
          chat_title,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProductComm.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Insert
      const { data, error } = await supabase
        .from('TelegramCommunity')
        .insert({
          store_id,
          product_id,
          chat_id,
          chat_title,
          is_active: true
        })
        .select()
        .single()
        
      if (error) throw error
      result = data
    }

    return NextResponse.json({ success: true, community: result })
  } catch (err: any) {
    console.error('[API Telegram Link]', err)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 })
  }
}
