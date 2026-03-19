'use client'

import { useState, useMemo } from 'react'
import { ListChecks, CheckCircle2, Clock, Target, Search, Calendar, MessageSquare, Plus, X, Trash2, Edit2 } from 'lucide-react'

interface Task {
  id:        string
  title:     string
  priority:  'low' | 'medium' | 'high'
  status:    'todo' | 'in_progress' | 'done'
  dueDate?:  string
  createdAt: string
}

const PRIORITY_COLORS = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700'
}

const STATUS_COLORS = {
  todo:        'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-gold/10 text-gold-dark border-gold/20',
  done:        'bg-emerald/10 text-emerald-dark border-emerald/20'
}

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([])
  
  // États filtres & recherche
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [isTodayOnly, setIsTodayOnly]   = useState(false)
  
  // États UI
  const [showModal, setShowModal]       = useState(false)
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [editTitle, setEditTitle]       = useState('')

  // Formulaire nouvelle tâche
  const [newTask, setNewTask] = useState<{ title: string; priority: 'low' | 'medium' | 'high'; dueDate: string }>({
    title: '', priority: 'medium', dueDate: ''
  })

  // --- FILTRAGE ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // 1. Recherche
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase())
      // 2. Statut
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      // 3. Aujourd'hui
      let matchesToday = true
      if (isTodayOnly) {
        const todayStr = new Date().toISOString().split('T')[0]
        matchesToday = t.dueDate === todayStr
      }
      return matchesSearch && matchesStatus && matchesToday
    })
  }, [tasks, search, statusFilter, isTodayOnly])

  // --- STATS RAPIDES ---
  const stats = useMemo(() => {
    return {
      todo:       tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      done:       tasks.filter(t => t.status === 'done').length,
      sav:        0 // Placeholder pour SAV
    }
  }, [tasks])

  // --- ACTIONS ---
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim()) return

    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title,
      priority: newTask.priority,
      dueDate: newTask.dueDate || undefined,
      status: 'todo',
      createdAt: new Date().toISOString()
    }
    
    setTasks(prev => [task, ...prev]) // Ajout en tête
    setShowModal(false)
    setNewTask({ title: '', priority: 'medium', dueDate: '' })
  }

  const handleDelete = (id: string) => {
    if(confirm('Supprimer cette tâche ?')) {
      setTasks(prev => prev.filter(t => t.id !== id))
    }
  }

  const handleToggleDone = (id: string, currentStatus: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: currentStatus === 'done' ? 'todo' : 'done' } : t
    ))
  }

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
  }

  const saveEdit = (id: string) => {
    if(editTitle.trim()) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editTitle } : t))
    }
    setEditingId(null)
  }

  // --- RENDU KANBAN COLONNE ---
  const renderColumn = (status: 'todo' | 'in_progress' | 'done', title: string, colorClass: string) => {
    const colTasks = filteredTasks.filter(t => t.status === status)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${colorClass}`}>
            {title} ({colTasks.length})
          </span>
        </div>
        
        {colTasks.length === 0 ? (
          <div className="bg-cream/50 rounded-2xl p-6 border border-dashed border-line text-center space-y-2">
            <p className="text-[11px] text-dust font-bold italic">Aucune tâche</p>
          </div>
        ) : (
          <div className="space-y-3">
            {colTasks.map(task => (
              <div key={task.id} className={`p-4 rounded-xl border group hover:shadow-md transition bg-white ${STATUS_COLORS[task.status]}`}>
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Bouton Check */}
                  <button 
                    onClick={() => handleToggleDone(task.id, task.status)}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-emerald border-emerald text-white' : 'border-dust/40 hover:border-emerald'}`}
                  >
                    {task.status === 'done' && <CheckCircle2 size={12} />}
                  </button>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    {editingId === task.id ? (
                      <input 
                        className="w-full text-sm font-bold bg-gray-50 border border-line rounded px-2 py-1 outline-none"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveEdit(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                        autoFocus
                      />
                    ) : (
                      <p 
                        onClick={() => startEdit(task)}
                        className={`text-sm font-bold cursor-pointer ${task.status === 'done' ? 'line-through opacity-60' : 'text-ink'}`}
                      >
                        {task.title}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority === 'low' ? 'Basse' : task.priority === 'medium' ? 'Moyenne' : 'Haute'}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] font-bold text-dust flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Rapides */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(task)} className="p-1.5 text-dust hover:text-ink hover:bg-cream rounded-md transition"><Edit2 size={14}/></button>
                    <button onClick={() => handleDelete(task.id)} className="p-1.5 text-dust hover:text-red-500 hover:bg-red-50 rounded-md transition"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ── STATS RAPIDES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'À faire',      value: stats.todo, color: 'text-ink',      icon: Clock },
          { label: 'En cours',     value: stats.inProgress, color: 'text-gold',     icon: Target },
          { label: 'Terminées',    value: stats.done, color: 'text-emerald',  icon: CheckCircle2 },
          { label: 'SAV Ouverts',  value: stats.sav, color: 'text-red-500',  icon: MessageSquare },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-line p-6 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={20} className={stat.color} />
              <span className={`text-2xl font-display font-black ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-[10px] font-black uppercase text-dust tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── BARRE RECHERCHE & FILTRES ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md text-ink">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dust" size={18} />
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-line rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-gold/10 focus:border-gold outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Toggle Filtres Statut */}
          <div className="flex bg-white border border-line p-1 rounded-2xl shadow-sm">
            {['all', 'todo', 'in_progress', 'done'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === status ? 'bg-cream text-ink shadow-sm' : 'text-dust hover:text-ink'
                }`}
              >
                {status === 'all' ? 'Toutes' : status === 'todo' ? 'À faire' : status === 'done' ? 'Terminées' : 'En cours'}
              </button>
            ))}
          </div>

          {/* Toggle Aujourd'hui */}
          <button 
            onClick={() => setIsTodayOnly(!isTodayOnly)}
            className={`flex-1 md:flex-none border px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
              isTodayOnly ? 'bg-gold/10 text-gold-dark border-gold/30' : 'bg-white border-line text-ink hover:bg-cream'
            }`}
          >
            <Calendar size={14} /> Aujourd&apos;hui
          </button>

          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 md:flex-none bg-ink text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate transition shadow-lg shadow-ink/10"
          >
            <Plus size={16} /> Nouvelle tâche
          </button>
        </div>
      </div>

      {/* ── MESSAGE SI FILTRE AUJOURD'HUI VIDE ── */}
      {isTodayOnly && filteredTasks.length === 0 && (
         <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8 text-center animate-in fade-in">
           <ListChecks size={32} className="mx-auto text-blue-300 mb-3" />
           <p className="font-bold text-blue-900">Aucune tâche prévue pour aujourd'hui !</p>
           <p className="text-sm text-blue-600/70 mt-1">Profitez-en pour avancer sur vos autres encours ou prenez une pause.</p>
         </div>
      )}

      {/* ── KANBAN ── */}
      {!(isTodayOnly && filteredTasks.length === 0) && (
        <div className="bg-[#FAFAF7] md:bg-white rounded-[32px] md:border border-line shadow-sm overflow-hidden">
          <div className="hidden md:flex p-8 border-b border-line items-center justify-between">
            <h3 className="text-xl font-display font-black text-ink">Tableau de bord</h3>
          </div>

          <div className="md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {renderColumn('todo', 'À faire', 'text-dust')}
            {renderColumn('in_progress', 'En cours', 'text-gold')}
            {renderColumn('done', 'Terminées', 'text-emerald')}
          </div>
        </div>
      )}

      {/* ── MODAL CRÉATION DE TÂCHE ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h3 className="font-display font-black text-ink text-lg">Nouvelle tâche</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center bg-cream rounded-full text-slate hover:text-ink transition"><X size={16}/></button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-dust">Titre de la tâche</label>
                <input 
                  type="text" required autoFocus
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Ex: Rappeler le client M. Diallo..."
                  className="w-full border border-line bg-[#FAFAF7] px-4 py-3 rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dust">Priorité</label>
                  <select 
                    value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full border border-line bg-[#FAFAF7] px-4 py-3 rounded-xl text-sm font-bold text-ink outline-none"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-dust">Date (Optionnel)</label>
                  <input 
                    type="date"
                    value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full border border-line bg-[#FAFAF7] px-4 py-3 rounded-xl text-sm font-bold text-ink outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                 <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 rounded-xl font-bold text-sm text-slate hover:bg-cream transition">Annuler</button>
                 <button type="submit" className="px-6 py-3 rounded-xl font-black text-sm bg-ink text-white hover:bg-slate transition shadow-lg shadow-ink/10">Créer la tâche</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── FOOTER INFO ── */}
      <div className="flex items-center justify-center gap-8 pt-8 opacity-60">
        <div className="flex items-center gap-2">
          <ListChecks size={20} className="text-dust" />
          <span className="text-xs font-bold text-ink uppercase tracking-widest">Support 24/7</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-line" />
        <div className="flex items-center gap-2">
          <Target size={20} className="text-dust" />
          <span className="text-xs font-bold text-ink uppercase tracking-widest">Tracking Live</span>
        </div>
      </div>
    </div>
  )
}
