import { Users } from 'lucide-react'

export default function AdminClientsPage() {
  return (
    <div className="flex-1 w-full min-h-screen bg-[#FAFAF7] pb-20 p-8">
      <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center mt-10">
        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
          <Users size={40} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Base de Données Clients</h1>
        <p className="text-gray-500 max-w-md">
          Centralisation de tous les clients finaux (acheteurs) de vos vendeurs.
          Cette fonctionnalité est en cours de construction.
        </p>
      </div>
    </div>
  )
}
