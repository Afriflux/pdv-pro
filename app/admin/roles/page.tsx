import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/admin/rbac'
import RolesClient from './RolesClient'
import CreateAdminForm from './CreateAdminForm'

export const dynamic = 'force-dynamic'

// ── Rôles par défaut si la table InternalRole est vide ou contient l'ancien seed ──
const DEFAULT_ROLES = [
  { name: 'Super Admin', color_cls: 'text-[#0F7A60] border-[#0F7A60]/30', bg_cls: 'bg-[#0F7A60]/10', is_custom: false, permissions: { dashboard: 'full', vendors: 'full', affiliates: 'full', clients: 'full', orders: 'full', closing: 'full', withdrawals: 'full', complaints: 'full', kyc: 'full', roles: 'full', settings: 'full', quotas: 'full', marketing: 'full', notifications: 'full', loyalty: 'full', tickets: 'full', accounting: 'full', equity: 'full', maintenance: 'full', audit: 'full', apps: 'full', workflows: 'full', masterclass: 'full', themes: 'full', vendor_edit: 'full', wallets: 'full', password_reset: 'full', refunds: 'full' } },
  { name: 'Associé (Board)', color_cls: 'text-zinc-800 border-zinc-300', bg_cls: 'bg-zinc-100', is_custom: false, permissions: { dashboard: 'full', vendors: 'read', affiliates: 'read', clients: 'read', orders: 'read', closing: 'read', withdrawals: 'read', complaints: 'read', kyc: 'read', roles: 'read', settings: 'read', quotas: 'read', marketing: 'read', notifications: 'read', loyalty: 'read', tickets: 'read', accounting: 'read', equity: 'read', maintenance: 'read', audit: 'read', apps: 'read', workflows: 'read', masterclass: 'read', themes: 'read', vendor_edit: 'read', wallets: 'read', password_reset: 'none', refunds: 'none' } },
  { name: 'Directeur Financier', color_cls: 'text-indigo-600 border-indigo-300', bg_cls: 'bg-indigo-50', is_custom: true, permissions: { dashboard: 'full', vendors: 'none', affiliates: 'read', clients: 'read', orders: 'full', closing: 'none', withdrawals: 'full', complaints: 'none', kyc: 'none', roles: 'none', settings: 'none', quotas: 'none', marketing: 'none', notifications: 'none', loyalty: 'none', tickets: 'none', accounting: 'full', equity: 'read', maintenance: 'none', audit: 'none', apps: 'none', workflows: 'none', masterclass: 'none', themes: 'none', vendor_edit: 'none', wallets: 'read', password_reset: 'none', refunds: 'none' } },
  { name: 'Manager Vendeurs', color_cls: 'text-amber-600 border-amber-300', bg_cls: 'bg-amber-50', is_custom: true, permissions: { dashboard: 'read', vendors: 'full', affiliates: 'none', clients: 'read', orders: 'full', closing: 'none', withdrawals: 'none', complaints: 'full', kyc: 'full', roles: 'none', settings: 'none', quotas: 'none', marketing: 'read', notifications: 'none', loyalty: 'none', tickets: 'full', accounting: 'none', equity: 'none', maintenance: 'none', audit: 'none', apps: 'none', workflows: 'none', masterclass: 'none', themes: 'none', vendor_edit: 'full', wallets: 'none', password_reset: 'full', refunds: 'none' } },
  { name: 'Resp. Affiliations', color_cls: 'text-rose-600 border-rose-300', bg_cls: 'bg-rose-50', is_custom: true, permissions: { dashboard: 'read', vendors: 'none', affiliates: 'full', clients: 'read', orders: 'none', closing: 'none', withdrawals: 'read', complaints: 'none', kyc: 'none', roles: 'none', settings: 'none', quotas: 'none', marketing: 'full', notifications: 'none', loyalty: 'none', tickets: 'none', accounting: 'none', equity: 'none', maintenance: 'none', audit: 'none', apps: 'none', workflows: 'none', masterclass: 'none', themes: 'none', vendor_edit: 'none', wallets: 'none', password_reset: 'none', refunds: 'none' } },
  { name: 'Support Client', color_cls: 'text-gray-600 border-gray-300', bg_cls: 'bg-white', is_custom: true, permissions: { dashboard: 'read', vendors: 'read', affiliates: 'none', clients: 'read', orders: 'read', closing: 'read', withdrawals: 'none', complaints: 'read', kyc: 'none', roles: 'none', settings: 'none', quotas: 'none', marketing: 'none', notifications: 'read', loyalty: 'read', tickets: 'full', accounting: 'none', equity: 'none', maintenance: 'none', audit: 'none', apps: 'none', workflows: 'none', masterclass: 'none', themes: 'none', vendor_edit: 'read', wallets: 'none', password_reset: 'none', refunds: 'none' } },
]

export default async function AdminRolesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Verification avec le nouveau système RBAC
  await requirePermission('roles', 'read')

  const supabaseAdmin = createAdminClient()

  // ── Fetch InternalRoles (via Supabase Admin) ──
  const { data: existingRoles } = await supabaseAdmin
    .from('InternalRole')
    .select('*')
    .order('created_at', { ascending: true })

  let roles = existingRoles || []

  // Seed / Reset : Si on a que les vieux rôles, on nettoie pour mettre l'organisation corporate.
  if (roles.length <= 3) {
    if (roles.length > 0) {
      await supabaseAdmin.from('InternalRole').delete().gt('created_at', '2000-01-01'); // Wipe
    }
    
    for (const roleDef of DEFAULT_ROLES) {
      await supabaseAdmin.from('InternalRole').insert(roleDef)
    }
    const { data: seededRoles } = await supabaseAdmin
      .from('InternalRole')
      .select('*')
      .order('created_at', { ascending: true })
    roles = seededRoles || []
  }

  // ── Fetch Admins (via Supabase Admin) ──
  const { data: admins } = await supabaseAdmin
    .from('User')
    .select('id, email, name, role, created_at, internal_role_id, avatar_url')
    .in('role', ['super_admin', 'gestionnaire', 'support'])
    .order('created_at', { ascending: false })

  // Enrich avatar_url from Supabase Auth metadata (Google, etc.) if DB field is empty
  const enrichedAdmins = await Promise.all(
    (admins || []).map(async (u: Record<string, unknown>) => {
      let avatarUrl = (u.avatar_url as string | null) || null
      if (!avatarUrl) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(u.id as string)
          avatarUrl = (authUser?.user?.user_metadata?.avatar_url as string)
            || (authUser?.user?.user_metadata?.picture as string)
            || null
        } catch { /* ignore */ }
      }
      return {
        id: u.id as string,
        email: (u.email as string) || '',
        name: u.name as string | null,
        role: u.role as string,
        internal_role_id: u.internal_role_id as string | null,
        avatar_url: avatarUrl,
        created_at: u.created_at as string,
      }
    })
  )

  const serializedRoles = roles.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    colorCls: (r.color_cls as string) || '',
    bgCls: (r.bg_cls as string) || '',
    isCustom: r.is_custom as boolean,
    permissions: (r.permissions || {}) as Record<string, 'full'|'read'|'none'>,
  }))

  return (
    <RolesClient 
      initialAdmins={enrichedAdmins} 
      initialRoles={serializedRoles}
      childrenForm={<CreateAdminForm />} 
    />
  )
}
