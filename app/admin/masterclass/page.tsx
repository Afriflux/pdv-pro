import { getMasterclassArticles } from '@/app/actions/masterclass'
import MasterclassClient from './MasterclassClient'

export const dynamic = 'force-dynamic'

export default async function AdminMasterclassPage() {
  const articles = await getMasterclassArticles(true)
  
  return (
    <div className="flex-1 w-full min-h-screen bg-[#FAFAF7] pb-20">
      <MasterclassClient initialArticles={articles} />
    </div>
  )
}
