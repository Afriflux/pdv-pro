'use client'

import { useState } from 'react'
import { AdminTeamMember, toggleManagerRole } from '@/lib/admin/adminActions'

interface Props {
  initialTeam: AdminTeamMember[]
  eligibleUsers: any[] // Les utilisateurs qui peuvent devenir gestionnaires
}

export default function AdminTeamClient({ initialTeam, eligibleUsers }: Props) {
  const [team, setTeam] = useState(initialTeam)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // States for adding new manager
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  const handleToggleRole = async (member: AdminTeamMember, makeManager: boolean) => {
    if (member.role === 'super_admin') {
      alert("Action impossible sur le compte Super Administrateur.")
      return
    }

    const actionText = makeManager ? 'promouvoir comme Gestionnaire' : 'révoquer les accès de'
    if (!confirm(`Voulez-vous vraiment ${actionText} ${member.name} ?`)) return
    
    setLoadingId(member.id)
    try {
      await toggleManagerRole(member.id, makeManager)
      
      if (!makeManager) {
        // Retirer de la liste si on révoque
        setTeam(prev => prev.filter(m => m.id !== member.id))
      } else {
        // Ajouter à la liste (normalement géré via le form d'ajout)
      }
    } catch (error: any) {
      alert(error.message || 'Une erreur est survenue.')
    } finally {
      setLoadingId(null)
    }
  }

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return

    setLoadingId('add')
    try {
      await toggleManagerRole(selectedUserId, true)
      // Mettre à jour l'UI (Refresh brut pour simplifier et récupérer le User formaté)
      window.location.reload()
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la promotion.')
      setLoadingId(null)
    }
  }

  const filteredTeam = team.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ACTION ── */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white/60 backdrop-blur-sm border border-white/80 p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] gap-4 transition-all">
        <div className="relative w-full max-w-md">
          <input 
            type="search"
            placeholder="Rechercher un membre actif..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-5 pr-4 py-3 bg-white/70 border border-white/80 rounded-2xl text-sm focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium text-[#1A1A1A] placeholder:text-gray-400"
          />
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-6 py-3 font-bold rounded-2xl text-sm transition-all shadow-sm flex items-center gap-2 whitespace-nowrap border ${
            showAddForm 
              ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
              : 'bg-gradient-to-r from-[#0F7A60] to-teal-500 hover:from-[#0D5C4A] hover:to-[#0F7A60] text-white shadow-[0_4px_15px_rgba(15,122,96,0.3)] hover:shadow-[0_6px_20px_rgba(15,122,96,0.4)] border-[#0F7A60]/50'
          }`}
        >
          {showAddForm ? 'Annuler' : '+ Ajouter un Gestionnaire'}
        </button>
      </div>

      {/* ── FORMULAIRE AJOUT ── */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-[#0F7A60]/5 to-transparent border border-[#0F7A60]/10 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#0F7A60]/10 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
          
          <h3 className="text-lg font-black text-[#1A1A1A] mb-2 relative z-10 flex items-center gap-2">
            <span className="p-1.5 bg-white rounded-lg shadow-sm border border-white/50 text-[#0F7A60]">✨</span> 
            Promouvoir un utilisateur existant
          </h3>
          <p className="text-sm font-medium text-gray-500 mb-6 relative z-10">Sélectionnez un compte acheteur/vendeur pour lui donner les droits de gestionnaire (modération, plaintes, retraits).</p>
          
          <form onSubmit={handleAddManager} className="flex flex-col sm:flex-row gap-4 max-w-3xl relative z-10">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="flex-1 px-5 py-3 border border-white/80 rounded-2xl text-sm focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] outline-none bg-white/80 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-semibold text-[#1A1A1A] cursor-pointer"
            >
              <option value="" disabled>-- Choisir un utilisateur --</option>
              {eligibleUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email || u.phone})</option>
              ))}
            </select>
            <button 
              type="submit"
              disabled={loadingId === 'add' || !selectedUserId}
              className="px-8 py-3 bg-[#1A1A1A] text-white font-bold rounded-2xl text-sm hover:bg-black transition-all disabled:opacity-50 whitespace-nowrap shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-gray-800"
            >
              {loadingId === 'add' ? 'Promotion en cours...' : 'Donner les accès admin'}
            </button>
          </form>
        </div>
      )}

      {/* ── GRID TEAM ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
        {filteredTeam.map(member => (
          <div key={member.id} className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group flex flex-col h-full">
            
            {member.role === 'super_admin' && (
              <div className="absolute top-0 right-0 bg-[#0F7A60]/10 text-[#0F7A60] border-b border-l border-[#0F7A60]/20 text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-bl-2xl">
                SUPER ADMIN
              </div>
            )}

            <div className="flex items-start gap-4 mb-6 flex-1">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner border transition-colors ${
                member.role === 'super_admin' 
                  ? 'bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 text-[#0F7A60] border-[#0F7A60]/10 group-hover:bg-[#0F7A60]/20' 
                  : 'bg-gradient-to-br from-[#C9A84C]/10 to-amber-500/10 text-[#C9A84C] border-[#C9A84C]/10 group-hover:bg-[#C9A84C]/20'
              }`}>
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-bold text-[#1A1A1A] leading-tight group-hover:text-[#0F7A60] transition-colors">{member.name}</h3>
                <p className="text-xs font-medium text-gray-500 mt-1">{member.email}</p>
                <span className={`inline-block mt-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border rounded-xl ${
                  member.role === 'super_admin' ? 'bg-[#0F7A60]/5 text-[#0F7A60] border-[#0F7A60]/20' : 'bg-[#C9A84C]/5 text-[#C9A84C] border-[#C9A84C]/20'
                }`}>
                  {member.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-medium text-gray-500 mb-6 bg-white/40 p-4 rounded-2xl border border-white/30">
              <p className="flex items-center gap-2"><span className="text-sm">📱</span> {member.phone || 'Non renseigné'}</p>
              <p className="flex items-center gap-2"><span className="text-sm">📅</span> Membre depuis le {new Date(member.created_at).toLocaleDateString('fr-FR')}</p>
            </div>

            {member.role !== 'super_admin' && (
              <div className="pt-2 mt-auto">
                <button
                  onClick={() => handleToggleRole(member, false)}
                  disabled={loadingId === member.id}
                  className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {loadingId === member.id ? 'Révocation en cours...' : 'Révoquer l\'accès complet'}
                </button>
              </div>
            )}
            
            {/* Subtle highlight effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        ))}

        {filteredTeam.length === 0 && (
          <div className="col-span-full p-16 text-center bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/50">
              <span className="text-4xl text-gray-300">👥</span>
              <div className="absolute -inset-4 bg-gray-400/10 rounded-full blur-xl -z-10" />
            </div>
            <h2 className="text-xl font-black text-[#1A1A1A] mb-2 relative z-10">Aucun membre trouvé</h2>
            <p className="text-sm text-gray-500 relative z-10 font-medium">Modifiez votre recherche ou ajoutez un nouveau gestionnaire.</p>
          </div>
        )}
      </div>

    </div>
  )
}
