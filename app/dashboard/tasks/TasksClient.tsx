'use client'

import { toast } from 'sonner';

import { useState, useMemo, useEffect, useRef, useTransition } from 'react'
import { ListChecks, CheckCircle2, Clock, Target, Search, Calendar, MessageSquare, Plus, X, Trash2, Edit2, Loader2, Phone, Mail, Users, AlertTriangle, FileText, UserCircle2, Megaphone, PenTool, Briefcase, Truck, Package, Sparkles } from 'lucide-react'
import { createTaskAction, updateTaskStatus, updateTaskTitle, deleteTaskAction, getStoreCustomersAction } from './actions'

interface Task {
  id:        string
  title:     string
  priority:  'low' | 'medium' | 'high'
  status:    'todo' | 'in_progress' | 'done'
  dueDate?:  string
  description?: string
  taskType: 'call' | 'email' | 'meeting' | 'issue' | 'general' | 'marketing' | 'content' | 'admin' | 'logistics' | 'product' | string
  client_name?: string
  client_phone?: string
  order_id?: string
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

export default function TasksClient({ initialTasks = [] }: { initialTasks?: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [, startTransition] = useTransition()
  
  // États filtres & recherche
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [isTodayOnly, setIsTodayOnly]   = useState(false)
  
  // États UI
  const [showModal, setShowModal]       = useState(false)
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [editTitle, setEditTitle]       = useState('')

  // Formulaire nouvelle tâche
  const [newTask, setNewTask] = useState<{ 
    title: string; priority: 'low' | 'medium' | 'high'; dueDate: string;
    description: string; taskType: 'call' | 'email' | 'meeting' | 'issue' | 'general' | 'marketing' | 'content' | 'admin' | 'logistics' | 'product' | string;
    client_name: string; client_phone: string; order_id: string;
  }>({
    title: '', priority: 'medium', dueDate: '',
    description: '', taskType: 'general',
    client_name: '', client_phone: '', order_id: ''
  })

  // Magic Input AI
  const [magicInput, setMagicInput] = useState('')
  const [isParsingAI, setIsParsingAI] = useState(false)

  const handleMagicParse = async () => {
    if (!magicInput.trim() || isParsingAI) return
    setIsParsingAI(true)
    try {
      const res = await fetch('/api/ai/tasks/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: magicInput })
      })
      const data = await res.json()
      if (data.parsed) {
        setNewTask(prev => ({
          ...prev,
          title: data.parsed.title || prev.title,
          description: data.parsed.description || prev.description,
          taskType: data.parsed.taskType || prev.taskType,
          priority: data.parsed.priority || prev.priority,
          dueDate: data.parsed.dueDate || prev.dueDate,
          client_name: data.parsed.client_name || prev.client_name,
          client_phone: data.parsed.client_phone || prev.client_phone,
        }))
        setMagicInput('')
      }
    } catch(err) {
      console.error(err)
    } finally {
      setIsParsingAI(false)
    }
  }

  // Action IA Modal
  const [actionAiTask, setActionAiTask] = useState<Task | null>(null)
  const [generatedAction, setGeneratedAction] = useState('')
  const [isGeneratingAction, setIsGeneratingAction] = useState(false)

  const handleGenerateAction = async (task: Task) => {
    setActionAiTask(task)
    setGeneratedAction('')
    setIsGeneratingAction(true)
    
    try {
      const res = await fetch('/api/ai/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: task.title, taskDescription: task.description, taskType: task.taskType })
      })
      const data = await res.json()
      if (data.generated) {
        setGeneratedAction(data.generated)
      } else {
        setGeneratedAction("Impossible de générer une action pour le moment.")
      }
    } catch(err) {
      console.error(err)
      setGeneratedAction("Erreur de connexion à l'IA.")
    } finally {
      setIsGeneratingAction(false)
    }
  }

