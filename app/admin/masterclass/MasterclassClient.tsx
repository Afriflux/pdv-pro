'use client'

import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, X, Save, Eye, EyeOff, GraduationCap, Search, Sparkles, BookOpen, LayoutGrid, List, GripVertical, Loader2, Clock } from 'lucide-react'
import {
  createMasterclassArticle,
  updateMasterclassArticle,
  deleteMasterclassArticle,
  toggleMasterclassArticle
} from '@/app/actions/masterclass'
import GenerateMasterclassModal from './GenerateMasterclassModal'
import { toast } from '@/lib/toast'

export default function MasterclassClient({ initialArticles }: { initialArticles: Record<string, any>[] }) {
  const [articles, setArticles] = useState(initialArticles)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedTipIndex, setDraggedTipIndex] = useState<number | null>(null)
  const [previewArticle, setPreviewArticle] = useState<Record<string, any> | null>(null)
  const [readProgress, setReadProgress] = useState(0)

  // Scroll logic for the preview modal
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight <= clientHeight) {
      setReadProgress(100);
    } else {
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
      setReadProgress(progress)
    }
  }
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    emoji: '📖',
    color: 'bg-emerald-50',
    category: 'Vente',
    readTime: '5 min',
    intro: '',
    is_active: true,
    is_premium: false,
    price: 0,
    allowed_roles: ['all'] as string[],
    tips: [{ number: 1, title: '', desc: '', imageUrl: '', videoUrl: '' }]
  })

  // Computed data
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles
    return articles.filter((a: Record<string, any>) => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [articles, searchQuery])

  const publishedCount = articles.filter(a => a.is_active).length

  const kanbanColumns = useMemo(() => {
    // 1. Récupérer toutes les catégories uniques des cours publiés
    const publishedArticles = filteredArticles.filter(a => a.is_active)
    const drafts = filteredArticles.filter(a => !a.is_active)
    
    const uniqueCategories = Array.from(new Set(publishedArticles.map(a => a.category || 'Général')))
    
    // 2. Créer une colonne par catégorie pour les publiés
    const cols = uniqueCategories.map(cat => ({
      id: `cat-${cat}`,
      title: cat,
      items: publishedArticles.filter(a => (a.category || 'Général') === cat),
      color: 'indigo'
    }))
    
    // 3. Ajouter la colonne Brouillons à la fin
    cols.push({
      id: 'drafts',
      title: 'Brouillons (Non publiés)',
      items: drafts,
      color: 'gray'
    })
    
    return cols
  }, [filteredArticles])

  // Actions
  const resetForm = () => {
    setFormData({
      title: '',
      emoji: '📖',
      color: 'bg-emerald-50',
      category: 'Vente',
      readTime: '5 min',
      intro: '',
      is_active: true,
      is_premium: false,
      price: 0,
      allowed_roles: ['all'],
      tips: [{ number: 1, title: '', desc: '', imageUrl: '', videoUrl: '' }]
    })
    setEditingId(null)
  }

  const handleOpenEdit = (article: Record<string, any>) => {
    setFormData({
      title: article.title || '',
      emoji: article.emoji || '📖',
      color: article.color || 'bg-emerald-50',
      category: article.category || 'Vente',
      readTime: article.readTime || '5 min',
      intro: article.intro || '',
      is_active: article.is_active ?? true,
      is_premium: article.is_premium ?? false,
      price: article.price ?? 0,
      allowed_roles: article.allowed_roles || ['all'],
      tips: typeof article.tips === 'string' ? JSON.parse(article.tips) : article.tips
    })
    setEditingId(article.id)
    setIsModalOpen(true)
  }

  const handleOpenNew = () => {
    resetForm()
    setIsModalOpen(true)
  }

  // Pre-fill form from AI
  const handleAIGenerated = (generatedArticle: Record<string, any>) => {
    setFormData({
      title: generatedArticle.title || '',
      emoji: generatedArticle.emoji || '📖',
      color: generatedArticle.color || 'bg-indigo-50',
      category: generatedArticle.category || 'Vente',
      readTime: generatedArticle.readTime || '5 min',
      intro: generatedArticle.intro || '',
      is_active: false, // Brouillon par défaut pour relecture
      is_premium: false,
      price: 0,
      allowed_roles: ['all'],
      tips: generatedArticle.tips || [{ number: 1, title: '', desc: '', imageUrl: '', videoUrl: '' }]
    })
    setEditingId(null)
    setIsModalOpen(true) // Ouvre le formulaire d'édition auto complété
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingId) {
        const res = await updateMasterclassArticle(editingId, formData)
        if (res.success && res.article) {
          setArticles(prev => prev.map(a => a.id === editingId ? res.article : a))
          toast.success("Module mis à jour !")
          setIsModalOpen(false)
        } else {
          toast.error(res.error || "Erreur de mise à jour")
        }
      } else {
        const res = await createMasterclassArticle(formData)
        if (res.success && res.article) {
          setArticles(prev => [res.article, ...prev])
          toast.success("Nouveau module publié !")
          setIsModalOpen(false)
        } else {
          toast.error(res.error || "Erreur de création")
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur serveur inattendue.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const res = await toggleMasterclassArticle(id, !currentStatus)
    if (res.success) {
      setArticles(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a))
      toast.success(currentStatus ? "Module passé en brouillon" : "Module activé !")
    } else {
      toast.error('Erreur lors du changement de statut')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet article ?')) return
    const res = await deleteMasterclassArticle(id)
    if (res.success) {
      setArticles(prev => prev.filter(a => a.id !== id))
      toast.success('Module supprimé')
    }
  }

  // Tips Management
  const addTip = () => {
    setFormData(prev => ({
      ...prev,
      tips: [...prev.tips, { number: prev.tips.length + 1, title: '', desc: '', imageUrl: '', videoUrl: '' }]
    }))
  }

  const handleDragStart = (index: number) => setDraggedTipIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedTipIndex === null || draggedTipIndex === index) return
    setFormData(prev => {
      const newTips = [...prev.tips]
      const draggedItem = newTips[draggedTipIndex]
      newTips.splice(draggedTipIndex, 1)
      newTips.splice(index, 0, draggedItem)
      const renumbered = newTips.map((tip, i) => ({ ...tip, number: i + 1 }))
      return { ...prev, tips: renumbered }
    })
    setDraggedTipIndex(index)
  }
  const handleDragEnd = () => setDraggedTipIndex(null)

  const updateTip = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newTips = [...prev.tips]
      newTips[index] = { ...newTips[index], [field]: value }
      return { ...prev, tips: newTips }
    })
  }

  const removeTip = (index: number) => {
    setFormData(prev => {
      const newTips = prev.tips.filter((_, i) => i !== index).map((tip, i) => ({ ...tip, number: i + 1 }))
      return { ...prev, tips: newTips }
    })
  }

  return (
    <div className="flex flex-col w-full">
      {/* HEADER FULL-BLEED */}
      <header className="w-full bg-gradient-to-br from-[#0D5C4A] via-[#0F7A60] to-emerald-800 pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shadow-lg shrink-0">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-[1900px] mx-auto w-full">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Yayyam Académie</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1 max-w-lg leading-relaxed">
                Le centre de formation exclusif de la plateforme. Partagez votre expertise au travers de modules éducatifs pour vos différentes audiences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl">
             <div className="flex flex-col">
               <span className="text-xs font-black tracking-widest text-emerald-200 uppercase">Actifs</span>
               <span className="text-2xl font-black text-white">{publishedCount} <span className="text-sm font-medium text-emerald-200">cours</span></span>
             </div>
             <div className="w-[1px] h-8 bg-white/20 mx-2"></div>
             <div className="flex flex-col">
               <span className="text-xs font-black tracking-widest text-emerald-200 uppercase">Total</span>
               <span className="text-2xl font-black text-white">{articles.length}</span>
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
                placeholder="Rechercher un cours..." 
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
                 onClick={() => setViewMode('kanban')}
                 className={`p-2 rounded-lg transition-all flex items-center justify-center ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                 title="Vue Kanban (Cartes)"
               >
                 <LayoutGrid className="w-4 h-4" />
               </button>
             </div>
             
             <button 
               onClick={() => setIsGenerateModalOpen(true)}
               className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-sm rounded-2xl transition-all shadow-sm border border-indigo-100"
             >
               <Sparkles className="w-4 h-4" /> IA Génératrice
             </button>
             <button 
               onClick={handleOpenNew}
               className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#0D5C4A] hover:bg-[#083D31] text-white font-black text-sm rounded-2xl shadow-[0_4px_14px_rgba(15,122,96,0.3)] transition-all"
             >
               <Plus className="w-4 h-4" /> Créer Rédiger
             </button>
           </div>
        </div>

        {/* BIBLIOTHÈQUE - GRID DE CARTES */}
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-24 h-24 bg-white shadow-xl rounded-full border border-gray-100 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Aucun cours trouvé</h3>
            <p className="text-gray-500 font-medium max-w-sm mb-6">
              {searchQuery ? "Aucune masterclass ne correspond à votre recherche." : "Votre bibliothèque est vide. Partagez votre premier guide !"}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-sm font-bold text-[#0F7A60] bg-emerald-50 px-6 py-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
               >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          /* VUE LISTE (TABLE) */
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#FAFAF7] text-gray-400 border-b border-gray-100 uppercase tracking-widest text-xs font-black">
                  <tr>
                    <th className="px-6 py-5">Titre du module</th>
                    <th className="px-6 py-5 text-center">Catégorie</th>
                    <th className="px-6 py-5 text-center">Volume</th>
                    <th className="px-6 py-5 text-center">Vues</th>
                    <th className="px-6 py-5">Statut</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((article: Record<string, any>) => {
                    const tipsLength = Array.isArray(article.tips) ? article.tips.length : (typeof article.tips === 'string' ? JSON.parse(article.tips).length : 0);
                    // Génération déterministe pour éviter les Hydration Errors de Next.js
                    const simulatedViews = (article.id.charCodeAt(0) * 7) % 80 + 12;
                    return (
                      <tr key={article.id} className="border-b border-gray-50 last:border-0 hover:bg-[#FAFAF7] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 ${article.color || 'bg-emerald-50'} rounded-xl flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform`}>
                              {article.emoji}
                            </div>
                            <div className="max-w-[300px]">
                              <p className="font-black text-gray-900 truncate text-[15px] group-hover:text-[#0F7A60] transition-colors">{article.title}</p>
                              <p className="text-xs text-gray-400 font-medium truncate mt-0.5 mb-1.5">{article.intro}</p>
                              <div className="flex flex-wrap gap-1">
                               {(article.allowed_roles || ['all']).map((r: string) => {
                                 const roleName = r === 'all' ? 'TOUS' : r === 'vendor' ? 'VENDEUR' : r === 'closer' ? 'CLOSER' : r === 'client' ? 'ACHETEUR' : r === 'affiliate' ? 'AFFILIÉ' : r;
                                 return (
                                   <span key={r} className="text-[8px] font-bold uppercase tracking-widest text-[#0D5C4A] bg-[#0F7A60]/10 px-1.5 py-0.5 rounded-full border border-[#0F7A60]/20 shadow-sm">
                                     {roleName}
                                   </span>
                                 )
                               })}
                             </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest">{article.category}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                             <div className="text-xs font-bold text-gray-900">{tipsLength} étapes</div>
                             <div className="text-xs font-medium text-gray-400">{article.readTime}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                            👁️ {simulatedViews}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleToggleActive(article.id, article.is_active)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${article.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {article.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {article.is_active ? 'Publié' : 'Brouillon'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenEdit(article)} className="p-2 text-gray-400 hover:text-blue-500 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 shadow-sm transition-all text-xs font-bold" title="Modifier">
                              Éditer
                            </button>
                            <button onClick={() => handleDelete(article.id)} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50 shadow-sm transition-all" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VUE REGROUPÉE PAR CATÉGORIE (Ex-Kanban) */
          <div className="flex flex-col gap-12 pb-8">
            {kanbanColumns.map(col => {
              if (col.items.length === 0) return null; // Ne pas afficher de section vide

              return (
                 <div key={col.id} className="flex flex-col relative">
                   
                   {/* En-tête de Section */}
                   <div className="flex items-center gap-3 mb-6">
                     <h3 className={`font-black text-lg uppercase tracking-widest ${col.color === 'emerald' ? 'text-emerald-700' : (col.color === 'indigo' ? 'text-indigo-700' : 'text-gray-500')}`}>
                       {col.title}
                     </h3>
                     <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                       {col.items.length}
                     </span>
                     <div className="flex-1 h-px bg-gray-100 ml-4"></div>
                   </div>

                   {/* Grille de Cartes pour cette catégorie */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {col.items.map((article: Record<string, any>) => {
                       const simulatedViews = ((article.id.toString().charCodeAt(0) || 0) * 7) % 80 + 12;
                       return (
                         <div key={article.id} onClick={() => setPreviewArticle(article)} className="bg-white border text-left border-gray-100/80 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-emerald-500/20 transition-all duration-300 cursor-pointer group flex flex-col relative h-full overflow-hidden transform hover:-translate-y-1">
                           
                           {/* Image Placeholder / Banner (Aligned with Vendor) */}
                           <div className={`h-40 w-full ${article.color || 'bg-emerald-50'} relative overflow-hidden flex items-center justify-center isolate border-b border-gray-50`}>
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                             <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
                             
                             <div className="text-6xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 z-10 drop-shadow-md">
                               {article.emoji}
                             </div>
                             <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 z-10 shadow-sm border border-gray-100">
                               👁️ {simulatedViews}
                             </div>
                             <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 z-10 shadow-sm border border-gray-100">
                               <Clock size={12} className="text-gray-400" /> {article.readTime}
                             </div>
                             <div className="absolute top-3 left-3 bg-[#0F7A60] text-white text-xs font-black px-2.5 py-1 rounded-lg z-10 uppercase tracking-wide shadow-sm">
                               {article.category}
                             </div>
                             {article.is_premium && (
                               <div className="absolute bottom-3 left-3 bg-amber-400 text-amber-900 text-xs font-black px-2.5 py-1 rounded-lg z-10 uppercase tracking-wide shadow-sm flex items-center gap-1">
                                 ⭐ {article.price}F
                               </div>
                             )}
                           </div>

                           {/* Corps Carte */}
                           <div className="p-6 flex flex-col flex-1">
                             <div className="flex flex-wrap gap-1 mb-2">
                               {(article.allowed_roles || ['all']).map((r: string) => {
                                 const roleName = r === 'all' ? 'TOUS' : r === 'vendor' ? 'VENDEUR' : r === 'closer' ? 'CLOSER' : r === 'client' ? 'ACHETEUR' : r === 'affiliate' ? 'AFFILIÉ' : r;
                                 return (
                                   <span key={r} className="text-xs font-bold uppercase tracking-widest text-[#0D5C4A] bg-[#0F7A60]/10 px-2 py-0.5 rounded-full border border-[#0F7A60]/20 shadow-sm">
                                     {roleName}
                                   </span>
                                 )
                               })}
                             </div>
                             <h3 className="text-lg font-black text-gray-900 leading-snug mb-3 group-hover:text-[#0F7A60] transition-colors line-clamp-2">{article.title}</h3>
                             <p className="text-[13px] text-gray-500 font-medium line-clamp-2 leading-relaxed mb-6 flex-1">{article.intro}</p>
                             
                             {/* Actions Footer */}
                             <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                               <button 
                                 onClick={() => handleToggleActive(article.id, article.is_active)}
                                 className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all border ${article.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                               >
                                 {article.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                 {article.is_active ? 'Publié' : 'Brouillon'}
                               </button>
                               <div className="flex items-center gap-2">
                                 <button onClick={() => handleOpenEdit(article)} title="Modifier" aria-label="Modifier le cours" className="p-2.5 text-gray-500 hover:text-blue-600 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                                 <button onClick={() => handleDelete(article.id)} title="Supprimer" aria-label="Supprimer le cours" className="p-2.5 text-gray-500 hover:text-red-600 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-red-200 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                               </div>
                             </div>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 </div>
              )
            }
            )}
          </div>
        )}
      </main>

      {/* MODAL CRÉATION/ÉDITION MANUELLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className={`px-8 py-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white relative overflow-hidden`}>
              <div className="relative z-10 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${formData.color || 'bg-emerald-50'} flex items-center justify-center text-2xl shadow-sm border border-black/5`}>
                  {formData.emoji || '🎓'}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">
                    {editingId ? 'Éditer le Module' : 'Nouveau Module'}
                  </h2>
                  <p className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                    Formulaire de l'Académie
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                title="Fermer"
                aria-label="Fermer le modal"
                className="relative z-10 w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <form id="masterclass-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#FAFAF7]/50">
              
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                 <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Aperçu Principal</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-gray-700 mb-2">Titre du Cours</label>
                     <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none shadow-inner transition-colors" placeholder="Ex: Technique P.A.S pour vendre" />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Emoji</label>
                     <input required value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none shadow-inner text-center font-emoji" placeholder="📱" />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Couleur de fond (Tailwind)</label>
                     <select 
                        title="Couleur de fond" 
                        aria-label="Couleur de fond" 
                        value={formData.color} 
                        onChange={e => setFormData({...formData, color: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none cursor-pointer"
                     >
                        <option value="bg-emerald-50">Générique (Émeraude)</option>
                        <option value="bg-blue-50">Appels / Communication (Bleu)</option>
                        <option value="bg-indigo-50">Stratégie (Indigo)</option>
                        <option value="bg-amber-50">Prospection (Ambre)</option>
                        <option value="bg-rose-50">Objections (Rose)</option>
                        <option value="bg-purple-50">Psychologie (Violet)</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie</label>
                     <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none shadow-inner" placeholder="Vente" />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Temps de lecture</label>
                     <input required value={formData.readTime} onChange={e => setFormData({...formData, readTime: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none shadow-inner" placeholder="ex: 5 min" />
                   </div>
                   
                   <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-gray-700 mb-2">Introduction (Teaser)</label>
                     <textarea required rows={3} value={formData.intro} onChange={e => setFormData({...formData, intro: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-[#0F7A60] outline-none shadow-inner resize-none" placeholder="Donnez envie au vendeur de lire ce guide..." />
                   </div>
                   
                   <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
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
                         <span className="text-sm font-bold text-emerald-900">Cours Premium (Payant)</span>
                       </label>
                       {formData.is_premium && (
                         <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none shadow-sm animate-in fade-in" placeholder="Prix en FCFA (ex: 5000)" />
                       )}
                     </div>
                   </div>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Étapes du Cours ({formData.tips.length})</h3>
                  <button type="button" onClick={addTip} className="text-[#0F7A60] text-sm font-bold flex items-center gap-1.5 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors">
                    <Plus size={16} /> Ajouter une étape
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.tips.map((tip, index) => (
                    <div 
                      key={index} 
                      draggable 
                      onDragStart={() => handleDragStart(index)} 
                      onDragOver={(e) => handleDragOver(e, index)} 
                      onDragEnd={handleDragEnd}
                      className={`p-5 border border-gray-100 rounded-2xl bg-gray-50/50 relative group flex gap-3 cursor-move transition-transform ${draggedTipIndex === index ? 'opacity-50 scale-95 shadow-inner' : ''}`}
                    >
                      <div className="pt-2 text-gray-400 hover:text-[#0F7A60] transition-colors hidden sm:flex shrink-0">
                        <GripVertical size={20} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-black text-gray-500 group-hover:text-[#0F7A60] group-hover:border-emerald-200 transition-colors">
                            {tip.number}
                          </span>
                          <button type="button" title="Supprimer l'étape" aria-label="Supprimer l'étape" onClick={() => removeTip(index)} className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-lg border border-gray-100 shadow-sm opacity-0 group-hover:opacity-100 active:opacity-100 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        <input 
                          required 
                          placeholder="Titre de l'étape (ex: L'accroche choc)" 
                          value={tip.title} 
                          onChange={e => updateTip(index, 'title', e.target.value)} 
                          className="w-full border-b border-gray-200 bg-transparent p-2 text-sm font-bold text-gray-900 focus:border-[#0F7A60] outline-none mb-3 transition-colors placeholder:font-normal" 
                        />
                          <textarea 
                          required 
                          rows={3}
                          placeholder="Détaillez le script, la psychologie ou l'action à mener..." 
                          value={tip.desc} 
                          onChange={e => updateTip(index, 'desc', e.target.value)} 
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none resize-none shadow-inner transition-colors mb-3" 
                        />
                        <input 
                          placeholder="Lien Image / Diapo (Optionnel)" 
                          value={tip.imageUrl || ''} 
                          onChange={e => updateTip(index, 'imageUrl', e.target.value)} 
                          className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none mb-3 transition-colors" 
                        />
                        <input 
                          placeholder="Lien Vidéo / Iframe (Optionnel)" 
                          value={tip.videoUrl || ''} 
                          onChange={e => updateTip(index, 'videoUrl', e.target.value)} 
                          className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none transition-colors" 
                        />
                      </div>
                    </div>
                  ))}
                  {formData.tips.length === 0 && (
                     <div className="text-center py-6 text-gray-400 text-sm font-medium border-2 border-dashed border-gray-200 rounded-2xl">
                       Aucune étape. Cliquez sur "Ajouter une étape" pour commencer.
                     </div>
                  )}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <label className="flex items-center gap-3 cursor-pointer select-none group/toggle">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${formData.is_active ? 'bg-[#0F7A60]' : 'bg-gray-200 shadow-inner group-hover/toggle:bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm flex items-center justify-center ${formData.is_active ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="text-sm font-black text-gray-700">Publié pour les vendeurs</span>
              </label>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl transition-all">
                  Annuler
                </button>
                <button form="masterclass-form" type="submit" disabled={isLoading} className="bg-[#0D5C4A] text-white px-6 py-2.5 rounded-xl flex items-center font-black shadow-md hover:bg-[#083D31] hover:shadow-lg transition-all disabled:opacity-50 group">
                  {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2 group-hover:scale-110 transition-transform" />} 
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* MODAL PRÉVISUALISATION LECTURE (Identique Vendor) */}
      {previewArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] lg:max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
            
            {/* Header Modal */}
            <div className="relative flex-shrink-0">
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 z-50">
                <div className="h-full bg-[#0F7A60] transition-all duration-150 ease-out rounded-r-full" ref={el => { if(el) el.style.width = `${readProgress}%` }}></div>
              </div>
              
              <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 bg-white/95 backdrop-blur-xl absolute top-1.5 left-0 w-full z-40">
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 text-gray-600 text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wide">
                    {previewArticle.category}
                  </span>
                  <span className="text-xs font-bold text-gray-400 hidden sm:inline-block">
                    {readProgress >= 98 ? '🎉 Terminé' : `${Math.round(readProgress)}% lu`}
                  </span>
                </div>
                <button 
                  onClick={() => setPreviewArticle(null)}
                  title="Fermer"
                  aria-label="Fermer"
                  className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 hover:text-red-500 text-gray-900 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div 
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-24 sm:px-12 scroll-smooth bg-[#FAFAF7] custom-scrollbar"
            >
              <div className="text-center mb-14">
                <div className={`w-28 h-28 mx-auto ${previewArticle.color || 'bg-emerald-50'} border border-white rounded-[2rem] flex items-center justify-center text-6xl mb-6 shadow-lg shadow-emerald-900/5 transform -rotate-3 hover:rotate-0 transition-transform duration-300`}>
                  {previewArticle.emoji}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
                  {previewArticle.title}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto font-medium">
                  {previewArticle.intro}
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-8 max-w-3xl mx-auto pb-16">
                {(Array.isArray(previewArticle.tips) ? previewArticle.tips : (typeof previewArticle.tips === 'string' ? JSON.parse(previewArticle.tips) : [])).map((tip: Record<string, any>) => (
                  <div key={tip.number} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#0F7A60]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6 relative z-10">
                      <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#0F7A60] to-emerald-500 text-white text-2xl font-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        {tip.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 mb-3 leading-snug">{tip.title}</h3>
                        
                        {tip.videoUrl && (
                           <div className="w-full aspect-video mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-black">
                             <iframe 
                               src={tip.videoUrl.replace('watch?v=', 'embed/')} 
                               title={`Aperçu vidéo: ${tip.title}`}
                               className="w-full h-full" 
                               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                               allowFullScreen 
                             />
                           </div>
                        )}
                        {!tip.videoUrl && tip.imageUrl && (
                           <div className="w-full h-48 sm:h-64 mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={tip.imageUrl} alt={tip.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                           </div>
                        )}
                        
                        <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-wrap">{tip.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IA GENERATEUR */}
      <GenerateMasterclassModal 
         isOpen={isGenerateModalOpen} 
         onClose={() => setIsGenerateModalOpen(false)} 
         onSuccess={handleAIGenerated} 
      />
    </div>
  )
}
