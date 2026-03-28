import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import RolesClient, { AdminUser } from './RolesClient'
import CreateAdminForm from './CreateAdminForm'

// ----------------------------------------------------------------
// PAGE : GESTION DES RÔLES & ADMINS — Charte PDV Pro
// ----------------------------------------------------------------
export default async function AdminRolesPage() {
  // Vérification de l'authentification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Seul le super_admin peut accéder à cette page
  const supabaseAdmin = createAdminClient()
  const { data: currentUser } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (currentUser?.role !== 'super_admin') redirect('/admin')

  // Récupérer tous les admins (super_admin, gestionnaire, support)
  const { data: admins } = await supabaseAdmin
    .from('User')
    .select('id, email, name, role, created_at')
    .in('role', ['super_admin', 'gestionnaire', 'support'])
    .order('created_at', { ascending: false })

  const adminList = (admins as AdminUser[]) ?? []

  return (
    <RolesClient initialAdmins={adminList} childrenForm={<CreateAdminForm />} />
  )
}
