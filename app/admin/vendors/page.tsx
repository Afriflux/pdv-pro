import { getAdminVendors } from '@/lib/admin/adminActions'
import AdminVendorsClient from './AdminVendorsClient'

export const dynamic = 'force-dynamic'

export default async function AdminVendorsPage() {
  const vendors = await getAdminVendors()

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestion des Vendeurs</h1>
        <p className="text-gray-500 mt-2">Consultez la liste des boutiques, leurs revenus et gérez leurs accès.</p>
      </div>

      <AdminVendorsClient initialVendors={vendors} />
    </div>
  )
}
