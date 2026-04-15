'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from '@/lib/toast'
import { ShieldCheck, UserPlus, Table2, Search, XCircle, CheckCircle2, Eye, ShieldAlert, Lock, Save, PlusCircle, UserCog, Copy, Edit2, Trash2, Network, Plus, X, UserMinus } from 'lucide-react'
import Link from 'next/link'

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  internal_role_id?: string | null
  avatar_url?: string | null
  custom_role?: { name: string; color: string; bg: string } | null
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

// ─── ORG DEPARTMENT TYPE (RECURSIVE TREE) ─────────────────────────────────────
export interface OrgDepartment {
  id: string
  name: string
  subtitle: string
  color: string
  memberIds: string[]
  children: OrgDepartment[]
}

const DEPT_COLORS: Record<string, { bgCls: string; borderCls: string; textCls: string; subtextCls: string; accentCls: string }> = {
  indigo:  { bgCls: 'bg-indigo-50',  borderCls: 'border-indigo-200',  textCls: 'text-indigo-900',  subtextCls: 'text-indigo-600',  accentCls: 'border-l-indigo-400' },
  slate:   { bgCls: 'bg-slate-50',   borderCls: 'border-slate-200',   textCls: 'text-slate-900',   subtextCls: 'text-slate-600',   accentCls: 'border-l-slate-400' },
  amber:   { bgCls: 'bg-amber-50',   borderCls: 'border-amber-200',   textCls: 'text-amber-900',   subtextCls: 'text-amber-600',   accentCls: 'border-l-amber-500' },
  rose:    { bgCls: 'bg-rose-50',    borderCls: 'border-rose-200',    textCls: 'text-rose-900',    subtextCls: 'text-rose-600',    accentCls: 'border-l-rose-400' },
  cyan:    { bgCls: 'bg-cyan-50',    borderCls: 'border-cyan-200',    textCls: 'text-cyan-900',    subtextCls: 'text-cyan-600',    accentCls: 'border-l-cyan-400' },
  violet:  { bgCls: 'bg-violet-50',  borderCls: 'border-violet-200',  textCls: 'text-violet-900',  subtextCls: 'text-violet-600',  accentCls: 'border-l-violet-400' },
  emerald: { bgCls: 'bg-emerald-50', borderCls: 'border-emerald-200', textCls: 'text-emerald-900', subtextCls: 'text-emerald-600', accentCls: 'border-l-emerald-400' },
  orange:  { bgCls: 'bg-orange-50',  borderCls: 'border-orange-200',  textCls: 'text-orange-900',  subtextCls: 'text-orange-600',  accentCls: 'border-l-orange-400' },
  pink:    { bgCls: 'bg-pink-50',    borderCls: 'border-pink-200',    textCls: 'text-pink-900',    subtextCls: 'text-pink-600',    accentCls: 'border-l-pink-400' },
  teal:    { bgCls: 'bg-teal-50',    borderCls: 'border-teal-200',    textCls: 'text-teal-900',    subtextCls: 'text-teal-600',    accentCls: 'border-l-teal-400' },
}

const COLOR_KEYS = Object.keys(DEPT_COLORS)

const DEFAULT_DEPARTMENTS: OrgDepartment[] = [
  { id: 'dept_ops', name: 'Opérations', subtitle: 'Gestion Vendeurs & Clients', color: 'indigo', memberIds: [], children: [] },
  { id: 'dept_it', name: 'IT & Sécurité', subtitle: 'Accès DB & Logs Serveur', color: 'slate', memberIds: [], children: [] },
  { id: 'dept_fin', name: 'Finances & Légal', subtitle: 'Actionnariat & Dividendes', color: 'amber', memberIds: [], children: [] },
]

// ─── RECURSIVE TREE HELPERS ───────────────────────────────────────────────────
function treeUpdate(nodes: OrgDepartment[], id: string, updater: (d: OrgDepartment) => OrgDepartment): OrgDepartment[] {
  return nodes.map(n => n.id === id ? updater(n) : { ...n, children: treeUpdate(n.children, id, updater) })
}
function treeDelete(nodes: OrgDepartment[], id: string): OrgDepartment[] {
  return nodes.filter(n => n.id !== id).map(n => ({ ...n, children: treeDelete(n.children, id) }))
}
function treeAddChild(nodes: OrgDepartment[], parentId: string, child: OrgDepartment): OrgDepartment[] {
  return nodes.map(n => n.id === parentId ? { ...n, children: [...n.children, child] } : { ...n, children: treeAddChild(n.children, parentId, child) })
}
function treeRemoveMember(nodes: OrgDepartment[], userId: string): OrgDepartment[] {
  return nodes.map(n => ({ ...n, memberIds: n.memberIds.filter(id => id !== userId), children: treeRemoveMember(n.children, userId) }))
}
function treeAllMemberIds(nodes: OrgDepartment[]): string[] {
  return nodes.flatMap(n => [...n.memberIds, ...treeAllMemberIds(n.children)])
}
function treeFind(nodes: OrgDepartment[], id: string): OrgDepartment | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = treeFind(n.children, id)
    if (found) return found
  }
  return undefined
}
function treeCount(nodes: OrgDepartment[]): number {
  return nodes.reduce((s, n) => s + 1 + treeCount(n.children), 0)
}

