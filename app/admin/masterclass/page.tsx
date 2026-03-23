import { getMasterclassArticles } from '@/app/actions/masterclass'
import MasterclassClient from './MasterclassClient'

export const dynamic = 'force-dynamic'

export default async function AdminMasterclassPage() {
  const articles = await getMasterclassArticles(true)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">PDV Pro Academy</h1>
          <p className="text-sm text-gray-500">Gérez les guides de formation pour les vendeurs.</p>
        </div>
      </div>
      <MasterclassClient initialArticles={articles} />
    </div>
  )
}
