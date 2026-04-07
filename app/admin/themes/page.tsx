import { getThemeTemplates } from '@/app/actions/themes'
import ThemesClient from './ThemesClient'

export const dynamic = 'force-dynamic'

export default async function AdminThemesPage() {
  const templates = await getThemeTemplates()
  
  return (
    <div className="flex-1 w-full min-h-screen bg-[#FAFAF7] pb-20">
      <ThemesClient initialTemplates={templates} />
    </div>
  )
}
