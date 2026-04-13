'use client'

import React, { useState } from 'react'
import { BellRing, PackageX, CalendarClock } from 'lucide-react'
import { toast } from '@/lib/toast'

export function NotificationsTab({ store }: { store: any }) {
  const [notifs, setNotifs] = useState({
    whatsapp: store?.notif_new_order ?? true,
    weekly: store?.notif_weekly_report ?? false,
    stock: store?.notif_stock_alert ?? true
  })

  const handleSaveField = async (field: string, value: string) => {
    try {
      const res = await fetch('/api/settings/update-field', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      })
      if (!res.ok) throw new Error('Erreur sauvegarde')
      toast.success('Préférence synchronisée')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleToggle = (key: 'whatsapp' | 'weekly' | 'stock', dbField: string, val: boolean) => {
    setNotifs(n => ({ ...n, [key]: val }))
    handleSaveField(dbField, String(val))
  }

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
      
      {/* En-tête du module */}
      <div className="flex flex-col gap-2 relative z-10 px-2 pt-2">
        <h2 className="text-xl lg:text-3xl font-black text-gray-900 tracking-tight">Centre de Notifications</h2>
        <p className="text-[15px] font-medium text-gray-500 max-w-xl leading-relaxed">
          Configurez comment et quand Yayyam communique avec vous. Contrôlez vos alertes système et l'intégration externe.
        </p>
      </div>

      {/* Cartes d'alertes système en grille */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <ToggleSystemCard 
          title="Nouvelles Commandes"
          description="Recevez un retour sonore et une pastille clignotante en temps réel."
          icon={<BellRing size={24} strokeWidth={1.5} className={notifs.whatsapp ? 'animate-bounce' : ''} />}
          colorTheme="emerald"
          checked={notifs.whatsapp}
          onChange={(val) => handleToggle('whatsapp', 'notif_new_order', val)}
        />
        <ToggleSystemCard 
          title="Alerte Stock Bas"
          description="Soyez averti immédiatement quand un produit atteint un seuil critique."
          icon={<PackageX size={24} strokeWidth={1.5} />}
          colorTheme="amber"
          checked={notifs.stock}
          onChange={(val) => handleToggle('stock', 'notif_stock_alert', val)}
        />
        <ToggleSystemCard 
          title="Rapport Hebdo"
          description="Un récapitulatif ultra-clair de vos performances chaque Lundi à 8h."
          icon={<CalendarClock size={24} strokeWidth={1.5} />}
          colorTheme="indigo"
          checked={notifs.weekly}
          onChange={(val) => handleToggle('weekly', 'notif_weekly_report', val)}
        />
      </div>
    </div>
  )
}

// --- Nouveau Composant: Carte d'alerte système Ultra-Premium ---

interface ToggleSystemCardProps {
  title: string
  description: string
  icon: React.ReactNode
  colorTheme: 'emerald' | 'amber' | 'indigo'
  checked: boolean
  onChange: (val: boolean) => void
}

function ToggleSystemCard({ title, description, icon, colorTheme, checked, onChange }: ToggleSystemCardProps) {
  // Styles dynamiques basés sur le thème de couleur
  const themeStyles = {
    emerald: {
      glow: 'bg-emerald-400/20',
      iconActive: 'bg-gradient-to-br from-[#0F7A60] to-emerald-400 text-white shadow-emerald-900/20',
      switchBg: 'bg-[#0F7A60]',
      borderActive: 'border-[#0F7A60]/30 shadow-[0_12px_40px_rgb(15,122,96,0.1)]'
    },
    amber: {
      glow: 'bg-amber-400/20',
      iconActive: 'bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-amber-900/20',
      switchBg: 'bg-amber-500',
      borderActive: 'border-amber-500/30 shadow-[0_12px_40px_rgb(245,158,11,0.1)]'
    },
    indigo: {
      glow: 'bg-emerald-400/20',
      iconActive: 'bg-gradient-to-br from-emerald-500 to-blue-500 text-white shadow-emerald-900/20',
      switchBg: 'bg-emerald-600',
      borderActive: 'border-emerald-500/30 shadow-[0_12px_40px_rgb(99,102,241,0.1)]'
    }
  }[colorTheme]

  return (
    <div 
      onClick={() => onChange(!checked)}
      className={`relative overflow-hidden group cursor-pointer transition-all duration-500 rounded-[2rem] border ${
        checked 
          ? `${themeStyles.borderActive} bg-white/95` 
          : 'border-gray-200/60 bg-white/40 shadow-sm hover:shadow-md hover:bg-white/80 backdrop-blur-md hover:border-gray-300'
      } p-6 sm:p-8 flex flex-col justify-between h-full min-h-[240px]`}
    >
      {/* Halo lumineux en arrière-plan */}
      <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[45px] transition-all duration-700 pointer-events-none ${
        checked ? `${themeStyles.glow} opacity-100` : 'opacity-0'
      }`}></div>

      <div className="flex justify-between items-start w-full relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
          checked 
            ? `${themeStyles.iconActive} shadow-xl` 
            : 'bg-gray-100/80 text-gray-400'
        }`}>
          {icon}
        </div>
        
        {/* Switch style iOS */}
        <div className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-500 shadow-inner ${
          checked ? themeStyles.switchBg : 'bg-gray-200/80'
        }`}>
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-500 shadow-md ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </div>
      </div>

      <div className="text-left mt-8 relative z-10">
        <h4 className="text-[17px] font-black text-gray-900 tracking-tight leading-tight mb-2">
          {title}
        </h4>
        <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}
