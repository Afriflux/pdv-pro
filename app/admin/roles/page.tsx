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
    super_admin:  'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20 shadow-sm',
    gestionnaire: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20 shadow-sm',
    support:      'bg-white/60 text-gray-500 border-gray-200 shadow-sm',
  }
  const labels: Record<string, string> = {
    super_admin:  'Super Admin',
    gestionnaire: 'Gestionnaire',
    support:      'Support',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider ${styles[role] ?? styles.support}`}>
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
      <header className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 text-[#0F7A60] shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Rôles & Admins</h1>
          </div>
          <p className="text-sm text-gray-500 ml-14 font-medium">
            Gérez les comptes administrateurs et leurs permissions sur PDV Pro.
          </p>
        </div>
      </header>

      {/* ── SECTION 1 — ADMINS ACTUELS ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Équipe d&apos;administration ({adminList.length})
        </h2>

        <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none -translate-x-1/4 -translate-y-1/3"></div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left">
              {/* Header émeraude subtil */}
              <thead className="bg-[#0F7A60]/[0.02] border-b border-white/40 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-5">Admin</th>
                  <th className="px-6 py-5">Rôle</th>
                  <th className="px-6 py-5">Date création</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {adminList.map((admin) => {
                  const initiale = (admin.name ?? admin.email).charAt(0).toUpperCase()
                  const isSuperAdmin = admin.role === 'super_admin'

                  return (
                    <tr key={admin.id} className="hover:bg-white/50 transition-colors border-b border-white/20 last:border-0 group">
                      {/* Avatar + nom + email */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-inner border ${
                            isSuperAdmin 
                              ? 'bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 text-[#0F7A60] border-[#0F7A60]/10' 
                              : 'bg-gradient-to-br from-[#C9A84C]/10 to-amber-500/10 text-[#C9A84C] border-[#C9A84C]/10'
                          }`}>
                            {initiale}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#0F7A60] transition-colors">
                              {admin.name ?? '—'}
                            </p>
                            <p className="text-[11px] font-medium text-gray-500 mt-0.5">{admin.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Badge rôle */}
                      <td className="px-6 py-5">
                        <RoleBadge role={admin.role} />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-5 text-xs font-semibold text-gray-500">
                        {format(new Date(admin.created_at), 'dd MMM yyyy', { locale: fr })}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-5 text-right">
                        {isSuperAdmin ? (
                          <span className="inline-flex px-2 py-1 bg-white/60 border border-white/80 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-400 shadow-sm">
                            Non modifiable
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 bg-white/60 border border-white/80 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-400 shadow-sm">
                            Action à venir
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
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-3xl p-6 text-sm text-amber-900 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <p className="font-black tracking-wide mb-2 flex items-center gap-2">
            <span className="p-1 bg-amber-200/50 rounded-lg">⚠️</span> À lire avant de créer un compte admin
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs font-semibold text-amber-700/80 ml-2">
            <li>Les comptes admin n&apos;ont <strong>pas de boutique</strong> ni de code ambassadeur.</li>
            <li>Les comptes admin ne reçoivent <strong>aucune commission</strong>.</li>
            <li>Les retraits vendeurs sont <strong>automatiques</strong> — l&apos;admin débloque uniquement les retraits en erreur technique ou litige.</li>
            <li>Le rôle <strong>super_admin</strong> ne peut pas être attribué depuis cette interface.</li>
          </ul>
        </div>

        {/* Formulaire client */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none -translate-x-1/3 -translate-y-1/3" />
          <CreateAdminForm />
        </div>
      </section>

      {/* ── SECTION 3 — TABLEAU DES PERMISSIONS ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Table2 className="w-4 h-4" />
          Matrice des permissions
        </h2>

        <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#C9A84C]/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 translate-y-1/3" />

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left">
              {/* Header */}
              <thead className="bg-[#0F7A60]/[0.02] border-b border-white/40">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Permission
                  </th>
                  <th className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#0F7A60] bg-[#0F7A60]/10 px-2.5 py-1 rounded-lg border border-[#0F7A60]/20">Super Admin</span>
                    </div>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-1 rounded-lg border border-[#C9A84C]/20">Gestionnaire</span>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/60 px-2.5 py-1 rounded-lg border border-gray-200">Support</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {PERMISSIONS.map((perm, i) => (
                  <tr key={i} className="hover:bg-white/50 transition-colors border-b border-white/20 last:border-0 group">
                    <td className="px-6 py-4 text-sm font-bold text-[#1A1A1A] group-hover:text-[#0F7A60] transition-colors">
                      {perm.label}
                    </td>
                    <td className="px-6 py-4 text-center text-lg">{perm.super_admin}</td>
                    <td className="px-6 py-4 text-center text-lg">{perm.gestionnaire}</td>
                    <td className="px-6 py-4 text-center text-lg">{perm.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Légende */}
          <div className="px-6 py-4 border-t border-white/20 bg-white/40 backdrop-blur-md flex flex-wrap gap-5 text-xs text-gray-600 font-bold relative z-10">
            <span className="flex items-center gap-1.5"><span className="text-base">✅</span> Accès total</span>
            <span className="flex items-center gap-1.5"><span className="text-base">👁️</span> Lecture seule</span>
            <span className="flex items-center gap-1.5"><span className="text-base">❌</span> Aucun accès</span>
          </div>
        </div>
      </section>

    </div>
  )
}
