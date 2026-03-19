import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ShieldCheck, UserPlus, Table2 } from 'lucide-react'
import CreateAdminForm from './CreateAdminForm'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'super_admin' | 'gestionnaire' | 'support'
  created_at: string
}

// ----------------------------------------------------------------
// Badge rôle coloré
// ----------------------------------------------------------------
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin:  'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20',
    gestionnaire: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20',
    support:      'bg-gray-100 text-gray-500 border-gray-200',
  }
  const labels: Record<string, string> = {
    super_admin:  'Super Admin',
    gestionnaire: 'Gestionnaire',
    support:      'Support',
  }
  return (
    <span className={`px-2.5 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${styles[role] ?? styles.support}`}>
      {labels[role] ?? role}
    </span>
  )
}

// ----------------------------------------------------------------
// Tableau des permissions
// ----------------------------------------------------------------
const PERMISSIONS = [
  { label: 'Dashboard stats',       super_admin: '✅', gestionnaire: '✅', support: '✅' },
  { label: 'Gérer vendeurs',        super_admin: '✅', gestionnaire: '✅', support: '👁️' },
  { label: 'Gérer commandes',       super_admin: '✅', gestionnaire: '✅', support: '👁️' },
  { label: 'Débloquer retraits',    super_admin: '✅', gestionnaire: '✅', support: '❌' },
  { label: 'Gérer ambassadeurs',    super_admin: '✅', gestionnaire: '✅', support: '❌' },
  { label: 'Créer admins',          super_admin: '✅', gestionnaire: '❌', support: '❌' },
  { label: 'Paramètres plateforme', super_admin: '✅', gestionnaire: '❌', support: '❌' },
  { label: 'Intégrations API',      super_admin: '✅', gestionnaire: '❌', support: '❌' },
]

// ----------------------------------------------------------------
// PAGE : GESTION DES RÔLES & ADMINS — Charte PDV Pro
// ----------------------------------------------------------------
export default async function AdminRolesPage() {
  // Vérification de l'authentification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* ── EN-TÊTE ── */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-[#0F7A60]/10 text-[#0F7A60]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Rôles & Admins</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Gérez les comptes administrateurs et leurs permissions sur PDV Pro.
        </p>
      </header>

      {/* ── SECTION 1 — ADMINS ACTUELS ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Équipe d&apos;administration ({adminList.length})
        </h2>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              {/* Header émeraude subtil */}
              <thead className="bg-[#0F7A60]/5 border-b border-gray-100 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Date création</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {adminList.map((admin) => {
                  const initiale = (admin.name ?? admin.email).charAt(0).toUpperCase()
                  const isSuperAdmin = admin.role === 'super_admin'

                  return (
                    <tr key={admin.id} className="hover:bg-[#FAFAF7] transition-colors">
                      {/* Avatar + nom + email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                            isSuperAdmin ? 'bg-[#0F7A60]/10 text-[#0F7A60]' : 'bg-[#C9A84C]/10 text-[#C9A84C]'
                          }`}>
                            {initiale}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1A1A1A]">
                              {admin.name ?? '—'}
                            </p>
                            <p className="text-xs text-gray-400">{admin.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Badge rôle */}
                      <td className="px-6 py-4">
                        <RoleBadge role={admin.role} />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {format(new Date(admin.created_at), 'dd MMM yyyy', { locale: fr })}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {isSuperAdmin ? (
                          <span className="text-[10px] text-gray-400 italic">
                            Non modifiable
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">
                            — (bientôt)
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {/* État vide */}
                {adminList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-gray-400 text-sm">
                      Aucun admin trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — CRÉER UN COMPTE ADMIN ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Créer un compte administrateur
        </h2>

        {/* Note d'avertissement */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <p className="font-bold mb-1">⚠️ À lire avant de créer un compte admin</p>
          <ul className="list-disc list-inside space-y-1 text-xs font-medium text-amber-700">
            <li>Les comptes admin n&apos;ont <strong>pas de boutique</strong> ni de code ambassadeur.</li>
            <li>Les comptes admin ne reçoivent <strong>aucune commission</strong>.</li>
            <li>Les retraits vendeurs sont <strong>automatiques</strong> — l&apos;admin débloque uniquement les retraits en erreur technique ou litige.</li>
            <li>Le rôle <strong>super_admin</strong> ne peut pas être attribué depuis cette interface.</li>
          </ul>
        </div>

        {/* Formulaire client */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <CreateAdminForm />
        </div>
      </section>

      {/* ── SECTION 3 — TABLEAU DES PERMISSIONS ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Table2 className="w-4 h-4" />
          Matrice des permissions
        </h2>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              {/* Header */}
              <thead className="bg-[#0F7A60]/5 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">
                    Permission
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-black uppercase tracking-widest text-[#0F7A60]">Super Admin</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">Gestionnaire</span>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Support</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {PERMISSIONS.map((perm, i) => (
                  <tr key={i} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="px-6 py-3.5 text-sm font-medium text-[#1A1A1A]">
                      {perm.label}
                    </td>
                    <td className="px-6 py-3.5 text-center text-lg">{perm.super_admin}</td>
                    <td className="px-6 py-3.5 text-center text-lg">{perm.gestionnaire}</td>
                    <td className="px-6 py-3.5 text-center text-lg">{perm.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Légende */}
          <div className="px-6 py-3 border-t border-gray-100 bg-[#FAFAF7] flex flex-wrap gap-4 text-xs text-gray-500 font-medium">
            <span>✅ Accès total</span>
            <span>👁️ Lecture seule</span>
            <span>❌ Aucun accès</span>
          </div>
        </div>
      </section>

    </div>
  )
}
