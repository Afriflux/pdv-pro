'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { ShieldCheck, UserPlus, Table2, Search, XCircle, CheckCircle2, Eye, ShieldAlert, Lock, Save, PlusCircle, UserCog, Copy } from 'lucide-react'
import Link from 'next/link'

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'super_admin' | 'gestionnaire' | 'support'
  created_at: string
}

export type AccessLevel = 'full' | 'read' | 'none'

interface PermissionConfig {
  id: string;
  label: string;
  description: string;
}

interface RoleConfig {
  id: string;
  name: string;
  colorCls: string;
  bgCls: string;
  isCustom: boolean;
  permissions: Record<string, AccessLevel>;
}

// ─── CONFIGURATION DE BASE ────────────────────────────────────────────────────
const PERMISSION_KEYS: PermissionConfig[] = [
  { id: 'dashboard', label: 'Dashboard & Statistiques', description: 'Accès aux KPIs cruciaux (CA, Rétention)' },
  { id: 'vendors', label: 'Gestion des Vendeurs', description: 'Modifier, suspendre ou approuver un KYC' },
  { id: 'orders', label: 'Gestion des Commandes', description: 'Voir, annuler ou rembourser des commandes' },
  { id: 'withdrawals', label: 'Déblocage des Retraits', description: 'Approuver des paiements Wave/Orange Money' },
  { id: 'affiliates', label: 'Gestion Ambassadeurs', description: 'Affiliations, codes promos et pourcentages' },
  { id: 'roles', label: 'Gestion des Administrateurs', description: 'Ajouter/Révoquer des accès à l\'équipe' },
  { id: 'settings', label: 'Configuration Plateforme', description: 'Changer les frais, abonnements, TVA' },
]

