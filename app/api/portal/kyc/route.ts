import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { documentType, newDocs } = body

    if (!documentType || !newDocs) {
      return NextResponse.json({ success: false, error: 'Données manquantes' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Update the User record for Affiliate/Closer global KYC
    const { data, error } = await supabaseAdmin
      .from('User')
      .update({
        kyc_status: 'submitted',
        kyc_document_type: documentType,
        kyc_documents: newDocs
      })
      .eq('id', user.id)
      .select('id')
      .single()

    if (error || !data) {
      console.error('[Affiliate KYC Upload] Error:', error)
      return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour KYC' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Documents soumis avec succès' })
  } catch (err: unknown) {
    console.error('[Affiliate KYC Upload] Catch:', err)
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 })
  }
}
