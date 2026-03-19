'use client'

import { useState } from 'react'
import { AdminReport, resolveReport } from '@/lib/admin/adminActions'

interface Props {
  initialReports: AdminReport[]
}

export default function AdminReportsClient({ initialReports }: Props) {
  const [reports, setReports] = useState(initialReports)
  const [filter, setFilter] = useState('open')
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [resolutionStatus, setResolutionStatus] = useState('resolved') // 'resolved' ou 'refunded'
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredReports = reports.filter(r => filter === 'all' || r.status === filter)

  const handleOpenModal = (report: AdminReport) => {
    setSelectedReport(report)
    setResolutionStatus('resolved')
    setNotes(report.admin_notes || '')
    setIsModalOpen(true)
  }

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReport) return

    setLoading(true)
    try {
      await resolveReport(selectedReport.id, resolutionStatus, notes)
      
      // Update UI
      setReports(prev => prev.map(r => 
        r.id === selectedReport.id 
          ? { ...r, status: resolutionStatus, admin_notes: notes } 
          : r
      ))
      
      setIsModalOpen(false)
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la résolution.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'open': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Ouvert (À traiter)</span>
      case 'resolved': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Résolu</span>
      case 'refunded': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Remboursé</span>
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      
      {/* ── FILTERS ── */}
      <div className="flex gap-2">
        {['all', 'open', 'resolved', 'refunded'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === f 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'open' ? 'À traiter' : f === 'resolved' ? 'Résolus' : 'Remboursés'}
          </button>
        ))}
      </div>

      {/* ── LIST ── */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-gray-100">
            Aucun signalement dans cette catégorie.
          </div>
        ) : filteredReports.map((report) => (
          <div key={report.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition">
            
            {/* Infos Principales */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                {getStatusBadge(report.status)}
                <span className="text-xs font-mono text-gray-400">ID: {report.id.split('-')[0]}</span>
                <span className="text-xs text-gray-400 ml-auto">{new Date(report.created_at).toLocaleString('fr-FR')}</span>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-gray-900">{report.type}</h3>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
              </div>

              {/* Contexte Commande & Tiers */}
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Plaignant (Acheteur)</p>
                  <p className="font-medium text-gray-900">{report.reporter?.name || 'Inconnu'}</p>
                  <p className="text-gray-500">{report.reporter?.phone}</p>
                  <p className="text-gray-500">{report.reporter?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Commande Liée</p>
                  {report.order ? (
                    <>
                      <p className="font-mono text-gray-900">{report.order.id.split('-')[0]}</p>
                      <p className="font-bold text-orange-600">{report.order.total_amount.toLocaleString('fr-FR')} F</p>
                      <p className="text-gray-500">Boutique: {report.order.store?.name || 'Inconnue'}</p>
                    </>
                  ) : (
                    <p className="text-gray-400 italic">Commande introuvable</p>
                  )}
                </div>
              </div>

              {report.admin_notes && (
                <div className="mt-4 p-4 border border-orange-100 bg-orange-50/50 rounded-lg">
                  <p className="text-xs font-bold text-orange-800 mb-1">Notes de l&apos;Administration :</p>
                  <p className="text-sm text-orange-900">{report.admin_notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-48">
              <button 
                onClick={() => handleOpenModal(report)}
                className="w-full py-2.5 px-4 bg-gray-900 text-white font-semibold rounded-lg text-sm hover:bg-gray-800 transition"
              >
                {report.status === 'open' ? 'Traiter le Litige' : 'Modifier la décision'}
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* ── MODAL DE RESOLUTION ── */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Résolution du litige</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✖</button>
            </div>
            
            <form onSubmit={handleSubmitResolution} className="p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Décision Finale</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`
                    border rounded-xl p-4 cursor-pointer transition text-sm font-medium
                    ${resolutionStatus === 'resolved' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}
                  `}>
                    <input type="radio" value="resolved" checked={resolutionStatus === 'resolved'} onChange={(e) => setResolutionStatus(e.target.value)} className="sr-only" />
                    <span className="block mb-1 text-lg">✅</span>
                    Résolu (Fermer)
                  </label>

                  <label className={`
                    border rounded-xl p-4 cursor-pointer transition text-sm font-medium
                    ${resolutionStatus === 'refunded' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-200' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}
                  `}>
                    <input type="radio" value="refunded" checked={resolutionStatus === 'refunded'} onChange={(e) => setResolutionStatus(e.target.value)} className="sr-only" />
                    <span className="block mb-1 text-lg">💸</span>
                    Remboursement exigé
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes pour le dossier (Visible en interne)</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                  placeholder="Expliquez la décision prise (ex: Vendeur contacté, accord trouvé...)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Valider la décision'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
