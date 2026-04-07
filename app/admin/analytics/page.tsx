import { getAdminAnalytics } from '@/lib/admin/adminActions'
import AdminAnalyticsClient from './AdminAnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const data = await getAdminAnalytics()

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Performances & Croissance</h1>
        <p className="text-gray-500 mt-2">Vue macroscopique de la santé financière et de l&apos;adoption de Yayyam.</p>
      </div>

      <AdminAnalyticsClient data={data} />
    </div>
  )
}