  // ── AUTOCOMPLÉTION CLIENT (PHASE 28C) ──
  const [storeCustomers, setStoreCustomers] = useState<{name:string, phone:string}[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch customers only once on mount
    getStoreCustomersAction().then(res => {
      if (res.success && res.customers) {
        setStoreCustomers(res.customers)
      }
    })
  }, [])

  useEffect(() => {
    // Click outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef])

  const filteredCustomers = useMemo(() => {
    if (!newTask.client_name) return storeCustomers
    return storeCustomers.filter(c => 
      c.name.toLowerCase().includes(newTask.client_name.toLowerCase()) || 
      c.phone.includes(newTask.client_name)
    )
  }, [storeCustomers, newTask.client_name])
  // ── FIN AUTOCOMPLÉTION ──

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
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim()) return

    const backup = [...tasks]
    const tempId = 'temp-' + Date.now()
    
    // Optimsitic UI
    const tempTask: Task = {
      id: tempId,
      title: newTask.title,
      priority: newTask.priority,
      dueDate: newTask.dueDate || undefined,
      description: newTask.description || undefined,
      taskType: newTask.taskType,
      client_name: newTask.client_name || undefined,
      client_phone: newTask.client_phone || undefined,
      order_id: newTask.order_id || undefined,
      status: 'todo',
      createdAt: new Date().toISOString()
    }
    setTasks(prev => [tempTask, ...prev])
    setShowModal(false)
    setNewTask({ title: '', priority: 'medium', dueDate: '', description: '', taskType: 'general', client_name: '', client_phone: '', order_id: '' })

    startTransition(async () => {
      const res = await createTaskAction({ 
        title: tempTask.title, priority: tempTask.priority, dueDate: tempTask.dueDate,
        description: tempTask.description, taskType: tempTask.taskType, 
        client_name: tempTask.client_name, client_phone: tempTask.client_phone, order_id: tempTask.order_id
      })
      if (!res.success) {
        toast(res.error)
        setTasks(backup)
      } else {
        // Remplace l'ID temporaire par le vrai ID venant de DB (le refresh Next.js va aussi retélécharger tout)
      }
    })
  }

  const handleDelete = (id: string) => {
    // eslint-disable-next-line no-alert
    if(confirm('Supprimer cette tâche ?')) {
      const backup = [...tasks]
      setTasks(prev => prev.filter(t => t.id !== id))
      
      startTransition(async () => {
        const res = await deleteTaskAction(id)
        if (!res.success) {
          toast.error('Erreur: Impossible de supprimer.')
          setTasks(backup)
        }
      })
    }
  }

  const handleToggleDone = (id: string, currentStatus: string) => {
    const backup = [...tasks]
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: newStatus } : t
    ))

    startTransition(async () => {
      const res = await updateTaskStatus(id, newStatus)
      if (!res.success) setTasks(backup)
    })
  }

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
  }

  const saveEdit = (id: string) => {
    if(!editTitle.trim()) {
      setEditingId(null)
      return
    }
    
    const backup = [...tasks]
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editTitle } : t))
    setEditingId(null)

    startTransition(async () => {
      const res = await updateTaskTitle(id, editTitle)
      if (!res.success) setTasks(backup)
    })
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={14} className="text-blue-500" />
      case 'email': return <Mail size={14} className="text-purple-500" />
      case 'meeting': return <Users size={14} className="text-gold-dark" />
      case 'issue': return <AlertTriangle size={14} className="text-red-500" />
      case 'marketing': return <Megaphone size={14} className="text-pink-500" />
      case 'content': return <PenTool size={14} className="text-orange-500" />
      case 'admin': return <Briefcase size={14} className="text-slate-600" />
      case 'logistics': return <Truck size={14} className="text-emerald-500" />
      case 'product': return <Package size={14} className="text-indigo-500" />
      default: return <FileText size={14} className="text-slate-400" />
    }
  }

  // --- RENDU KANBAN COLONNE ---
  const renderColumn = (status: 'todo' | 'in_progress' | 'done', title: string, colorClass: string) => {
    const colTasks = filteredTasks.filter(t => t.status === status)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className={`text-xs font-black uppercase tracking-[0.2em] ${colorClass}`}>
            {title} ({colTasks.length})
          </span>
        </div>
        
        {colTasks.length === 0 ? (
          <div className="bg-cream/50 rounded-2xl p-6 border border-dashed border-line text-center space-y-2">
            <p className="text-xs text-dust font-bold italic">Aucune tâche</p>
          </div>
        ) : (
          <div className="space-y-3">
            {colTasks.map(task => (
              <div key={task.id} className={`p-4 rounded-xl border group hover:shadow-md transition bg-white ${STATUS_COLORS[task.status]}`}>
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Bouton Check */}
                  <button 
                    title={task.status === 'done' ? 'Marquer comme à faire' : 'Marquer comme terminé'}
                    onClick={() => handleToggleDone(task.id, task.status)}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-emerald border-emerald text-white' : 'border-dust/40 hover:border-emerald'}`}
                  >
                    {task.status === 'done' && <CheckCircle2 size={12} />}
                  </button>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    {editingId === task.id ? (
                      <input 
                        title="Titre de la tâche"
                        className="w-full text-sm font-bold bg-gray-50 border border-line rounded px-2 py-1 outline-none"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveEdit(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="mt-1 flex-shrink-0 bg-slate-50 p-1.5 rounded-lg border border-line">
                          {getTaskIcon(task.taskType)}
                        </div>
                        <div>
                          <p 
                            onClick={() => startEdit(task)}
                            className={`text-sm font-bold cursor-pointer mb-1 ${task.status === 'done' ? 'line-through opacity-60' : 'text-ink'}`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-dust line-clamp-2 leading-relaxed mb-2 break-all">{task.description}</p>
                          )}
                          
                          {(task.client_name || task.client_phone || task.order_id) && (
                            <div className="flex flex-wrap gap-2 mt-1 mb-2">
                              {task.client_phone ? (
                                <a suppressHydrationWarning href={`https://wa.me/${task.client_phone.replace(/\+/g, '')}?text=Bonjour${task.client_name ? ` ${task.client_name}` : ''}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold hover:bg-green-100 transition border border-green-200">
                                  <Phone size={10} /> {task.client_name || task.client_phone}
                                </a>
                              ) : task.client_name ? (
                                <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-line">
                                  <Users size={10} /> {task.client_name}
                                </span>
                              ) : null}

                              {task.order_id && (
                                <span className="flex items-center gap-1 bg-cream text-ink px-2 py-1 rounded text-xs font-bold border border-line">
                                  # {task.order_id.slice(-6)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority === 'low' ? 'Basse' : task.priority === 'medium' ? 'Moyenne' : 'Haute'}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs font-bold text-dust flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Rapides */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleGenerateAction(task)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition" title="Générer Réponse/Draft IA"><Sparkles size={14}/></button>
                    <button onClick={() => startEdit(task)} className="p-1.5 text-dust hover:text-ink hover:bg-cream rounded-md transition" title="Modifier la tâche"><Edit2 size={14}/></button>
                    <button onClick={() => handleDelete(task.id)} className="p-1.5 text-dust hover:text-red-500 hover:bg-red-50 rounded-md transition" title="Supprimer la tâche"><Trash2 size={14}/></button>
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
            <p className="text-xs font-black uppercase text-dust tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── BARRE RECHERCHE & FILTRES ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md text-ink">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dust" size={18} />
          <input
            title="Rechercher une tâche"
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
            <div className="flex items-center justify-between border-b border-line p-5 bg-[#FAFAF7]">
              <h3 className="font-display font-black text-ink text-lg flex items-center gap-2">
                Nouvelle tâche
              </h3>
              <button title="Fermer" onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center bg-cream rounded-full text-slate hover:text-ink transition"><X size={16}/></button>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 border-b border-line/50">
              <label className="text-xs font-black uppercase tracking-widest text-indigo-800 mb-2 flex items-center gap-1.5"><Sparkles size={12}/> Magic Input IA</label>
              <div className="relative">
                <input 
                  title="Magic Input IA"
                  type="text" 
                  value={magicInput} 
                  onChange={e => setMagicInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleMagicParse())}
                  placeholder="Ex: Rappeler M. Diallo demain pour sa commande bloquée..."
                  disabled={isParsingAI}
                  className="w-full border border-indigo-200/60 bg-white/60 backdrop-blur-sm pl-4 pr-12 py-3.5 rounded-xl text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition disabled:opacity-60"
                />
                <button 
                  onClick={handleMagicParse}
                  disabled={isParsingAI || !magicInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md disabled:bg-indigo-300"
                >
                  {isParsingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-dust">Titre de la tâche</label>
                <input 
                  title="Titre de la tâche"
                  type="text" required autoFocus
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Ex: Rappeler le client M. Diallo..."
                  className="w-full border border-line bg-[#FAFAF7] px-4 py-3 rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-dust">Description (Optionnel)</label>
                <textarea 
                  value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Détails, notes, contexte..."
                  rows={3}
                  className="w-full border border-line bg-[#FAFAF7] px-4 py-3 rounded-xl text-sm font-medium text-ink focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-dust">Type de tâche</label>
                  <select 
                    title="Type de tâche"
                    value={newTask.taskType} onChange={e => setNewTask({...newTask, taskType: e.target.value as any})}
                    className="w-full border border-line bg-[#FAFAF7] px-4 py-3 rounded-xl text-sm font-bold text-ink outline-none"
                  >
                    <option value="general" className="font-bold text-gray-700">📋 Général</option>
                    <hr className="my-1 border-line" />
                    <option value="call" className="font-medium">📞 Appel Client</option>
                    <option value="email" className="font-medium">✉️ Email Client</option>
                    <option value="meeting" className="font-medium">🤝 Rendez-vous</option>
                    <option value="issue" className="font-medium">⚠️ Problème / SAV</option>
                    <hr className="my-1 border-line" />
                    <option value="marketing" className="font-medium">📢 Marketing / Pub</option>
                    <option value="content" className="font-medium">🎨 Création Contenu</option>
                    <option value="product" className="font-medium">📦 Gestion Produit</option>
                    <option value="logistics" className="font-medium">🚚 Livraison / Logistique</option>
                    <option value="admin" className="font-medium">💼 Administratif / Finance</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-dust">Priorité</label>
                  <select 
                    title="Priorité"
                    value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full border border-line bg-[#FAFAF7] px-4 py-3 rounded-xl text-sm font-bold text-ink outline-none"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
              </div>

              {['call', 'email', 'meeting', 'issue'].includes(newTask.taskType) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative" ref={dropdownRef}>
                    <label className="text-xs font-black uppercase tracking-widest text-dust">Client @ (Opt.)</label>
                    <div className="relative">
                      <UserCircle2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dust" />
                      <input 
                        title="Nom du client"
                        type="text"
                        value={newTask.client_name} 
                        onChange={e => {
                          setNewTask({...newTask, client_name: e.target.value})
                          setShowCustomerDropdown(true)
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="Tapez un nom..."
                        className="w-full border border-line bg-[#FAFAF7] pl-10 pr-4 py-3 rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                      />
                    </div>
                    
                    {/* Dropdown d'autocomplétion */}
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-line rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto w-full">
                        {filteredCustomers.map((c, i) => (
                          <div 
                            key={i}
                            onClick={() => {
                              setNewTask({
                                ...newTask, 
                                client_name: c.name, 
                                client_phone: c.phone
                              })
                              setShowCustomerDropdown(false)
                            }}
                            className="px-4 py-3 hover:bg-cream cursor-pointer border-b border-line/50 last:border-0 transition-colors"
                          >
                            <p className="text-sm font-bold text-ink">{c.name}</p>
                            <p className="text-xs text-dust font-medium">{c.phone}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-dust">Téléphone (Opt.)</label>
                    <input 
                      title="Téléphone du client"
                      type="text"
                      value={newTask.client_phone} onChange={e => setNewTask({...newTask, client_phone: e.target.value})}
                      placeholder="+221..."
                      className="w-full border border-line bg-[#FAFAF7] px-4 py-3 rounded-xl text-sm font-bold text-ink outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-dust">Date d'échéance (Opt.)</label>
                  <input 
                    title="Date d'échéance"
                    type="date"
                    value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full border border-line bg-[#FAFAF7] px-4 py-3 rounded-xl text-sm font-bold text-ink outline-none"
                  />
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                 <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 rounded-xl font-bold text-sm text-slate hover:bg-cream transition">Annuler</button>
                 <button type="submit" className="px-6 py-3 rounded-xl font-black text-sm bg-ink text-white hover:bg-slate transition shadow-lg shadow-ink/10">Créer la tâche</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL ACTION IA ── */}
      {actionAiTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-indigo-100">
            <div className="flex items-center justify-between border-b border-indigo-50 bg-indigo-50/50 p-5">
              <h3 className="font-display font-black text-indigo-900 text-lg flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" /> Action IA suggérée
              </h3>
              <button title="Fermer" onClick={() => setActionAiTask(null)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-indigo-400 hover:text-indigo-800 transition shadow-sm"><X size={16}/></button>
            </div>
            
            <div className="p-6">
              <p className="text-sm font-bold text-ink mb-1 truncate">{actionAiTask.title}</p>
              <p className="text-xs text-dust mb-4 line-clamp-2">{actionAiTask.description || "Aucune description supplémentaire."}</p>

              {isGeneratingAction ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                  <Loader2 size={30} className="animate-spin text-indigo-500" />
                  <p className="text-sm font-bold text-indigo-900 animate-pulse">L'IA rédige votre livrable...</p>
                </div>
              ) : (
                <div className="relative">
                  <textarea 
                    title="Brouillon de la réponse de l'IA"
                    value={generatedAction}
                    onChange={e => setGeneratedAction(e.target.value)}
                    className="w-full h-64 border border-line bg-[#FAFAF7] font-medium p-4 rounded-2xl text-sm text-ink focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none resize-none custom-scrollbar"
                  />
                  <div className="pt-4 flex justify-between items-center">
                    <span className="text-xs uppercase font-bold text-dust">
                      Ce brouillon peut être copié et utilisé directement.
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedAction);
                        // toast UI could go here
                      }}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30"
                    >
                      Copier le texte
                    </button>
                  </div>
                </div>
              )}
            </div>
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
