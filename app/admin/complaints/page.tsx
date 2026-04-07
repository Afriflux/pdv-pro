import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ComplaintsClient from './ComplaintsClient'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ComplaintRow {
  id:          string
  type:        string
  description: string
  status:      'pending' | 'investigating' | 'resolved' | 'dismissed'
  created_at:  string
  store_id:    string | null
  product_id:  string | null
  reporter_id: string | null
  evidence_url: string | null
  admin_notes: string | null
  Store:       { name: string } | null
}

// ─── PAGE ADMIN PLAINTES — Server Component ───────────────────────────────────
export default async function AdminComplaintsPage() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('User').select('role').eq('id', user.id).single()
  if (!userData || !['super_admin', 'gestionnaire'].includes(userData.role)) {
    redirect('/dashboard')
  }

  const supabaseAdmin = createAdminClient()

  // Toutes les plaintes, triées par date décroissante
  const { data: complaints } = await supabaseAdmin
    .from('Complaint')
    .select('id, type, description, status, created_at, store_id, product_id, reporter_id, evidence_url, admin_notes, Store(name)')
    .order('created_at', { ascending: false })

  const list = (complaints as unknown as ComplaintRow[]) ?? []

  const isDemoMode = false

  return (
    <div className="animate-in fade-in duration-500">
      <ComplaintsClient complaints={list} isDemoMode={isDemoMode} />
    </div>
  )
}
