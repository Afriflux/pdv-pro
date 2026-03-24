import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Obtenir le storeId
    const { data: store } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 403 })
    }

    // Vérifier que le post appartient bien à ce store
    const { data: post } = await supabase
      .from('CommunityPost')
      .select('store_id')
      .eq('id', params.id)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    if (post.store_id !== store.id) {
      return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 })
    }

    // Supprimer le post
    const { error: deleteError } = await supabase
      .from('CommunityPost')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error(deleteError)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: params.id })
  } catch (error) {
    console.error('[DELETE POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
