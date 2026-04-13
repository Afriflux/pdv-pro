'use client'

import React, { useState } from 'react'
import { Save, Plus, Trash2, GripVertical, Phone, MessageSquare, Briefcase, HelpCircle, Store, Zap, Smartphone, UserCog } from 'lucide-react'
import { toast } from '@/lib/toast'
import { saveWhatsAppAgents } from './actions'

export interface WhatsAppAgent {
  id: string
  name: string
  desc: string
  phone: string
  color: string
  prefix: string
  iconName: string
}

const ICONS = [
  { name: 'help', icon: HelpCircle, label: 'Support / Aide' },
  { name: 'store', icon: Store, label: 'Boutique' },
  { name: 'briefcase', icon: Briefcase, label: 'Direction / Partenariats' },
  { name: 'zap', icon: Zap, label: 'Éclair / Urgence' },
  { name: 'phone', icon: Phone, label: 'Standard Local' },
]

const COLORS = [
  { label: 'Yayyam Émeraude', value: 'bg-[#0F7A60]/10 text-[#0F7A60]' },
  { label: 'Bleu Indigo', value: 'bg-indigo-50 text-indigo-600' },
  { label: 'Orange Ambré', value: 'bg-amber-50 text-amber-600' },
  { label: 'Rose Rubis', value: 'bg-rose-50 text-rose-600' },
  { label: 'Or Premium', value: 'bg-[#C9A84C]/10 text-[#C9A84C]' },
]

export default function WhatsAppDashboardClient({ initialAgents }: { initialAgents: WhatsAppAgent[] }) {
  const [agents, setAgents] = useState<WhatsAppAgent[]>(initialAgents.length > 0 ? initialAgents : [
    { 
      id: 'default-1', 
      name: 'Support Clients', 
      desc: 'Assistance, commandes & plaintes.', 
      phone: '221776581741', 
      color: 'bg-[#0F7A60]/10 text-[#0F7A60]', 
      prefix: 'Bonjour Yayyam 👋 J\'ai besoin d\'aide avec une commande.',
      iconName: 'help'
    }
  ])
  const [isSaving, setIsSaving] = useState(false)

  const handleAddAgent = () => {
    setAgents([
      ...agents,
      {
        id: `agent-${Date.now()}`,
        name: 'Nouveau Service',
        desc: 'Description courte.',
        phone: '221776581741',
        color: COLORS[0].value,
        prefix: 'Bonjour 👋',
        iconName: 'store'
      }
    ])
  }

  const handleRemoveAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id))
  }

  const handleChange = (id: string, field: keyof WhatsAppAgent, value: string) => {
    setAgents(agents.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { success, error } = await saveWhatsAppAgents(JSON.stringify(agents))
      if (success) {
        toast.success("Répertoire mis à jour avec succès ! Les modifications sont en ligne.")
      } else {
        toast.error("Échec de la sauvegarde : " + error)
      }
    } catch {
      toast.error("Erreur serveur.")
    }
    setIsSaving(false)
  }

  return (
    <div className="flex-1 w-full bg-[#FAFAF7] min-h-screen p-6 lg:p-10 animate-in fade-in duration-500">
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center border border-green-200">
              <MessageSquare size={24} className="fill-green-600 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Répertoire WhatsApp</h1>
              <p className="text-sm font-bold text-gray-500 mt-1">Gérez le widget d'équipe affiché en bas à droite du site.</p>
            </div>
          </div>

          <button 
            onClick={handleAddAgent}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-100 hover:border-[#0F7A60] hover:text-[#0F7A60] rounded-xl text-sm font-black transition-all shadow-sm"
          >
            <Plus size={16} /> Ajouter un profil
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-black-[0.02]">
          <div className="space-y-6">
            {agents.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <UserCog size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-500">Aucun agent configuré.</p>
                <p className="text-xs text-gray-400 mt-1">Le widget sera invisible sur le site.</p>
              </div>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="relative bg-gray-50 border border-gray-100 p-6 rounded-2xl group hover:border-[#0F7A60]/30 transition-all">
                  <div className="absolute top-6 left-4 text-gray-300 cursor-move opacity-50 hidden md:block">
                    <GripVertical size={20} />
                  </div>
                  
                  <button 
                    onClick={() => handleRemoveAgent(agent.id)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-red-100 text-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                    title="Supprimer ce profil"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="md:pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nom */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5">Nom du Service / Agent</label>
                      <input 
                        type="text" 
                        value={agent.name}
                        onChange={(e) => handleChange(agent.id, 'name', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#0F7A60]/20"
                        placeholder="Ex: Support Technique"
                      />
                    </div>
                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5">Numéro (Format Inter. sans +)</label>
                      <div className="relative">
                        <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          value={agent.phone}
                          onChange={(e) => handleChange(agent.id, 'phone', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#0F7A60]/20"
                          placeholder="221701234567"
                        />
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5">Sous-titre / Description</label>
                      <input 
                        type="text" 
                        value={agent.desc}
                        onChange={(e) => handleChange(agent.id, 'desc', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[#0F7A60]/20"
                        placeholder="Ex: Gestion des plaintes et réclamations"
                      />
                    </div>

                     {/* Message pré-rempli */}
                     <div className="md:col-span-2">
                      <label className="block text-xs font-black uppercase tracking-widest text-[#0F7A60] mb-1.5">Message d'accroche Automatique</label>
                      <input 
                        type="text" 
                        value={agent.prefix}
                        onChange={(e) => handleChange(agent.id, 'prefix', e.target.value)}
                        className="w-full bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#0F7A60] outline-none focus:ring-2 focus:ring-[#0F7A60]/20"
                        placeholder="Bonsoir, j'ai une question urgente..."
                      />
                    </div>

                    {/* Apparence */}
                    <div className="flex items-center gap-3 md:col-span-2 mt-2">
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5">Couleur du profil</label>
                        <select 
                          title="Couleur du profil"
                          aria-label="Couleur du profil"
                          value={agent.color}
                          onChange={(e) => handleChange(agent.id, 'color', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 max-h-10 text-xs font-bold text-gray-900 outline-none"
                        >
                          {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5">Icône</label>
                        <select 
                          title="Icône du profil"
                          aria-label="Icône du profil"
                          value={agent.iconName}
                          onChange={(e) => handleChange(agent.id, 'iconName', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 max-h-10 text-xs font-bold text-gray-900 outline-none"
                        >
                          {ICONS.map(i => <option key={i.name} value={i.name}>{i.label}</option>)}
                        </select>
                      </div>
                      
                      {/* Preview mini */}
                      <div className="w-16 h-10 mt-5 border border-dashed border-gray-300 rounded-xl flex items-center justify-center shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${agent.color}`}>
                           {(() => {
                             const I = ICONS.find(ic => ic.name === agent.iconName)?.icon || HelpCircle
                             return <I size={16}/>
                           })()}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
             <div className="text-xs font-bold text-gray-400">
                {agents.length} agent(s) configuré(s)
             </div>
             <button
               disabled={isSaving}
               onClick={handleSave}
               className="flex items-center gap-2 px-8 py-3 bg-[#0F7A60] hover:bg-emerald-800 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50"
             >
               <Save size={18} /> {isSaving ? "Sauvegarde..." : "Publier en direct"}
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
