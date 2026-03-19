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
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <input 
            type="search"
            placeholder="Rechercher un membre actif..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-orange-500 text-white font-bold rounded-lg text-sm hover:bg-orange-600 transition shadow-sm"
        >
          {showAddForm ? 'Fermer' : '+ Ajouter un Gestionnaire'}
        </button>
      </div>

      {/* ── FORMULAIRE AJOUT ── */}
      {showAddForm && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-orange-900 mb-2">Promouvoir un utilisateur existant</h3>
          <p className="text-sm text-orange-700 mb-4">Sélectionnez un compte acheteur/vendeur pour lui donner les droits de modération.</p>
          
          <form onSubmit={handleAddManager} className="flex flex-col sm:flex-row gap-4 max-w-2xl">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
            >
              <option value="">-- Choisir un utilisateur --</option>
              {eligibleUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email || u.phone})</option>
              ))}
            </select>
            <button 
              type="submit"
              disabled={loadingId === 'add' || !selectedUserId}
              className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800 transition disabled:opacity-50 whitespace-nowrap"
            >
              {loadingId === 'add' ? 'Promotion...' : 'Donner les accès'}
            </button>
          </form>
        </div>
      )}

      {/* ── GRID TEAM ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeam.map(member => (
          <div key={member.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
            
            {member.role === 'super_admin' && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-bl-lg">
                FONDATUER
              </div>
            )}

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-black text-lg shrink-0">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{member.name}</h3>
                <p className="text-sm text-gray-500 font-mono mt-0.5">{member.email}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold ${
                  member.role === 'super_admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {member.role.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p>📱 {member.phone}</p>
              <p>📅 Depuis le {new Date(member.created_at).toLocaleDateString('fr-FR')}</p>
            </div>

            {member.role !== 'super_admin' && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleToggleRole(member, false)}
                  disabled={loadingId === member.id}
                  className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-lg text-sm transition disabled:opacity-50"
                >
                  {loadingId === member.id ? 'Révocation...' : 'Révoquer l\'accès'}
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredTeam.length === 0 && (
          <div className="col-span-full p-10 text-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
            Aucun membre trouvé.
          </div>
        )}
      </div>

    </div>
  )
}
