'use client'

import { useRouter } from 'next/navigation'

interface VendeursFiltresProps {
  kycFilter: string
  statusFilter: string
  query: string
}

/**
 * Composant client pour les filtres interactifs (KYC & Statut) de la page vendeurs.
 * Utilise la charte PDV Pro : fond crème, bordure grise, focus émeraude.
 */
export default function VendeursFiltres({ kycFilter, statusFilter, query }: VendeursFiltresProps) {
  const router = useRouter()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams()

    // Conserver la recherche textuelle en cours
    if (query) params.set('q', query)

    // Mettre à jour le filtre modifié, conserver l'autre
    const newKyc    = key === 'kyc'    ? value : kycFilter
    const newStatus = key === 'status' ? value : statusFilter

    if (newKyc    !== 'all') params.set('kyc',    newKyc)
    if (newStatus !== 'all') params.set('status', newStatus)

    // Revenir toujours à la page 1 lors d'un changement de filtre
    params.set('page', '1')

    router.push(`/admin/vendeurs?${params.toString()}`)
  }

  // Classe commune pour les selects — charte PDV Pro
  const selectCls = [
    'bg-[#FAFAF7] border border-gray-200 rounded-xl py-2.5 px-3 text-sm',
    'outline-none transition-all cursor-pointer',
    'focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10',
    'hover:border-gray-300 text-[#1A1A1A]',
  ].join(' ')

  return (
    <div className="flex gap-2 w-full md:w-auto">
      {/* Filtre KYC */}
      <select
        className={selectCls}
        defaultValue={kycFilter}
        onChange={(e) => handleFilterChange('kyc', e.target.value)}
        aria-label="Filtrer par statut KYC"
      >
        <option value="all">Tout KYC</option>
        <option value="verified">Vérifiés</option>
        <option value="pending">En attente</option>
        <option value="rejected">Rejetés</option>
      </select>

      {/* Filtre Statut */}
      <select
        className={selectCls}
        defaultValue={statusFilter}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        aria-label="Filtrer par statut d'activité"
      >
        <option value="all">Tous statuts</option>
        <option value="active">Actifs</option>
        <option value="suspended">Suspendus</option>
      </select>
    </div>
  )
}
