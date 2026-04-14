'use client'

import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, X, Save, Eye, EyeOff, LayoutTemplate, Search, Code, LayoutGrid, List, Loader2 } from 'lucide-react'
import {
  createThemeTemplate,
  updateThemeTemplate,
  deleteThemeTemplate,
  toggleThemeTemplate
} from '@/app/actions/themes'
import { toast } from '@/lib/toast'

export default function ThemesClient({ initialTemplates }: { initialTemplates: Record<string, any>[] }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const defaultData = {
    blocks: [],
    settings: { primaryColor: '#0F7A60', fontStyle: 'modern' }
  }

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'sale_page',
    category: 'E-commerce',
    sub_category: '',
    niche: '',
    preview_url: '',
    is_premium: false,
    price: 0,
    allowed_roles: ['vendor'] as string[],
    data: JSON.stringify(defaultData, null, 2),
    active: true
  })

  // Computed data
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates
    return templates.filter((t: Record<string, any>) => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [templates, searchQuery])

  const publishedCount = templates.filter(t => t.active).length

  // Actions
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'sale_page',
      category: 'E-commerce',
      sub_category: '',
      niche: '',
      preview_url: '',
      is_premium: false,
      price: 0,
      allowed_roles: ['vendor'],
      data: JSON.stringify(defaultData, null, 2),
      active: true
    })
    setEditingId(null)
  }

  const handleOpenEdit = (template: Record<string, any>) => {
    setFormData({
      name: template.name || '',
      type: template.type || 'sale_page',
      category: template.category || 'E-commerce',
      sub_category: template.sub_category || '',
      niche: template.niche || '',
      preview_url: template.preview_url || '',
      is_premium: template.is_premium ?? false,
      price: template.price ?? 0,
      allowed_roles: template.allowed_roles || ['vendor'],
      data: typeof template.data === 'string' ? template.data : JSON.stringify(template.data, null, 2),
      active: template.active ?? true
    })
    setEditingId(template.id)
    setIsModalOpen(true)
  }

  const handleOpenNew = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate JSON mapping
    let parsedData = {}
    try {
      parsedData = JSON.parse(formData.data)
    } catch {
      toast.error('Le format JSON du template est invalide')
      return
    }

    setIsLoading(true)
    const payload = { ...formData, data: parsedData }

    try {
      if (editingId) {
        const res = await updateThemeTemplate(editingId, payload)
        if (res.success && res.template) {
          setTemplates(prev => prev.map(t => t.id === editingId ? res.template : t))
          toast.success("Thème mis à jour !")
          setIsModalOpen(false)
        } else {
          toast.error(res.error || "Erreur de mise à jour")
        }
      } else {
        const res = await createThemeTemplate(payload)
        if (res.success && res.template) {
          setTemplates(prev => [res.template, ...prev])
          toast.success("Nouveau thème créé !")
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
    const res = await toggleThemeTemplate(id, !currentStatus)
    if (res.success) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !currentStatus } : t))
      toast.success(currentStatus ? "Thème désactivé" : "Thème activé !")
    } else {
      toast.error('Erreur lors du changement de statut')
    }
  }

  const handleDelete = async (id: string) => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: 'Voulez-vous vraiment supprimer ce thème ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (!result.isConfirmed) return
    const res = await deleteThemeTemplate(id)
    if (res.success) {
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Thème supprimé')
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
              <LayoutTemplate className="w-8 h-8" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Créateur de Thèmes</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1 max-w-lg leading-relaxed">
                Créez, importez et gérez les templates (pages de vente, vitrines) mis à disposition des utilisateurs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl">
             <div className="flex flex-col">
               <span className="text-xs font-black tracking-widest text-emerald-200 uppercase">Actifs</span>
               <span className="text-2xl font-black text-white">{publishedCount}</span>
             </div>
             <div className="w-[1px] h-8 bg-white/20 mx-2"></div>
             <div className="flex flex-col">
               <span className="text-xs font-black tracking-widest text-emerald-200 uppercase">Total</span>
               <span className="text-2xl font-black text-white">{templates.length}</span>
             </div>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="relative z-20 px-6 lg:px-10 -mt-10 pb-20 max-w-[1900px] mx-auto w-full flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
        
        {/* Contrôles Haut de page */}
        <div className="bg-white/80 backdrop-blur-2xl border border-gray-100 p-4 rounded-3xl shadow-xl shadow-black-[0.03] flex flex-col md:flex-row items-center justify-between gap-4">
           {/* Barre de Recherche */}
           <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input 
                type="text"
                placeholder="Rechercher un thème..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-100 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-gray-700 outline-none shadow-inner"
              />
           </div>

           {/* View Toggle & Actions */}
           <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
             <div className="hidden md:flex bg-gray-100 p-1 rounded-xl items-center mr-2">
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded-lg transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                 title="Vue Liste"
               >
                 <List className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2 rounded-lg transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                 title="Vue Grille"
               >
                 <LayoutGrid className="w-4 h-4" />
               </button>
             </div>
             
             <button 
               onClick={handleOpenNew}
               className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#0F7A60] hover:bg-[#094A3A] text-white font-black text-sm rounded-2xl shadow-[0_4px_14px_rgba(15,122,96,0.3)] transition-all"
             >
               <Plus className="w-4 h-4" /> Créer un Modèle
             </button>
           </div>
        </div>

        {/* BIBLIOTHÈQUE - GRID DE CARTES */}
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-24 h-24 bg-white shadow-xl rounded-full border border-gray-100 flex items-center justify-center mb-6">
              <LayoutTemplate className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Aucun thème trouvé</h3>
            <p className="text-gray-500 font-medium max-w-sm mb-6">
              {searchQuery ? "Aucun modèle ne correspond à votre recherche." : "Votre bibliothèque est vide. Importez le premier thème de la plateforme !"}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* VUE LISTE */
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-gray-50/80 text-gray-400 font-bold text-xs uppercase tracking-wider">
                   <th className="px-6 py-4 font-bold border-b border-gray-100">Visuel</th>
                   <th className="px-6 py-4 font-bold border-b border-gray-100">Nom & Description</th>
                   <th className="px-6 py-4 font-bold border-b border-gray-100">Catégorie</th>
                   <th className="px-6 py-4 font-bold border-b border-gray-100">Modèle</th>
                   <th className="px-6 py-4 font-bold border-b border-gray-100 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredTemplates.map((template: Record<string, any>) => (
                   <tr key={template.id} className="hover:bg-emerald-50/30 transition-colors group">
                     <td className="px-6 py-4 w-24">
                       <div className="h-16 w-16 bg-slate-100 rounded-2xl overflow-hidden border border-gray-200/50 flex items-center justify-center shrink-0">
                         {template.preview_url ? (
                           <img src={template.preview_url} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <LayoutTemplate className="w-6 h-6 text-gray-300" />
                         )}
                       </div>
                     </td>
                     <td className="px-6 py-4 min-w-[250px]">
                       <div className="font-black text-ink text-sm mb-1">{template.name}</div>
                       <div className="text-xs text-gray-500 line-clamp-1">{template.description}</div>
                     </td>
                     <td className="px-6 py-4">
                       <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                         {template.category}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       {template.is_premium ? (
                         <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg text-xs font-bold w-fit">
                           ⭐ {template.price}F
                         </span>
                       ) : (
                         <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg text-xs font-bold w-fit inline-block">
                           Gratuit
                         </span>
                       )}
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button aria-label="Modifier" title="Modifier" onClick={() => handleOpenEdit(template)} className="p-2 text-gray-400 hover:text-emerald-600 bg-white hover:bg-emerald-50 rounded-xl transition-colors border border-gray-100 shadow-sm inline-flex items-center justify-center">
                         <Edit2 className="w-4 h-4" />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        ) : (
          /* VUE GRILLE */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {filteredTemplates.map((template: Record<string, any>) => (
               <div key={template.id} className="bg-white border text-left border-gray-100/80 rounded-[2.5rem] p-3 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300 flex flex-col group h-full">
                 {/* Visual Banner */}
                 <div className="h-44 w-full bg-slate-50 border border-gray-100/50 rounded-[2rem] relative overflow-hidden flex items-center justify-center mb-4 isolate">
                   {template.preview_url ? (
                     <div className="absolute inset-0 bg-cover bg-center"   title="Aperçu du thème"><img src={template.preview_url} alt="Aperçu" className="w-full h-full object-cover" /></div>
                   ) : (
                     <div className="text-4xl opacity-20"><LayoutTemplate /></div>
                   )}
                   <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-900 text-xs font-black px-2.5 py-1 rounded-lg z-10 uppercase tracking-wide shadow-sm border border-black/5">
                     {template.type.replace('_', ' ')}
                   </div>
                   {template.is_premium && (
                     <div className="absolute bottom-3 left-3 bg-amber-400 text-amber-900 text-xs font-black px-2.5 py-1 rounded-lg z-10 uppercase tracking-wide shadow-sm flex items-center gap-1">
                       ⭐ {template.price}F
                     </div>
                   )}
                 </div>

                 {/* Content */}
                 <div className="px-4 flex flex-col flex-1 pb-2">
                   <div className="flex flex-wrap gap-1 mb-2">
                     {(template.allowed_roles || ['vendor']).map((r: string) => (
                       <span key={r} className="text-xs font-bold uppercase tracking-widest text-[#0F7A60] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                         {r === 'all' ? 'TOUS' : r}
                       </span>
                     ))}
                   </div>
                   <h3 className="text-lg font-black text-gray-900 leading-snug mb-1 truncate">{template.name}</h3>
                   <p className="text-[12px] text-gray-500 font-medium mb-4 truncate">{template.category} {template.sub_category && `• ${template.sub_category}`}</p>
                   
                   {/* Footer Actions */}
                   <div className="mt-auto flex items-center justify-between gap-2 pt-4 border-t border-gray-50">
                     <button 
                       onClick={() => handleToggleActive(template.id, template.active)}
                       className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all border ${template.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                     >
                       {template.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                       {template.active ? 'Actif' : 'Désactivé'}
                     </button>
                     <div className="flex items-center gap-1">
                       <button onClick={() => handleOpenEdit(template)} title="Modifier" className="p-2.5 text-gray-500 hover:text-blue-600 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                       <button onClick={() => handleDelete(template.id)} title="Supprimer" className="p-2.5 text-gray-500 hover:text-red-600 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-red-200 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
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
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-sm border border-emerald-100">
                  <LayoutTemplate />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">
                    {editingId ? 'Éditer le Thème' : 'Nouveau Thème'}
                  </h2>
                  <p className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                    Metadata & Composants
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="relative z-10 w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl transition-colors shrink-0"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form id="theme-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
              
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                 <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Informations Principal</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-gray-700 mb-2">Nom du modèle</label>
                     <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none shadow-inner transition-colors" placeholder="Ex: Boutique Minimaliste" />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Type d'Asset</label>
                     <select 
                        title="Type d'Asset"
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none cursor-pointer"
                     >
                        <option value="sale_page">Page de Vente / Site</option>
                        <option value="product_page">Page Produit</option>
                        <option value="bio_link">Lien Bio / Profil</option>
                        <option value="email_template">Template Email</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie Majeure</label>
                     <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none shadow-inner" placeholder="Ex: E-commerce" />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Sous-Catégorie</label>
                     <input value={formData.sub_category} onChange={e => setFormData({...formData, sub_category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none shadow-inner" placeholder="Ex: Vêtements" />
                   </div>

                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Preview (Miniature externe)</label>
                     <input value={formData.preview_url} onChange={e => setFormData({...formData, preview_url: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none shadow-inner" placeholder="https://..." />
                   </div>
                   
                   <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 mt-2">
                     <div>
                       <label className="block text-sm font-bold text-emerald-900 mb-3">Audience ciblée (Destiné à)</label>
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
                         <span className="text-sm font-bold text-emerald-900">Licence Premium (Modèle Payant)</span>
                       </label>
                       {formData.is_premium && (
                         <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none shadow-sm animate-in fade-in" placeholder="Prix d'achat (ex: 2900)" />
                       )}
                     </div>
                   </div>
                 </div>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="text-emerald-400 w-5 h-5"/>
                  <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Configuration JSON du Template</h3>
                </div>
                <textarea 
                  required 
                  rows={15}
                  value={formData.data} 
                  onChange={e => setFormData({...formData, data: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs font-mono focus:border-emerald-500/50 outline-none resize-y text-emerald-100" 
                  placeholder='{ "blocks": [] }'
                />
                <p className="text-slate-500 text-xs mt-3 font-medium flex items-center gap-2">
                   Le format doit être un JSON valide, contenant la hiérarchie des blocs frontend.
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <label className="flex items-center gap-3 cursor-pointer select-none group/toggle">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
                  <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${formData.active ? 'bg-[#0F7A60]' : 'bg-gray-200 shadow-inner group-hover/toggle:bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm flex items-center justify-center ${formData.active ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="text-sm font-black text-gray-700">Activé (En Ligne)</span>
              </label>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl transition-all">
                  Annuler
                </button>
                <button form="theme-form" type="submit" disabled={isLoading} className="bg-[#0F7A60] text-white px-6 py-2.5 rounded-xl flex items-center font-black shadow-md hover:bg-[#094A3A] hover:shadow-lg transition-all disabled:opacity-50 group">
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
