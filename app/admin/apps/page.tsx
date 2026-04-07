import { getMarketplaceApps } from '@/app/actions/apps'
import AppsClient from './AppsClient'

export const dynamic = 'force-dynamic'

export default async function AdminAppsPage() {
  const apps = await getMarketplaceApps()
  
  return (
    <div className="flex-1 w-full min-h-screen bg-[#FAFAF7] pb-20">
      <AppsClient initialApps={apps} />
    </div>
  )
}
