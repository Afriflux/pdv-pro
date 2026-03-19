'use client'

import { useState } from 'react'
import { AdminVendor, toggleVendorStatus } from '@/lib/admin/adminActions'

interface Props {
  initialVendors: AdminVendor[]
}

export default function AdminVendorsClient({ initialVendors }: Props) {
  const [vendors, setVendors] = useState<AdminVendor[]>(initialVendors)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleToggleStatus = async (vendor: AdminVendor) => {
    if (!confirm(`Voulez-vous vraiment changer le statut de ${vendor.name} ?`)) return
    
    setLoadingId(vendor.id)
    try {
      const newRole = await toggleVendorStatus(vendor.id, vendor.role)
      // Mettre à jour l'UI
      setVendors(prev => prev.map(v => 
        v.id === vendor.id ? { ...v, role: newRole as string } : v
      ))
    } catch (error: any) {
      alert(error.message || 'Une erreur est survenue.')
    } finally {
      setLoadingId(null)
    }
  }

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.store?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone.includes(searchTerm)
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* ── HEADER & SEARCH ── */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900">Base de Données Vendeurs ({filteredVendors.length})</h2>
        <input 
          type="search"
          placeholder="Rechercher nom, boutique, num..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-full sm:w-64"
        />
      </div>

      {/* ── TABLE ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
              <th className="p-4 font-semibold">Vendeur</th>
              <th className="p-4 font-semibold">Boutique</th>
              <th className="p-4 font-semibold">Revenus Générés (Fees)</th>
              <th className="p-4 font-semibold">Date d&apos;inscription</th>
              <th className="p-4 font-semibold">Statut</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredVendors.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucun vendeur trouvé.</td></tr>
            ) : filteredVendors.map((vendor) => {
               const isSuspended = vendor.role !== 'vendeur'
               return (
                <tr key={vendor.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <p className="font-bold text-gray-900 text-sm">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{vendor.phone}</p>
                    {vendor.email && <p className="text-xs text-gray-400">{vendor.email}</p>}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                      🏪 {vendor.store?.name || 'Pas de boutique'}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-orange-500">{vendor.total_revenue.toLocaleString('fr-FR')} F</p>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(vendor.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isSuspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {isSuspended ? 'Suspendu' : 'Actif'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleToggleStatus(vendor)}
                      disabled={loadingId === vendor.id}
                      className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition ${
                        isSuspended 
                          ? 'border-green-200 text-green-600 hover:bg-green-50' 
                          : 'border-red-200 text-red-600 hover:bg-red-50'
                      } ${loadingId === vendor.id ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {loadingId === vendor.id ? '...' : (isSuspended ? 'Réactiver' : 'Suspendre')}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
