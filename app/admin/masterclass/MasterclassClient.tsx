'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Save, Eye, EyeOff } from 'lucide-react'
import {
  createMasterclassArticle,
  updateMasterclassArticle,
  deleteMasterclassArticle,
  toggleMasterclassArticle
} from '@/app/actions/masterclass'

export default function MasterclassClient({ initialArticles }: { initialArticles: any[] }) {
  const [articles, setArticles] = useState(initialArticles)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    emoji: '📖',
    color: 'bg-emerald-50',
    category: 'Vente',
    readTime: '5 min',
    intro: '',
    is_active: true,
    tips: [{ number: 1, title: '', desc: '' }]
  })

  const resetForm = () => {
    setFormData({
      title: '',
      emoji: '📖',
      color: 'bg-emerald-50',
      category: 'Vente',
      readTime: '5 min',
      intro: '',
      is_active: true,
      tips: [{ number: 1, title: '', desc: '' }]
    })
    setEditingId(null)
  }

  const handleOpenEdit = (article: any) => {
    setFormData({
      title: article.title,
      emoji: article.emoji,
      color: article.color,
      category: article.category,
      readTime: article.readTime,
      intro: article.intro,
      is_active: article.is_active,
      tips: typeof article.tips === 'string' ? JSON.parse(article.tips) : article.tips
    })
    setEditingId(article.id)
    setIsModalOpen(true)
  }

  const handleOpenNew = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingId) {
        const res = await updateMasterclassArticle(editingId, formData)
        if (res.success && res.article) {
          setArticles(prev => prev.map(a => a.id === editingId ? res.article : a))
          setIsModalOpen(false)
        } else {
          alert(res.error)
        }
      } else {
        const res = await createMasterclassArticle(formData)
        if (res.success && res.article) {
          setArticles(prev => [res.article, ...prev])
          setIsModalOpen(false)
        } else {
          alert(res.error)
        }
      }
    } catch (error) {
      alert("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const res = await toggleMasterclassArticle(id, !currentStatus)
    if (res.success) {
      setArticles(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet article ?')) return
    const res = await deleteMasterclassArticle(id)
    if (res.success) {
      setArticles(prev => prev.filter(a => a.id !== id))
    }
  }

  // Tips array management
  const addTip = () => {
    setFormData(prev => ({
      ...prev,
      tips: [...prev.tips, { number: prev.tips.length + 1, title: '', desc: '' }]
    }))
  }

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
    <div>
      <div className="flex justify-end mb-6">
        <button 
          onClick={handleOpenNew}
          className="bg-[#0F7A60] hover:bg-[#0D5C4A] text-white px-4 py-2 rounded-xl flex items-center font-bold text-sm transition-colors"
        >
          <Plus size={16} className="mr-2" /> Nouveau Guide
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAFAF7] text-gray-400 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold">Titre</th>
              <th className="px-6 py-4 font-semibold">Catégorie</th>
              <th className="px-6 py-4 font-semibold">Statut</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Aucun guide pour le moment.</td></tr>
            ) : articles.map((article: any) => (
              <tr key={article.id} className="border-b border-gray-50 last:border-0 hover:bg-[#FAFAF7] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${article.color} rounded-xl flex items-center justify-center text-lg`}>
                      {article.emoji}
                    </div>
                    <div>
                      <p className="font-bold text-ink">{article.title}</p>
                      <p className="text-xs text-gray-400">{article.readTime} • {article.tips?.length || 0} étapes</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-bold">{article.category}</span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleToggleActive(article.id, article.is_active)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${article.is_active ? 'bg-emerald-50 text-[#0F7A60]' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {article.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    {article.is_active ? 'Actif' : 'Brouillon'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEdit(article)} className="p-2 text-gray-400 hover:text-blue-500 bg-white rounded-lg border border-gray-100 hover:border-blue-200 shadow-sm transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(article.id)} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg border border-gray-100 hover:border-red-200 shadow-sm transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-black text-ink">{editingId ? 'Modifier le guide' : 'Nouveau guide'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Titre</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Emoji</label>
                  <input required value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none text-center" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lecture</label>
                  <input required value={formData.readTime} onChange={e => setFormData({...formData, readTime: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none" placeholder="ex: 5 min" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Couleur de fond (CSS)</label>
                  <input required value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none" placeholder="bg-blue-50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Catégorie</label>
                  <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none" placeholder="Vente" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Introduction</label>
                <textarea required rows={3} value={formData.intro} onChange={e => setFormData({...formData, intro: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#0F7A60] outline-none resize-none" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Étapes ({formData.tips.length})</label>
                  <button type="button" onClick={addTip} className="text-[#0F7A60] text-sm font-bold flex items-center bg-emerald-50 px-3 py-1 rounded-lg">
                    <Plus size={14} className="mr-1" /> Ajouter
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.tips.map((tip, index) => (
                    <div key={index} className="p-4 border border-gray-100 rounded-2xl bg-[#FAFAF7] relative">
                      <button type="button" onClick={() => removeTip(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1">
                        <X size={16} />
                      </button>
                      <p className="text-xs font-black text-ink mb-2">Étape {tip.number}</p>
                      <input 
                        required 
                        placeholder="Titre de l'étape" 
                        value={tip.title} 
                        onChange={e => updateTip(index, 'title', e.target.value)} 
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-[#0F7A60] outline-none mb-2" 
                      />
                      <textarea 
                        required 
                        rows={2}
                        placeholder="Description..." 
                        value={tip.desc} 
                        onChange={e => updateTip(index, 'desc', e.target.value)} 
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-[#0F7A60] outline-none resize-none" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#0F7A60] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  <span className="ml-3 text-sm font-bold text-ink">Publié</span>
                </label>
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={isLoading} className="bg-ink text-white px-5 py-2 rounded-xl flex items-center font-bold focus:ring-4 focus:ring-gray-200 hover:bg-gray-800 transition-all disabled:opacity-50">
                    <Save size={16} className="mr-2" /> {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
