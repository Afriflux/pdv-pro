import { getMarketplaceResourcesAction, getGlobalWorkflowsAction } from './actions'
import MarketplaceControls from './MarketplaceControls'
import { redirect } from 'next/navigation'

export default async function MarketplaceAdminPage() {
  const [res, wfRes] = await Promise.all([
    getMarketplaceResourcesAction(),
    getGlobalWorkflowsAction()
  ])

  if (!res.success || !wfRes.success) {
    redirect('/dashboard')
  }

  const templates = res.templates || []
  const masterclasses = res.masterclasses || []
  const workflows = wfRes.workflows || []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink mb-2">Marketplace & Freemium</h1>
        <p className="text-gray-500 font-medium">Gérez la monétisation des templates de page, workflows et cours de l'Académie.</p>
      </div>

      <MarketplaceControls 
        initialTemplates={templates}
        initialWorkflows={workflows}
        initialMasterclasses={masterclasses}
      />
    </div>
  )
}
