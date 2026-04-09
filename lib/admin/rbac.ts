import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

/**
 * Garde du corps RBAC (Role-Based Access Control)
 * Verifie si l'utilisateur courant a la permission requise selon la matrice des rôles dynamiques.
 * En cas d'échec, redirige vers /admin/unauthorized ou /admin/login.
 * 
 * @param permissionKey La clé de permission (ex: 'accounting', 'vendors', 'roles')
 * @param requiredLevel Le niveau exigé ('read' ou 'full'). 'read' laisse passer 'full' aussi.
 */
export async function requirePermission(permissionKey: string, requiredLevel: 'read' | 'full' = 'read') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const supabaseAdmin = createAdminClient()

  const { data: currentUser } = await supabaseAdmin
    .from('User')
    .select('role, internal_role_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!currentUser) redirect('/admin/login')

  // Le Super Admin absolu (Legacy flag or DB level) a toujours Bypass
  if (currentUser.role === 'super_admin') return true

  // Si pas de rôle interne raccordé, accès refusé par défaut
  if (!currentUser.internal_role_id) {
    redirect('/admin/unauthorized')
  }

  // Fetch the active permissions matrix config for this specific assigned role
  const { data: internalRole } = await supabaseAdmin
    .from('InternalRole')
    .select('permissions')
    .eq('id', currentUser.internal_role_id)
    .maybeSingle()

  if (!internalRole || !internalRole.permissions) {
    redirect('/admin/unauthorized')
  }

  const userPerms = internalRole.permissions as Record<string, string>
  const actualLevel = userPerms[permissionKey] || 'none'

  if (actualLevel === 'none') {
    // Il est bloqué (Rouge dans la matrice)
    redirect('/admin/unauthorized')
  }

  if (requiredLevel === 'full' && actualLevel !== 'full') {
    // S'il lui faut un accès total mais qu'il n'a qu'un accès lecture
    redirect('/admin/unauthorized')
  }

  // Access Granted!
  return true
}
