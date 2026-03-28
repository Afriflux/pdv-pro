import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const id = params.id
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('User').select('role').eq('id', user.id).single()
    if (!userData || !['super_admin', 'gestionnaire'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, admin_notes } = body

    const supabaseAdmin = createAdminClient()
    
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes

    const { error } = await supabaseAdmin
      .from('Complaint')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur MAJ plainte:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
