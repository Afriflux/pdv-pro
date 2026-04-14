'use client'

import { useState, useMemo } from 'react'

import { Plus, Edit2, Trash2, X, Save, Eye, EyeOff, Search, Smartphone, Loader2, Code, Puzzle } from 'lucide-react'
import {
  createMarketplaceApp,
  updateMarketplaceApp,
  deleteMarketplaceApp,
  toggleMarketplaceApp,
  seedRealMarketplaceApps
} from '@/app/actions/apps'
import { toast } from '@/lib/toast'

interface MarketplaceAppRecord {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  category: string
  is_premium: boolean
  price: number
  allowed_roles: string[]
  features: any
  active: boolean
  [key: string]: unknown
}

export default function AppsClient({ initialApps }: { initialApps: MarketplaceAppRecord[] }) {
  const [apps, setApps] = useState(initialApps)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_url: '🚀',
    category: 'Productivity',
    is_premium: false,
    price: 0,
    allowed_roles: ['vendor'] as string[],
    features: JSON.stringify([{ title: 'Feature 1', desc: 'Description' }], null, 2),
    active: true
  })

  // Computed data
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps
    return apps.filter((a: MarketplaceAppRecord) => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [apps, searchQuery])

  const publishedCount = apps.filter((a: MarketplaceAppRecord) => a.active).length

  const handleSeed = async () => {
    setIsLoading(true);
    const res = await seedRealMarketplaceApps();
    if (res.success) {
      toast.success("✅ Base de données réinitialisée ! Veuillez rafraîchir la page !");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast.error(res.error || "Erreur de chargement");
    }
    setIsLoading(false);
  };

  // Actions
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_url: '🚀',
      category: 'Productivity',
      is_premium: false,
      price: 0,
      allowed_roles: ['vendor'],
      features: JSON.stringify(['Nouvelle fonctionnalité majeure', 'Synchronisation Temps Réel'], null, 2),
      active: true
    })
    setEditingId(null)
  }

  const handleOpenEdit = (app: MarketplaceAppRecord) => {
    setFormData({
      name: app.name || '',
      description: app.description || '',
      icon_url: app.icon_url || '🚀',
      category: app.category || 'Productivity',
      is_premium: app.is_premium ?? false,
      price: app.price ?? 0,
      allowed_roles: app.allowed_roles || ['vendor'],
      features: typeof app.features === 'string' ? app.features : JSON.stringify(app.features || [], null, 2),
      active: app.active ?? true
    })
    setEditingId(app.id)
    setIsModalOpen(true)
  }

  const handleOpenNew = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let parsedFeatures = []
    try {
      parsedFeatures = JSON.parse(formData.features)
    } catch {
      toast.error('Le format JSON des fonctionnalités est invalide')
      return
    }

    setIsLoading(true)
    const payload = { ...formData, features: parsedFeatures }

    try {
      if (editingId) {
        const res = await updateMarketplaceApp(editingId, payload)
        if (res.success && res.app) {
          setApps((prev: MarketplaceAppRecord[]) => prev.map((a: MarketplaceAppRecord) => a.id === editingId ? res.app as MarketplaceAppRecord : a))
          toast.success("App mise à jour !")
          setIsModalOpen(false)
        } else {
          toast.error(res.error || "Erreur de mise à jour")
        }
      } else {
        const res = await createMarketplaceApp(payload)
        if (res.success && res.app) {
          setApps((prev: MarketplaceAppRecord[]) => [res.app as MarketplaceAppRecord, ...prev])
          toast.success("Nouvelle App publiée !")
          setIsModalOpen(false)
        } else {
          toast.error(res.error || "Erreur de création")
        }
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur serveur inattendue.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const res = await toggleMarketplaceApp(id, !currentStatus)
    if (res.success) {
      setApps((prev: MarketplaceAppRecord[]) => prev.map((a: MarketplaceAppRecord) => a.id === id ? { ...a, active: !currentStatus } : a))
      toast.success(currentStatus ? "App désactivée" : "App activée !")
    } else {
      toast.error('Erreur lors du changement de statut')
    }
  }

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Voulez-vous vraiment supprimer cette app ?')) return
    const res = await deleteMarketplaceApp(id)
    if (res.success) {
      setApps((prev: MarketplaceAppRecord[]) => prev.filter((a: MarketplaceAppRecord) => a.id !== id))
      toast.success('App supprimée')
    }
  }

  return (
    <div className="flex flex-col w-full">
      {/* HEADER */}
      <header className="w-full bg-gradient-to-br from-[#0F7A60] via-[#094A3A] to-slate-900 pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shadow-lg shrink-0">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-[1900px] mx-auto w-full">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-8 h-8" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">App Store Manager</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1 max-w-lg leading-relaxed">
                Gérez les modules d'extension de Yayyam (Affiliation, Closers, SAV, Bots) pour vos fournisseurs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl">
             <div className="flex flex-col">
               <span className="text-xs font-black tracking-widest text-emerald-200 uppercase">Extensions Actives</span>
               <span className="text-2xl font-black text-white">{publishedCount}</span>
             </div>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="relative z-20 px-6 lg:px-10 -mt-10 pb-20 max-w-[1900px] mx-auto w-full flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
        
        <div className="bg-white/80 backdrop-blur-2xl border border-gray-100 p-4 rounded-3xl shadow-xl shadow-black-[0.03] flex flex-col md:flex-row items-center justify-between gap-4">
           {/* Barre de Recherche */}
           <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input 
                type="text"
                placeholder="Rechercher une fonctionnalité (ex: Affiliation)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-100 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-gray-700 outline-none"
              />
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
             <button 
               onClick={handleSeed}
               className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-black text-sm rounded-2xl transition-all"
             >
               Purge & Reset Officiel
             </button>
             <button 
               onClick={handleOpenNew}
               className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#0F7A60] hover:bg-[#094A3A] text-white font-black text-sm rounded-2xl shadow-[0_4px_14px_rgba(15,122,96,0.3)] transition-all"
             >
               <Plus className="w-4 h-4" /> Activer un Module
             </button>
           </div>
        </div>

        {/* BIBLIOTHÈQUE */}
        {filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-24 h-24 bg-white shadow-xl rounded-full border border-gray-100 flex items-center justify-center mb-6">
              <Puzzle className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Aucune extension configurée</h3>
            <p className="text-gray-500 font-medium max-w-sm mb-6">
              Ajoutez les fonctionnalités platformes pour vos utilisateurs (Vendeurs, Closers, Affiliés).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {filteredApps.map((app: MarketplaceAppRecord) => {
               const isTextIcon = app.icon_url && app.icon_url.length > 4;
               return (
               <div key={app.id} className="bg-white border text-left border-gray-100/80 rounded-[2.5rem] p-3 shadow-md hover:shadow-xl hover:border-[#0F7A60]/30 transition-all duration-300 flex flex-col group h-full">
                 {/* Visual Header */}
                 <div className="h-32 w-full bg-slate-50 border border-gray-100/50 rounded-[2rem] relative overflow-hidden flex items-center justify-center mb-4 isolate">
                   <div className="text-5xl drop-shadow-sm group-hover:scale-110 transition-transform duration-500">
                     {isTextIcon ? <Puzzle size={48} className="text-[#0F7A60]" /> : (app.icon_url || '🚀')}
                   </div>
                   <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-900 text-xs font-black px-2.5 py-1 rounded-lg z-10 uppercase tracking-wide shadow-sm border border-black/5">
                     {app.category}
                   </div>
                   {app.is_premium && (
                     <div className="absolute bottom-3 left-3 bg-amber-400 text-amber-900 text-xs font-black px-2.5 py-1 rounded-lg z-10 uppercase tracking-wide shadow-sm flex items-center gap-1">
                       ⭐ Extension PRO
                     </div>
                   )}
                 </div>

                 {/* Content */}
                 <div className="px-4 flex flex-col flex-1 pb-2">
                   <div className="flex flex-wrap gap-1 mb-2">
                     {(app.allowed_roles || ['vendor']).map((r: string) => (
                       <span key={r} className="text-xs font-bold uppercase tracking-widest text-[#0F7A60] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                         {r === 'all' ? 'TOUS' : r}
                       </span>
                     ))}
                   </div>
                   <h3 className="text-xl font-black text-gray-900 leading-snug mb-2 group-hover:text-[#0F7A60] transition-colors line-clamp-1">{app.name}</h3>
                   <p className="text-[13px] text-gray-500 font-medium line-clamp-2 mb-4 flex-1">{app.description}</p>
                   
                   {/* Footer Actions */}
                   <div className="mt-auto flex items-center justify-between gap-2 pt-4 border-t border-gray-50">
                     <button 
                       onClick={() => handleToggleActive(app.id, app.active)}
                       className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all border ${app.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                     >
                       {app.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                       {app.active ? 'En Ligne' : 'Hors Ligne'}
                     </button>
                     <div className="flex items-center gap-1">
                       <button aria-label="Modifier" title="Modifier" onClick={() => handleOpenEdit(app)} className="p-2.5 text-gray-500 hover:text-blue-600 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                       <button aria-label="Supprimer" title="Supprimer" onClick={() => handleDelete(app.id)} className="p-2.5 text-gray-500 hover:text-red-600 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-red-200 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                     </div>
                   </div>
                 </div>
               </div>
               );
             })}
          </div>
        )}
      </main>

      {/* MODAL CRÉATION/ÉDITION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-[#FAFAF7] rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className={`px-8 py-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white relative overflow-hidden`}>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-sm border border-indigo-100 font-emoji">
                  {formData.icon_url || '📦'}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">
                    {editingId ? 'Éditer l\'App' : 'Nouvelle App'}
                  </h2>
                  <p className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                    Marketplace & Permissions
                  </p>
                </div>
              </div>
              <button 
                aria-label="Fermer"
                title="Fermer"
                onClick={() => setIsModalOpen(false)}
                className="relative z-10 w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form id="app-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
              
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                 <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Informations Générales</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-gray-700 mb-2">Nom de l'App</label>
                     <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#4F46E5] outline-none shadow-inner" placeholder="Ex: Yayyam CRM" />
                   </div>
                   
                   <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                     <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#4F46E5] outline-none shadow-inner resize-none" placeholder="Description courte de la valeur..." />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Icône (Emoji)</label>
                     <input aria-label="Icon Emoji" title="Icon Emoji" required value={formData.icon_url} onChange={e => setFormData({...formData, icon_url: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#4F46E5] outline-none shadow-inner font-emoji text-center" />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie</label>
                     <select aria-label="Category" title="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#4F46E5] outline-none cursor-pointer">
                        <option value="Productivity">Productivité</option>
                        <option value="Marketing">Marketing & Vente</option>
                        <option value="Analytics">Analytiques</option>
                        <option value="Design">Design & UI</option>
                        <option value="Operations">Logistique & Opérations</option>
                     </select>
                   </div>
                   
                   <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/60 mt-2">
                     <div>
                       <label className="block text-sm font-bold text-[#0F7A60] mb-3">Audience ciblée</label>
                       <div className="flex flex-wrap gap-2">
                         {['all', 'vendor', 'closer', 'affiliate', 'client', 'admin'].map(role => (
                           <label key={role} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-emerald-200/60 cursor-pointer hover:border-emerald-500 shadow-sm transition-colors">
                             <input 
                               type="checkbox" 
                               checked={formData.allowed_roles.includes(role)}
                               onChange={(e) => {
                                 let newRoles = [...formData.allowed_roles]
                                 if (e.target.checked) {
                                   if (role === 'all') newRoles = ['all']
                                   else {
                                     newRoles = newRoles.filter(r => r !== 'all')
                                     newRoles.push(role)
                                   }
                                 } else {
                                   newRoles = newRoles.filter(r => r !== role)
                                   if (newRoles.length === 0) newRoles = ['all']
                                 }
                                 setFormData({...formData, allowed_roles: newRoles})
                               }}
                               className="text-emerald-600 focus:ring-emerald-500 rounded-sm"
                             />
                             <span className="text-xs font-bold text-gray-800 uppercase">{role === 'all' ? 'Tous' : role}</span>
                           </label>
                         ))}
                       </div>
                     </div>
                     <div className="flex flex-col gap-3">
                       <label className="flex items-center gap-2 cursor-pointer pt-1">
                         <input type="checkbox" checked={formData.is_premium} onChange={e => setFormData({...formData, is_premium: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                         <span className="text-sm font-bold text-emerald-900">App Payante (Marketplace)</span>
                       </label>
                       {formData.is_premium && (
                         <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none shadow-sm animate-in fade-in" placeholder="Prix d'achat (ex: 9900)" />
                       )}
                     </div>
                   </div>
                 </div>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="text-indigo-400 w-5 h-5"/>
                  <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Configuration JSON (Fonctionnalités)</h3>
                </div>
                <textarea 
                  required 
                  rows={10}
                  value={formData.features} 
                  onChange={e => setFormData({...formData, features: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs font-mono focus:border-indigo-500/50 outline-none resize-y text-indigo-100" 
                  placeholder='[ "Fonctionnalité 1", "Fonctionnalité 2" ]'
                />
                <p className="text-slate-500 text-xs mt-3 font-medium flex items-center gap-2">
                   Le format doit être un JSON valide (Array of Strings) affiché sur la page détails de l'App.
                </p>
              </div>
            </form>

            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <label className="flex items-center gap-3 cursor-pointer select-none group/toggle">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
                  <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${formData.active ? 'bg-[#4F46E5]' : 'bg-gray-200 shadow-inner group-hover/toggle:bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm flex items-center justify-center ${formData.active ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="text-sm font-black text-gray-700">Publiée sur le Store</span>
              </label>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl transition-all">
                  Annuler
                </button>
                <button form="app-form" type="submit" disabled={isLoading} className="bg-[#4F46E5] text-white px-6 py-2.5 rounded-xl flex items-center font-black shadow-md hover:bg-[#4338CA] hover:shadow-lg transition-all disabled:opacity-50 group">
                  {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2 group-hover:scale-110 transition-transform" />} 
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}
