'use client'

import { useState } from 'react'
import { Zap, Settings, Clock, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

export default function NotificationsClient({ initialConfig }: { initialConfig: Record<string, string> }) {
  const [config, setConfig] = useState(initialConfig)
  const [saving, setSaving] = useState(false)

  const channels = [
    {
      key: 'notif_whatsapp_active',
      name: 'WhatsApp Business',
      icon: '💬',
      description: 'Notifications transactionnelles via Meta WhatsApp Business API',
      features: ['Confirmation commande', 'Suivi livraison', 'Rappels paiement', 'Support client'],
    },
    {
      key: 'notif_email_active',
      name: 'Email (Brevo)',
      icon: '📧',
      description: 'Campagnes marketing et newsletters via Brevo',
      features: ['Campaigns email', 'Séquences automatisées', 'Templates personnalisés', 'Analytics'],
    },
    {
      key: 'notif_telegram_active',
      name: 'Telegram Bot',
      icon: '🤖',
      description: 'Communauté vendeurs et alertes via Telegram Bot',
      features: ['Groupe communauté', 'Alertes ventes', 'Vérification auto', 'Broadcast'],
    },
    {
      key: 'notif_push_active',
      name: 'Push PWA',
      icon: '🔔',
      description: 'Notifications push navigateur via Service Worker (PWA)',
      features: ['Nouvelle commande', 'Promotion flash', 'Rappel panier abandonné', 'Alertes prix'],
    },
  ]

  const automations = [
    { key: 'auto_welcome', name: 'Bienvenue Vendeur', trigger: 'Inscription vendeur', channel: 'WhatsApp', delay: 'Immédiat' },
    { key: 'auto_abandoned_cart', name: 'Panier Abandonné', trigger: 'Checkout non complété', channel: 'WhatsApp', delay: '30 min' },
    { key: 'auto_order_confirm', name: 'Confirmation Commande', trigger: 'Paiement validé', channel: 'WhatsApp + Email', delay: 'Immédiat' },
    { key: 'auto_review_reminder', name: 'Rappel Avis', trigger: 'Commande livrée', channel: 'WhatsApp', delay: '48h' },
  ]

  const handleToggle = async (key: string) => {
    const newVal = config[key] === 'true' ? 'false' : 'true'
    const newConfig = { ...config, [key]: newVal }
    setConfig(newConfig)
    
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { [key]: newVal } })
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Paramètre mis à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
      setConfig(config) // revert
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Channels */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Zap size={20} className="text-emerald-500" /> Canaux de Communication
          </h2>
          {saving && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {channels.map(ch => {
            const isActive = config[ch.key] === 'true'
            return (
              <div key={ch.name} className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all hover:border-emerald-200 group relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ch.icon}</span>
                    <h3 className="font-black text-gray-900 text-sm">{ch.name}</h3>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button 
                    onClick={() => handleToggle(ch.key)}
                    className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-6' : ''}`} />
                  </button>
                  
                </div>
                <p className="text-xs text-gray-500 mb-4">{ch.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {ch.features.map(f => (
                    <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-bold border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Automations */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <Settings size={20} className="text-emerald-500" /> Automatisations Actives
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FAFAF7]">
                <th className="text-left px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Automatisation</th>
                <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Déclencheur</th>
                <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Canal</th>
                <th className="text-center px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Délai</th>
                <th className="text-center px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Activer</th>
              </tr>
            </thead>
            <tbody>
              {automations.map(auto => {
                const isActive = config[auto.key] === 'true'
                return (
                  <tr key={auto.name} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-8 py-4 font-bold text-gray-900">{auto.name}</td>
                    <td className="px-4 py-4 text-gray-500 text-xs">{auto.trigger}</td>
                    <td className="px-4 py-4 text-xs font-bold text-gray-600">{auto.channel}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} /> {auto.delay}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => handleToggle(auto.key)}
                        className={`relative w-10 h-5 rounded-full transition-colors mx-auto block ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-5' : ''}`} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