// ─── CONFIGURATION DE BASE ────────────────────────────────────────────────────
const PERMISSION_KEYS: PermissionConfig[] = [
  { id: 'dashboard', label: 'Dashboard & Statistiques', description: 'Accès aux KPIs cruciaux (CA, Rétention)' },
  { id: 'vendors', label: 'Gestion des Vendeurs', description: 'Modifier, suspendre ou approuver un KYC' },
  { id: 'affiliates', label: 'Gestion Ambassadeurs', description: 'Affiliations, codes promos et pourcentages' },
  { id: 'clients', label: 'Gestion des Clients', description: 'Base de données clients et statistiques' },
  { id: 'orders', label: 'Gestion des Commandes', description: 'Voir, annuler ou rembourser des commandes' },
  { id: 'closing', label: 'Closers (COD)', description: 'Outils de confirmation d\'appels' },
  { id: 'withdrawals', label: 'Déblocage des Retraits', description: 'Approuver des paiements Wave/Orange Money' },
  { id: 'complaints', label: 'Plaintes & Litiges', description: 'Gérer les plaintes entre acheteurs et vendeurs' },
  { id: 'kyc', label: 'Vérification KYC', description: 'Approuver ou rejeter les pièces d\'identité' },
  { id: 'roles', label: 'Gestion des Administrateurs', description: 'Ajouter/Révoquer des accès à l\'équipe' },
  { id: 'settings', label: 'Configuration Plateforme', description: 'Changer les frais, abonnements, TVA' },
  { id: 'quotas', label: 'Quotas Freemium', description: 'Paramétrer les limitations des plans gratuits' },
  { id: 'marketing', label: 'Marketing Hub', description: 'Campagnes, automations et analytics marketing' },
  { id: 'notifications', label: 'Notifications & Alertes', description: 'Canaux WhatsApp, Email, Push, Telegram' },
  { id: 'loyalty', label: 'Fidélité & Récompenses', description: 'Programme de fidélisation et paliers clients' },
  { id: 'tickets', label: 'Support & Tickets', description: 'Gestion des tickets et réclamations clients' },
  { id: 'accounting', label: 'Comptabilité (P&L)', description: 'Registre des charges et calcul du bénéfice' },
  { id: 'equity', label: 'Actionnariat & Parts', description: 'Gérer les dividendes et parts sociales' },
  { id: 'maintenance', label: 'Maintenance & Crons', description: 'Exécuter des actions serveurs' },
  { id: 'audit', label: 'Audit & Sécurité', description: 'Tracer les actions et voir l\'historique système' },
  { id: 'apps', label: 'Marketplace & Apps', description: 'Gérer les applications tierces et intégrations' },
  { id: 'workflows', label: 'Créateur de Workflows', description: 'Gérer les automatisations' },
  { id: 'masterclass', label: 'Académie & Savoir', description: 'Gérer les modules de formation' },
  { id: 'themes', label: 'Webdesign & Thèmes', description: 'Création et modification du design de base' },
  { id: 'vendor_edit', label: 'Édition Profils Vendeurs', description: 'Modifier nom, boutique, coordonnées d\'un vendeur' },
  { id: 'wallets', label: 'Portefeuilles Vendeurs', description: '🔒 Créditer/débiter les wallets manuellement' },
  { id: 'password_reset', label: 'Réinitialisation MdP', description: 'Envoyer des liens de réinitialisation de mot de passe' },
  { id: 'refunds', label: 'Remboursements', description: '🔒 Rembourser intégralement une commande (restitution totale)' },
]

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function RolesClient({ 
  initialAdmins, 
  initialRoles,
  childrenForm 
}: { 
  initialAdmins: AdminUser[], 
  initialRoles: RoleConfig[],
  childrenForm: React.ReactNode 
}) {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'team' | 'permissions' | 'add'>('hierarchy')
  const [searchQuery, setSearchQuery] = useState('')
  
  // State for Roles Matrix
  const [roles, setRoles] = useState<RoleConfig[]>(initialRoles)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ── Org Departments State (recursive tree) ──
  const [orgDepts, setOrgDepts] = useState<OrgDepartment[]>(DEFAULT_DEPARTMENTS)
  const [orgSaving, setOrgSaving] = useState(false)
  const [deptModal, setDeptModal] = useState<{ isOpen: boolean; dept?: OrgDepartment; parentId?: string }>({ isOpen: false })
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; deptId: string } | null>(null)

  // Load org departments from API
  useEffect(() => {
    fetch('/api/admin/org-departments')
      .then(r => r.json())
      .then(data => {
        if (data.departments && data.departments.length > 0) {
          // Migrate flat data: add children:[] if missing
          const migrate = (nodes: OrgDepartment[]): OrgDepartment[] =>
            nodes.map(n => ({ ...n, children: migrate(n.children || []) }))
          setOrgDepts(migrate(data.departments))
        }
      })
      .catch(() => { /* silently fail, use defaults */ })
  }, [])

  const saveOrgDepts = useCallback(async (depts: OrgDepartment[]) => {
    setOrgSaving(true)
    try {
      const res = await fetch('/api/admin/org-departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departments: depts }),
      })
      if (res.ok) toast.success('Organigramme sauvegardé ✅')
      else toast.error('Erreur lors de la sauvegarde')
    } catch { toast.error('Erreur réseau') }
    finally { setOrgSaving(false) }
  }, [])

  const addDepartment = (name: string, subtitle: string, color: string, parentId?: string) => {
    const newDept: OrgDepartment = { id: `dept_${Date.now()}`, name, subtitle, color, memberIds: [], children: [] }
    let updated: OrgDepartment[]
    if (parentId) {
      updated = treeAddChild(orgDepts, parentId, newDept)
    } else {
      updated = [...orgDepts, newDept]
    }
    setOrgDepts(updated)
    saveOrgDepts(updated)
  }

  const updateDepartment = (id: string, updates: Partial<OrgDepartment>) => {
    const updated = treeUpdate(orgDepts, id, d => ({ ...d, ...updates }))
    setOrgDepts(updated)
    saveOrgDepts(updated)
  }

  const deleteDepartment = async (id: string) => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: 'Supprimer ce nœud et tous ses sous-éléments ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (!result.isConfirmed) return
    const updated = treeDelete(orgDepts, id)
    setOrgDepts(updated)
    saveOrgDepts(updated)
  }

  const assignMember = (deptId: string, userId: string) => {
    // Remove from entire tree first, then add to target
    let updated = treeRemoveMember(orgDepts, userId)
    updated = treeUpdate(updated, deptId, d => ({ ...d, memberIds: [...d.memberIds, userId] }))
    setOrgDepts(updated)
    saveOrgDepts(updated)
  }

  const removeMember = (deptId: string, userId: string) => {
    const updated = treeUpdate(orgDepts, deptId, d => ({ ...d, memberIds: d.memberIds.filter(id => id !== userId) }))
    setOrgDepts(updated)
    saveOrgDepts(updated)
  }

  // Get non-super-admin members
  const nonCeoAdmins = initialAdmins.filter(a => a.role !== 'super_admin')
  const allAssignedIds = new Set(treeAllMemberIds(orgDepts))
  const unassignedMembers = nonCeoAdmins.filter(a => !allAssignedIds.has(a.id))
  const totalDeptCount = treeCount(orgDepts)

  // Modale Rôle (Créer / Éditer)
  const [roleModal, setRoleModal] = useState<{isOpen: boolean, action: 'create'|'edit', roleId?: string, nameValue: string}>({
    isOpen: false, action: 'create', nameValue: ''
  })

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

  const handleSavePermissions = async () => {
    setIsSaving(true)
    toast.success("Enregistrement en base de données en cours...")
    try {
      // Loop over all non-super-admin roles and save them
      const promises = roles.filter(r => r.id !== 'super_admin').map(role => 
        fetch('/api/admin/roles/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: role.id, permissions: role.permissions })
        })
      )
      
      await Promise.all(promises)
      toast.success("Droits d'accès mis à jour avec succès ✅")
      setHasUnsavedChanges(false)
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCustomRole = () => {
    setRoleModal({ isOpen: true, action: 'create', nameValue: '' });
  }

  const submitRoleModal = () => {
    if (!roleModal.nameValue || roleModal.nameValue.trim() === '') return;
    
    if (roleModal.action === 'create') {
      toast.success("Nouveau rôle préparé, n'oubliez pas d'enregistrer.")
      setRoles(prev => [
        ...prev,
        {
          id: `custom_${Date.now()}`,
          name: roleModal.nameValue.trim(),
          colorCls: 'text-emerald-700 border-emerald-300',
          bgCls: 'bg-emerald-50',
          isCustom: true,
          permissions: { 
            dashboard: 'read', vendors: 'read', affiliates: 'none', clients: 'none', orders: 'none', closing: 'none', withdrawals: 'none', complaints: 'none', kyc: 'none', roles: 'none', settings: 'none', quotas: 'none', marketing: 'none', notifications: 'none', loyalty: 'none', tickets: 'none', accounting: 'none', equity: 'none', maintenance: 'none', audit: 'none', apps: 'none', workflows: 'none', masterclass: 'none', themes: 'none' 
          }
        }
      ])
    } else if (roleModal.action === 'edit' && roleModal.roleId) {
      setRoles(prev => prev.map(r => r.id === roleModal.roleId ? { ...r, name: roleModal.nameValue.trim() } : r));
    }
    setHasUnsavedChanges(true)
    setRoleModal(prev => ({ ...prev, isOpen: false }));
  }

  const handleCloneRole = (roleToClone: RoleConfig) => {
    toast.success(`Le rôle "${roleToClone.name}" a été cloné avec succès !`)
    setRoles(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name: `${roleToClone.name} (Cloné)`,
        colorCls: 'text-teal-700 border-teal-300',
        bgCls: 'bg-teal-50',
        isCustom: true,
        permissions: { ...roleToClone.permissions }
      }
    ])
    setHasUnsavedChanges(true)
  }

  const handleEditRoleName = (roleId: string) => {
    const roleToEdit = roles.find(r => r.id === roleId);
    if (!roleToEdit) return;
    setRoleModal({ isOpen: true, action: 'edit', roleId: roleId, nameValue: roleToEdit.name });
  }

  const handleDeleteRole = async (roleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: `Êtes-vous sûr de vouloir supprimer le rôle "${roleToDelete?.name}" ?\n\nAttention : Si des administrateurs possèdent ce rôle, ils perdront leurs accès après enregistrement.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (result.isConfirmed) {
       setRoles(prev => prev.filter(r => r.id !== roleId));
       setHasUnsavedChanges(true);
       toast.success("Rôle supprimé. N'oubliez pas d'enregistrer.");
    }
  }

  // ----------------------------------------------------------------
  // RENDUS
  // ----------------------------------------------------------------
  const renderPermissionSelect = (roleName: string, roleId: string, permId: string, access: AccessLevel) => {
    // Le Super Admin garde son rendu fixe "Badge" incassable
    if (roleName === 'Super Admin') {
      if (access === 'full') return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black shadow-sm border border-emerald-200"><CheckCircle2 size={14}/> Total</span>
      if (access === 'read') return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black shadow-sm border border-amber-200"><Eye size={14}/> Lecture</span>
      return <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-black shadow-sm border border-red-200"><XCircle size={14}/> Bloqué</span>
    }

    // Les autres ont accès à une liste déroulante esthétique
    return (
      <select
        aria-label={`Modifier le niveau d'accès pour ${roleName} sur ${permId}`}
        title="Niveau d'accès"
        value={access}
        onChange={(e) => setPermission(roleId, permId, e.target.value as AccessLevel)}
        className={`text-xs font-black shadow-sm border rounded-lg px-2 py-1.5 outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-emerald-500/20 appearance-none text-center bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[position:calc(100%-6px)_center] pr-6 ${
          access === 'full' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/50' :
          access === 'read' ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200/50' :
          'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50 mx-auto'
        }`}
      >
        <option value="full">✅ Total</option>
        <option value="read">👁️ Lecture</option>
        <option value="none">❌ Bloqué</option>
      </select>
    )
  }

  return (
    <>
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
                Gérez l'équipe administrative de Yayyam, modifiez les droits d'accès dynamiquement et invitez de nouveaux collaborateurs.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => setActiveTab('hierarchy')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'hierarchy' ? 'bg-white text-[#0F7A60] shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}>
               <div className="flex items-center gap-2"><Network size={16}/> Organigramme</div>
             </button>
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
         
         {/* TAB 0: HIERARCHIE ORGANIGRAMME */}
         {activeTab === 'hierarchy' && (
           <div className="space-y-6 animate-in fade-in duration-500">

             {/* ── Controls Bar ── */}
             <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                   <Network size={20} />
                 </div>
                 <div>
                   <h2 className="text-sm font-black text-gray-900">Organigramme Dynamique</h2>
                   <p className="text-xs text-gray-400 font-bold">{totalDeptCount} nœud{totalDeptCount > 1 ? 's' : ''} · {initialAdmins.length} membre{initialAdmins.length > 1 ? 's' : ''}</p>
                 </div>
               </div>
               <button
                 onClick={() => setDeptModal({ isOpen: true })}
                 className="px-5 py-2.5 bg-[#0F7A60] hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2"
               >
                 <Plus size={14} /> Ajouter un département
               </button>
             </div>

             {/* ── Org Chart ── */}
             <div className="bg-white border border-gray-100 rounded-3xl p-8 lg:p-10 overflow-x-auto shadow-xl min-h-[50vh]">
               <div className="flex flex-col items-center w-full">

                 {/* ── CEO Card ── */}
                 {(() => {
                   const ceo = initialAdmins.find(a => a.role === 'super_admin')
                   return ceo ? (
                     <div className="bg-gradient-to-br from-[#0D5C4A] to-[#0F7A60] text-white px-10 py-6 rounded-3xl shadow-2xl border-2 border-emerald-400 z-10 flex items-center gap-5 hover:scale-[1.02] transition-transform relative overflow-hidden">
                       <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                       <div className="relative z-10 flex items-center gap-5">
                         {ceo.avatar_url ? (
                           <img src={ceo.avatar_url} alt={ceo.name || 'CEO'} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg" />
                         ) : (
                           <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center font-black text-2xl ring-4 ring-white/20 shadow-lg backdrop-blur-md">
                             {(ceo.name || ceo.email).charAt(0).toUpperCase()}
                           </div>
                         )}
                         <div>
                           <p className="font-black text-lg tracking-tight">{ceo.name || ceo.email}</p>
                           <p className="text-emerald-200 text-xs font-bold">{ceo.email}</p>
                           <div className="flex items-center gap-2 mt-2">
                             <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-white/20">👑 Fondateur & CEO</span>
                             <span className="bg-emerald-500/30 px-2 py-1 rounded-md text-xs font-black flex items-center gap-1">
                               <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" /> Super Admin
                             </span>
                           </div>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="bg-[#0F7A60] text-white px-8 py-4 rounded-2xl shadow-lg border-2 border-emerald-400 flex flex-col items-center">
                       <ShieldCheck size={24} className="mb-2 text-emerald-300" />
                       <span className="font-black tracking-widest uppercase text-sm">Super Admin</span>
                       <span className="text-xs text-emerald-100">Aucun CEO assigné</span>
                     </div>
                   )
                 })()}

                 {/* Connector line */}
                 {orgDepts.length > 0 && <div className="w-1 h-12 bg-gray-200" />}

                 {/* ── Departments Tree (recursive) ── */}
                 {orgDepts.length > 0 && (
                   <div className="w-full border-t-[3px] border-gray-200">
                     <div className={`grid gap-6 ${orgDepts.length >= 4 ? 'grid-cols-4' : orgDepts.length === 3 ? 'grid-cols-3' : orgDepts.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                       {orgDepts.map(dept => (
                         <OrgNode
                           key={dept.id}
                           dept={dept}
                           depth={0}
                           admins={initialAdmins}
                           roles={roles}
                           onEdit={(d) => setDeptModal({ isOpen: true, dept: d })}
                           onDelete={deleteDepartment}
                           onAddChild={(parentId) => setDeptModal({ isOpen: true, parentId })}
                           onAssign={(deptId) => setAssignModal({ isOpen: true, deptId })}
                           onRemoveMember={removeMember}
                         />
                       ))}
                     </div>
                   </div>
                 )}

                 {orgDepts.length === 0 && (
                   <div className="py-16 text-center">
                     <Network size={48} className="mx-auto text-gray-200 mb-4" />
                     <p className="text-gray-400 font-bold">Aucun département créé</p>
                     <p className="text-sm text-gray-300 mt-1">Cliquez sur &quot;Ajouter un département&quot; pour commencer.</p>
                   </div>
                 )}

                 {/* Unassigned members */}
                 {unassignedMembers.length > 0 && (
                   <div className="mt-8 w-full max-w-md">
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-center">⚠️ Membres non assignés ({unassignedMembers.length})</p>
                     <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-2 justify-center">
                       {unassignedMembers.map(m => (
                         <div key={m.id} className="bg-white border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                           {m.avatar_url ? (
                             <img src={m.avatar_url} alt={m.name || ''} className="w-7 h-7 rounded-lg object-cover border border-gray-100" />
                           ) : (
                             <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center font-black text-xs text-gray-500">
                               {(m.name || m.email).charAt(0).toUpperCase()}
                             </div>
                           )}
                           <span className="text-xs font-bold text-gray-700">{m.name || m.email.split('@')[0]}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 <p className="mt-8 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                   {orgSaving ? '💾 Sauvegarde en cours...' : `Organigramme · ${initialAdmins.length} membre${initialAdmins.length > 1 ? 's' : ''}`}
                 </p>
               </div>
             </div>
           </div>
         )}
         
         {/* TAB 1: ÉQUIPE */}
         {activeTab === 'team' && (
           <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl shadow-black-[0.02] animate-in slide-in-from-bottom-2 duration-300">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FAFAF7]/50">
                 <div>
                   <h2 className="text-xs font-black uppercase tracking-widest text-[#0F7A60]">Membres ({initialAdmins.length})</h2>
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
                    <thead className="bg-[#FAFAF7]/50 text-xs uppercase font-black tracking-widest text-gray-400 border-b border-gray-100">
                       <tr>
                         <th className="px-6 py-4">Utilisateur</th>
                         <th className="px-6 py-4">Rôle assigné</th>
                         <th className="px-6 py-4 hidden md:table-cell">Date de création</th>
                         <th className="px-6 py-4 text-right">Statut</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {filteredAdmins.map(admin => {
                          const roleConf = admin.internal_role_id 
                            ? roles.find(r => r.id === admin.internal_role_id)
                            : roles.find(r => r.name.toLowerCase().includes(admin.role.split('_')[0])) || roles[0]
                          return (
                            <tr key={admin.id} className="hover:bg-[#FAFAF7] transition-colors group">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                     {admin.avatar_url ? (
                                        <img src={admin.avatar_url} alt={admin.name || 'Admin'} className="w-10 h-10 rounded-xl object-cover border-2 border-gray-100" />
                                     ) : (
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${roleConf?.bgCls} ${roleConf?.colorCls} border`}>
                                         {(admin.name || admin.email).charAt(0).toUpperCase()}
                                      </div>
                                     )}


                                     <div>
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-[#0F7A60] transition-colors">{admin.name || '—'}</p>
                                        <p className="text-xs text-gray-500 font-medium">{admin.email}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase border ${roleConf?.bgCls} ${roleConf?.colorCls}`}>
                                    {roleConf?.name || admin.role}
                                  </span>
                               </td>
                               <td className="px-6 py-4 hidden md:table-cell text-xs text-gray-500 font-bold">
                                  {format(new Date(admin.created_at), 'dd MMM yyyy', { locale: fr })}
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black uppercase tracking-wider border border-emerald-100">
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
                             <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-gray-400 min-w-[250px] w-auto border-r border-gray-100">
                               Accès Requis
                             </th>
                             {roles.map(role => {
                               const userCount = initialAdmins.filter(a => 
                                 a.internal_role_id === role.id || 
                                 (!a.internal_role_id && role.name.toLowerCase().includes(a.role.split('_')[0]))
                               ).length
                               return (
                               <th key={role.id} className="px-6 py-5 border-r border-gray-100 last:border-0 min-w-[170px]">
                                  <div className="flex flex-col items-center gap-2">
                                     <span className={`inline-flex text-center items-center px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-sm ${role.bgCls} ${role.colorCls}`}>
                                       {role.name === 'Super Admin' && <Lock size={12} className="mr-1.5 opacity-50"/>}
                                       {role.name}
                                     </span>
                                     {role.name !== 'Super Admin' && (
                                       <div className="flex items-center gap-1.5 mt-1">
                                         <button 
                                            onClick={() => handleCloneRole(role)}
                                            title="Dupliquer"
                                            aria-label="Dupliquer"
                                            className="p-1.5 text-gray-400 hover:text-[#0F7A60] hover:bg-[#0F7A60]/10 rounded-lg transition-all"
                                         >
                                            <Copy size={13} strokeWidth={2.5}/>
                                         </button>
                                         <button 
                                            onClick={() => handleEditRoleName(role.id)}
                                            title="Renommer"
                                            className="p-1.5 text-gray-400 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 rounded-lg transition-all"
                                         >
                                            <Edit2 size={13} strokeWidth={2.5}/>
                                         </button>
                                         <button 
                                            onClick={() => handleDeleteRole(role.id)}
                                            title="Supprimer"
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                         >
                                            <Trash2 size={13} strokeWidth={2.5}/>
                                         </button>
                                       </div>
                                     )}
                                     <span className="text-xs font-bold text-gray-400">
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
                                  <p className="text-xs text-gray-400 font-medium mt-0.5">{perm.description}</p>
                               </td>
                               
                               {roles.map(role => {
                                 const access = role.permissions[perm.id] || 'none'
                                 return (
                                   <td 
                                     key={`${perm.id}-${role.id}`} 
                                     className="px-6 py-4 text-center border-r border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
                                   >
                                      <div className="flex justify-center">
                                         {renderPermissionSelect(role.name, role.id, perm.id, access)}
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
                 <div className="px-6 py-4 bg-[#FAFAF7] border-t border-gray-100 flex items-center justify-center gap-8 text-xs font-black text-gray-500 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Total (Modification)</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> Lecture seule</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-full"></div> Aucun accès</span>
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
                         <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-wider">Aujourd'hui à 14h30</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                       <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-200 shadow-inner">
                         <span className="text-xs font-black">S</span>
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-900">Toi (Sultan AlQalifa) as créé le rôle personnalisé <span className="text-indigo-600 font-black px-1">Modérateur (Corrigé)</span></p>
                         <p className="text-xs text-gray-500 font-medium mt-1">Accès partiel attribué aux Commandes et Vendeurs (Lecture seule).</p>
                         <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-wider">Hier à 09h15</p>
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

    {/* MODALE DE NOMMAGE DE RÔLE (Premium Yayyam) */}
    {roleModal.isOpen && (
      <div className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-md flex items-center justify-center z-[100] px-4 animate-in fade-in duration-300">
         <div className="bg-white max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
            <div className="p-8 pb-6">
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {roleModal.action === 'create' ? 'Nouveau Rôle' : 'Renommer le rôle'}
              </h3>
              <p className="text-sm font-bold text-gray-500 mb-6">
                Donnez un nom explicite à ce groupe de permissions.
              </p>
              
              <input 
                autoFocus
                type="text" 
                value={roleModal.nameValue}
                onChange={e => setRoleModal(p => ({...p, nameValue: e.target.value}))}
                onKeyDown={e => e.key === 'Enter' && submitRoleModal()}
                placeholder="ex: Comptable Senior"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 outline-none focus:border-[#0F7A60] focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-medium"
              />
            </div>
            <div className="bg-gray-50 px-8 py-5 flex items-center justify-end gap-3 border-t border-gray-100">
               <button 
                 onClick={() => setRoleModal(p => ({...p, isOpen: false}))}
                 className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
               >
                 Annuler
               </button>
               <button 
                 onClick={submitRoleModal}
                 className="px-6 py-2.5 bg-[#0F7A60] hover:bg-emerald-800 text-white shadow-lg shadow-emerald-900/10 text-xs font-black tracking-wide rounded-xl transition-all"
               >
                 {roleModal.action === 'create' ? 'Créer le rôle' : 'Enregistrer'}
               </button>
            </div>
         </div>
      </div>
    )}
    {/* MODALE DÉPARTEMENT (Créer / Éditer / Sous-département) */}
    {deptModal.isOpen && (
      <DeptModalContent
        dept={deptModal.dept}
        parentId={deptModal.parentId}
        onClose={() => setDeptModal({ isOpen: false })}
        onSubmit={(name, subtitle, color) => {
          if (deptModal.dept) {
            updateDepartment(deptModal.dept.id, { name, subtitle, color })
          } else {
            addDepartment(name, subtitle, color, deptModal.parentId)
          }
          setDeptModal({ isOpen: false })
        }}
      />
    )}

    {/* MODALE ASSIGNER MEMBRE */}
    {assignModal?.isOpen && (() => {
      const dept = treeFind(orgDepts, assignModal.deptId)
      if (!dept) return null
      const colors = DEPT_COLORS[dept.color] || DEPT_COLORS.indigo
      
      // Get available members (non-CEO, not already in this dept)
      const availableMembers = nonCeoAdmins.filter(a => !dept.memberIds.includes(a.id))

      return (
        <div className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-md flex items-center justify-center z-[100] px-4 animate-in fade-in duration-300">
          <div className="bg-white max-w-md w-full rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 max-h-[80vh] flex flex-col">
            <div className="p-8 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Assigner un membre</h3>
                  <p className="text-sm font-bold text-gray-400 mt-0.5">→ <span className={`${colors.textCls} font-black`}>{dept.name}</span></p>
                </div>
                <button onClick={() => setAssignModal(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Fermer">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-8">
              {availableMembers.length > 0 ? (
                <div className="space-y-2">
                  {availableMembers.map(member => {
                    const roleConf = member.internal_role_id 
                      ? roles.find(r => r.id === member.internal_role_id)
                      : roles.find(r => r.name.toLowerCase().includes(member.role.split('_')[0])) || roles[0]
                    return (
                      <button
                        key={member.id}
                        onClick={() => { assignMember(dept.id, member.id); setAssignModal(null) }}
                        className="w-full bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3 transition-all group text-left"
                      >
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name || ''} className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
                        ) : (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${roleConf?.bgCls || 'bg-gray-100'} ${roleConf?.colorCls || 'text-gray-600'} border border-gray-100`}>
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 truncate transition-colors">{member.name || member.email.split('@')[0]}</p>
                          <p className="text-xs text-gray-400 font-medium truncate">{member.email}</p>
                        </div>
                        <span className="text-xs font-black text-gray-300 group-hover:text-emerald-600 uppercase transition-colors">+ Ajouter</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <UserCog size={36} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm font-bold text-gray-400">Tous les membres sont déjà assignés</p>
                  <p className="text-xs text-gray-300 mt-1">Invitez de nouveaux collaborateurs via l'onglet &quot;Inviter&quot;.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    })()}
    </>
  )
}

// ─── Sous-composant : Modale Département ──────────────────────────────────────
function DeptModalContent({ dept, parentId, onClose, onSubmit }: {
  dept?: OrgDepartment
  parentId?: string
  onClose: () => void
  onSubmit: (name: string, subtitle: string, color: string) => void
}) {
  const isEdit = !!dept
  const isSubDept = !!parentId
  const [dName, setDName] = useState(dept?.name || '')
  const [dSub, setDSub] = useState(dept?.subtitle || '')
  const [dColor, setDColor] = useState(dept?.color || 'indigo')

  const handleSubmit = () => {
    if (!dName.trim()) return
    onSubmit(dName.trim(), dSub.trim(), dColor)
  }

  const title = isEdit ? 'Modifier' : isSubDept ? 'Nouveau sous-département' : 'Nouveau Département'
  const btnLabel = isEdit ? 'Enregistrer' : isSubDept ? 'Créer le sous-département' : 'Créer le département'
  const placeholder = isSubDept ? 'ex: Équipe Front-end, Pôle Ventes...' : 'ex: Marketing, RH, Logistique...'

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-md flex items-center justify-center z-[100] px-4 animate-in fade-in duration-300">
      <div className="bg-white max-w-md w-full rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="p-8 pb-6">
          <h3 className="text-xl font-black text-gray-900 mb-1">{title}</h3>
          <p className="text-sm font-bold text-gray-500 mb-6">
            {isSubDept ? 'Ajoutez une équipe ou un sous-département.' : 'Définissez le nom, la description et la couleur.'}
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Nom</label>
              <input autoFocus type="text" value={dName} onChange={e => setDName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder={placeholder} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 outline-none focus:border-[#0F7A60] focus:bg-white transition-all" />
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Sous-titre / Description</label>
              <input type="text" value={dSub} onChange={e => setDSub(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="ex: Campagnes & Réseaux sociaux" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 outline-none focus:border-[#0F7A60] focus:bg-white transition-all" />
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Couleur</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_KEYS.map(c => {
                  const col = DEPT_COLORS[c]
                  return (
                    <button key={c} onClick={() => setDColor(c)}
                      className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${col.bgCls} ${dColor === c ? `${col.borderCls} scale-110 ring-2 ring-offset-1` : 'border-transparent hover:scale-105'}`}
                    >
                      <span className={`text-xs font-black ${col.textCls} uppercase`}>{c.charAt(0)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-8 py-5 flex items-center justify-end gap-3 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Annuler</button>
          <button onClick={handleSubmit} className="px-6 py-2.5 bg-[#0F7A60] hover:bg-emerald-800 text-white shadow-lg text-xs font-black rounded-xl transition-all">
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sous-composant : Nœud Organigramme Récursif ─────────────────────────────
function OrgNode({ dept, depth, admins, roles, onEdit, onDelete, onAddChild, onAssign, onRemoveMember }: {
  dept: OrgDepartment
  depth: number
  admins: AdminUser[]
  roles: RoleConfig[]
  onEdit: (d: OrgDepartment) => void
  onDelete: (id: string) => void
  onAddChild: (parentId: string) => void
  onAssign: (deptId: string) => void
  onRemoveMember: (deptId: string, userId: string) => void
}) {
  const colors = DEPT_COLORS[dept.color] || DEPT_COLORS.indigo
  const members = dept.memberIds
    .map(id => admins.find(a => a.id === id))
    .filter(Boolean) as AdminUser[]

  const depthLabels = ['Département', 'Division', 'Équipe', 'Unité', 'Groupe']
  const nodeLabel = depthLabels[Math.min(depth, depthLabels.length - 1)]

  return (
    <div className="relative pt-8 flex flex-col items-center">
      {/* Vertical connector from parent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-gray-200" />

      {/* This node card */}
      <div className={`${colors.bgCls} border ${colors.borderCls} px-5 py-4 rounded-2xl shadow-sm w-full max-w-[280px] flex flex-col items-center hover:shadow-md transition-all relative group`}>
        {/* Node type badge */}
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white border border-gray-200 px-2.5 py-0.5 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-widest shadow-sm">
          {nodeLabel}
        </span>

        {/* Actions */}
        <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onAddChild(dept.id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Ajouter sous-département">
            <Plus size={11} />
          </button>
          <button onClick={() => onEdit(dept)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifier">
            <Edit2 size={11} />
          </button>
          <button onClick={() => onDelete(dept.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
            <Trash2 size={11} />
          </button>
        </div>

        <span className={`font-black ${colors.textCls} text-[13px] uppercase tracking-wider mt-1`}>{dept.name}</span>
        {dept.subtitle && <span className={`text-xs ${colors.subtextCls} font-bold mt-0.5`}>{dept.subtitle}</span>}

        {/* Members */}
        <div className="mt-3 pt-3 border-t border-gray-200/50 flex flex-col gap-1.5 w-full">
          {members.length > 0 ? members.map(member => {
            const roleConf = member.internal_role_id
              ? roles.find(r => r.id === member.internal_role_id)
              : roles.find(r => r.name.toLowerCase().includes(member.role.split('_')[0])) || roles[0]
            return (
              <div key={member.id} className={`bg-white border-l-4 ${colors.accentCls} rounded-xl px-2.5 py-2 shadow-sm border border-gray-100/50 flex items-center gap-2 group/member`}>
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.name || ''} className="w-7 h-7 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                ) : (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${roleConf?.bgCls || 'bg-gray-50'} ${roleConf?.colorCls || 'text-gray-600'} border border-gray-100`}>
                    {(member.name || member.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 text-left flex-1">
                  <p className="text-xs font-black text-gray-900 truncate">{member.name || member.email.split('@')[0]}</p>
                  <p className="text-xs text-gray-400 font-bold truncate">{roleConf?.name || member.role}</p>
                </div>
                <button onClick={() => onRemoveMember(dept.id, member.id)} className="opacity-0 group-hover/member:opacity-100 p-0.5 text-gray-300 hover:text-red-500 transition-all flex-shrink-0" title="Retirer"><UserMinus size={10} /></button>
              </div>
            )
          }) : (
            <div className="bg-gray-50/80 rounded-lg px-2 py-2.5 text-center border border-dashed border-gray-200">
              <p className="text-xs text-gray-400 font-bold italic">Aucun membre</p>
            </div>
          )}
          <button onClick={() => onAssign(dept.id)} className="w-full bg-white hover:bg-gray-50 border border-dashed border-gray-200 hover:border-gray-300 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-all flex items-center justify-center gap-1">
            <Plus size={10} /> Membre
          </button>
        </div>
      </div>

      {/* Children */}
      {dept.children.length > 0 && (
        <>
          <div className="w-1 h-6 bg-gray-200" />
          <div className="w-full border-t-2 border-gray-200">
            <div className={`grid gap-4 ${dept.children.length >= 3 ? 'grid-cols-3' : dept.children.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {dept.children.map(child => (
                <OrgNode
                  key={child.id}
                  dept={child}
                  depth={depth + 1}
                  admins={admins}
                  roles={roles}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                  onAssign={onAssign}
                  onRemoveMember={onRemoveMember}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