const INITIAL_ROLES: RoleConfig[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    colorCls: 'text-[#0F7A60] border-[#0F7A60]/30',
    bgCls: 'bg-[#0F7A60]/10',
    isCustom: false,
    permissions: { dashboard: 'full', vendors: 'full', orders: 'full', withdrawals: 'full', affiliates: 'full', roles: 'full', settings: 'full' }
  },
  {
    id: 'gestionnaire',
    name: 'Gestionnaire',
    colorCls: 'text-[#C9A84C] border-[#C9A84C]/30',
    bgCls: 'bg-[#C9A84C]/10',
    isCustom: false,
    permissions: { dashboard: 'full', vendors: 'full', orders: 'full', withdrawals: 'full', affiliates: 'full', roles: 'none', settings: 'none' }
  },
  {
    id: 'support',
    name: 'Support Client',
    colorCls: 'text-gray-600 border-gray-300',
    bgCls: 'bg-white/80',
    isCustom: false,
    permissions: { dashboard: 'full', vendors: 'read', orders: 'read', withdrawals: 'none', affiliates: 'none', roles: 'none', settings: 'none' }
  }
]

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function RolesClient({ initialAdmins, childrenForm }: { initialAdmins: AdminUser[], childrenForm: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<'team' | 'permissions' | 'add'>('team')
  const [searchQuery, setSearchQuery] = useState('')
  
  // State for Roles Matrix
  const [roles, setRoles] = useState<RoleConfig[]>(INITIAL_ROLES)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Filter admins
  const filteredAdmins = initialAdmins.filter(a => 
    (a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') || 
    (a.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Modification d'une permission via le sélecteur
  const setPermission = (roleId: string, permId: string, level: AccessLevel) => {
    if (roleId === 'super_admin') {
      toast.error("Les droits du Super Admin sont verrouillés.")
      return
    }

    setHasUnsavedChanges(true)
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r
      return { ...r, permissions: { ...r.permissions, [permId]: level } }
    }))
  }

  const handleSavePermissions = () => {
    // API Call goes here
    setTimeout(() => {
      toast.success("Droits d'accès mis à jour avec succès ✅")
      setHasUnsavedChanges(false)
    }, 800)
  }

  const handleAddCustomRole = () => {
    toast.success("Vous testez le mode Démo 'Custom Role'")
    setRoles(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name: 'Modérateur',
        colorCls: 'text-indigo-600 border-indigo-300',
        bgCls: 'bg-indigo-50',
        isCustom: true,
        permissions: { dashboard: 'read', vendors: 'read', orders: 'none', withdrawals: 'none', affiliates: 'none', roles: 'none', settings: 'none' }
      }
    ])
    setHasUnsavedChanges(true)
  }

  const handleCloneRole = (roleToClone: RoleConfig) => {
    toast.success(`Le rôle "${roleToClone.name}" a été cloné avec succès !`)
    setRoles(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name: `${roleToClone.name} (Corrigé)`,
        colorCls: 'text-indigo-600 border-indigo-300',
        bgCls: 'bg-indigo-50',
        isCustom: true,
        permissions: { ...roleToClone.permissions }
      }
    ])
    setHasUnsavedChanges(true)
  }

  // ----------------------------------------------------------------
  // RENDUS
  // ----------------------------------------------------------------
  const renderPermissionSelect = (roleId: string, permId: string, access: AccessLevel) => {
    // Le Super Admin garde son rendu fixe "Badge" incassable
    if (roleId === 'super_admin') {
      if (access === 'full') return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black shadow-sm border border-emerald-200"><CheckCircle2 size={14}/> Total</span>
      if (access === 'read') return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black shadow-sm border border-amber-200"><Eye size={14}/> Lecture</span>
      return <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-black shadow-sm border border-gray-200"><XCircle size={14}/> Bloqué</span>
    }

    // Les autres ont accès à une liste déroulante esthétique
    return (
      <select
        aria-label={`Modifier le niveau d'accès pour ${roleId} sur ${permId}`}
        title="Niveau d'accès"
        value={access}
        onChange={(e) => setPermission(roleId, permId, e.target.value as AccessLevel)}
        className={`text-[11px] font-black shadow-sm border rounded-lg px-2 py-1.5 outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-emerald-500/20 appearance-none text-center bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[position:calc(100%-6px)_center] pr-6 ${
          access === 'full' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/50' :
          access === 'read' ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200/50' :
          'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200/50'
        }`}
      >
        <option value="full">✅ Total</option>
        <option value="read">👁️ Lecture</option>
        <option value="none">❌ Bloqué</option>
      </select>
    )
  }

  return (
    <div className="flex-1 w-full bg-[#FAFAF7] min-h-screen flex flex-col animate-in fade-in duration-500">
      
      {/* ── COVER BANNER (Full Bleed) ── */}
      <div className="w-full bg-gradient-to-r from-[#0D5C4A] to-[#0F7A60] pt-8 pb-32 px-6 lg:px-10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex items-center gap-3 relative z-10 mb-8">
          <Link href="/admin" className="text-sm text-emerald-100 hover:text-white transition-colors font-medium flex items-center gap-2">
            <span className="text-lg leading-none">←</span> Dashboard
          </Link>
          <span className="text-emerald-400">/</span>
          <span className="text-sm text-white font-bold opacity-80">Rôles & Permissions</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white/10 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 border border-white/20 shadow-2xl backdrop-blur-md">
               <ShieldCheck size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Access Control (RBAC)</h1>
              <p className="text-emerald-100 text-sm mt-1 max-w-md font-medium">
                Gérez l'équipe administrative de PDV Pro, modifiez les droits d'accès dynamiquement et invitez de nouveaux collaborateurs.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => setActiveTab('team')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'team' ? 'bg-white text-[#0F7A60] shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}>
               <div className="flex items-center gap-2"><UserCog size={16}/> Équipe</div>
             </button>
             <button onClick={() => setActiveTab('permissions')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'permissions' ? 'bg-white text-[#0F7A60] shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}>
               <div className="flex items-center gap-2"><Table2 size={16}/> Builder de Droits</div>
             </button>
             <button onClick={() => setActiveTab('add')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-white text-[#0F7A60] shadow-md' : 'bg-[#C9A84C] text-white hover:bg-[#b09341] shadow-lg'}`}>
               <div className="flex items-center gap-2"><UserPlus size={16}/> Inviter</div>
             </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (Overlap) ── */}
      <div className="w-full px-6 lg:px-10 -mt-16 relative z-20 pb-20">
         
         {/* TAB 1: ÉQUIPE */}
         {activeTab === 'team' && (
           <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl shadow-black-[0.02] animate-in slide-in-from-bottom-2 duration-300">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FAFAF7]/50">
                 <div>
                   <h2 className="text-[11px] font-black uppercase tracking-widest text-[#0F7A60]">Membres ({initialAdmins.length})</h2>
                   <p className="text-sm text-gray-400 font-bold">Administrateurs ayant accès au back-office.</p>
                 </div>
                 <div className="relative w-full md:w-80">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                     <Search size={16}/>
                   </div>
                   <input 
                     type="text" 
                     placeholder="Rechercher un admin..."
                     className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                   />
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-[#FAFAF7]/50 text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-100">
                       <tr>
                         <th className="px-6 py-4">Utilisateur</th>
                         <th className="px-6 py-4">Rôle assigné</th>
                         <th className="px-6 py-4 hidden md:table-cell">Date de création</th>
                         <th className="px-6 py-4 text-right">Statut</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {filteredAdmins.map(admin => {
                          const roleConf = roles.find(r => r.id === admin.role)
                          return (
                            <tr key={admin.id} className="hover:bg-[#FAFAF7] transition-colors group">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${roleConf?.bgCls} ${roleConf?.colorCls} border`}>
                                        {(admin.name || admin.email).charAt(0).toUpperCase()}
                                     </div>
                                     <div>
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-[#0F7A60] transition-colors">{admin.name || '—'}</p>
                                        <p className="text-xs text-gray-500 font-medium">{admin.email}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border ${roleConf?.bgCls} ${roleConf?.colorCls}`}>
                                    {roleConf?.name || admin.role}
                                  </span>
                               </td>
                               <td className="px-6 py-4 hidden md:table-cell text-xs text-gray-500 font-bold">
                                  {format(new Date(admin.created_at), 'dd MMM yyyy', { locale: fr })}
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Actif
                                  </span>
                               </td>
                            </tr>
                          )
                       })}
                    </tbody>
                 </table>
                 {filteredAdmins.length === 0 && (
                   <div className="p-12 text-center text-gray-400 font-bold flex flex-col items-center">
                      <Search size={32} className="mb-2 opacity-50"/>
                      Aucun compte administrateur trouvé.
                   </div>
                 )}
              </div>
           </div>
         )}

         {/* TAB 2: PERMISSION BUILDER */}
         {activeTab === 'permissions' && (
           <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              {/* Header Builder */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-black-[0.02] flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner">
                       <ShieldAlert size={24}/>
                    </div>
                    <div>
                       <h2 className="text-sm font-black text-gray-900">Permission Builder</h2>
                       <p className="text-xs text-gray-500 font-bold mt-1 max-w-xl">
                         Cliquez sur les cellules du tableau ci-dessous pour modifier **dynamiquement** les droits d'accès de chaque rôle. Les modifications affectent immédiatement l'interface des utilisateurs concernés.
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={handleAddCustomRole} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors border border-gray-200 flex items-center gap-2">
                       <PlusCircle size={14}/> Créer un Rôle
                    </button>
                    {hasUnsavedChanges && (
                      <button onClick={handleSavePermissions} className="px-5 py-2.5 bg-[#0F7A60] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 animate-bounce">
                         <Save size={14}/> Enregistrer les règles
                      </button>
                    )}
                 </div>
              </div>

              {/* Matrix Table */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl shadow-black-[0.02]">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                             <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 w-1/3 border-r border-gray-100">
                               Accès Requis
                             </th>
                             {roles.map(role => {
                               const userCount = initialAdmins.filter(a => a.role === role.id).length
                               return (
                               <th key={role.id} className="px-6 py-5 border-r border-gray-100 last:border-0 min-w-[170px]">
                                  <div className="flex flex-col items-center gap-2">
                                     <div className="flex items-center gap-2">
                                       <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${role.bgCls} ${role.colorCls}`}>
                                         {role.id === 'super_admin' && <Lock size={12} className="mr-1.5 opacity-50"/>}
                                         {role.name}
                                       </span>
                                       {role.id !== 'super_admin' && (
                                         <button 
                                            onClick={() => handleCloneRole(role)}
                                            title="Dupliquer ce rôle"
                                            aria-label={`Dupliquer le rôle ${role.name}`}
                                            className="p-1.5 text-gray-400 hover:text-[#0F7A60] hover:bg-emerald-50 rounded-lg transition-colors border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-white hover:border-emerald-200"
                                         >
                                            <Copy size={12}/>
                                         </button>
                                       )}
                                     </div>
                                     <span className="text-[10px] font-bold text-gray-400">
                                       {userCount} membre{userCount !== 1 ? 's' : ''} impacté{userCount !== 1 ? 's' : ''}
                                     </span>
                                  </div>
                               </th>
                             )})}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {PERMISSION_KEYS.map((perm) => (
                            <tr key={perm.id} className="hover:bg-[#FAFAF7] transition-colors">
                               <td className="px-6 py-4 border-r border-gray-100">
                                  <p className="text-sm font-bold text-gray-900">{perm.label}</p>
                                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{perm.description}</p>
                               </td>
                               
                               {roles.map(role => {
                                 const access = role.permissions[perm.id]
                                 return (
                                   <td 
                                     key={`${perm.id}-${role.id}`} 
                                     className="px-6 py-4 text-center border-r border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
                                   >
                                      <div className="flex justify-center">
                                         {renderPermissionSelect(role.id, perm.id, access)}
                                      </div>
                                   </td>
                                 )
                               })}
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 
                 {/* Legend */}
                 <div className="px-6 py-4 bg-[#FAFAF7] border-t border-gray-100 flex items-center justify-center gap-8 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Total (Modification)</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> Lecture seule</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-300 rounded-full"></div> Aucun accès</span>
                 </div>
              </div>

              {/* Mini Audit Log */}
              <div className="mt-8">
                 <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-4 flex items-center gap-2">
                   <ShieldAlert size={14}/> Activité de Sécurité Récente
                 </h3>
                 <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-black-[0.01] overflow-hidden divide-y divide-gray-50">
                    <div className="flex items-start gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                       <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-200 shadow-inner">
                         <span className="text-xs font-black">S</span>
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-900">Toi (Sultan AlQalifa) as modifié les droits du rôle <span className="text-amber-600 font-black px-1">Gestionnaire</span></p>
                         <p className="text-xs text-gray-500 font-medium mt-1">Retrait de l'accès à "Configuration Plateforme". Cette action a impacté 2 membres.</p>
                         <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wider">Aujourd'hui à 14h30</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                       <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-200 shadow-inner">
                         <span className="text-xs font-black">S</span>
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-900">Toi (Sultan AlQalifa) as créé le rôle personnalisé <span className="text-indigo-600 font-black px-1">Modérateur (Corrigé)</span></p>
                         <p className="text-xs text-gray-500 font-medium mt-1">Accès partiel attribué aux Commandes et Vendeurs (Lecture seule).</p>
                         <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wider">Hier à 09h15</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         )}

         {/* TAB 3: INVITER ADMIN (Formulaire) */}
         {activeTab === 'add' && (
           <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white border border-gray-100 rounded-3xl p-8 lg:p-10 shadow-xl shadow-black-[0.02]">
                 <div className="mb-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#C9A84C]/10 text-[#C9A84C] rounded-3xl flex items-center justify-center mb-4 border border-[#C9A84C]/20 shadow-inner">
                       <UserPlus size={32}/>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">Inviter un Collaborateur</h2>
                    <p className="text-sm text-gray-500 font-bold mt-2">
                      Créez un nouveau compte administrateur. Le rôle Super Admin ne peut pas être cédé ici, uniquement les rôles restreints.
                    </p>
                 </div>

                 {/* On insère ici le formulaire CreateAdminForm existant modifié pour être épuré */}
                 {childrenForm}
              </div>
           </div>
         )}

      </div>
    </div>
  )
}
