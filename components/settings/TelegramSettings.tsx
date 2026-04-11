'use client'

/**
 * /components/settings/TelegramSettings.tsx
 * Composant client pour la gestion de l'intégration Telegram.
 * Permet de lier un compte, de gérer les notifications et de se déconnecter.
 */

import { useState, useEffect } from 'react'
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Bell, 
  Clock, 
  ExternalLink, 
  Loader2, 
  RefreshCcw,
  ShoppingBag,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  LogOut
} from 'lucide-react'
import { updateTelegramNotifications } from '@/app/actions/settings'
import { toast } from '@/lib/toast'

interface TelegramSettingsProps {
  initialChatId: string | null
  initialNotifications: {
    orders: boolean
    payments: boolean
    whatsapp: boolean
    stock: boolean
  }
  storeId: string
}

export function TelegramSettings({ 
  initialChatId, 
  initialNotifications, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  storeId 
}: TelegramSettingsProps) {
  void storeId // reserved for future use
  // États de connexion
  const [isConnected, setIsConnected] = useState(!!initialChatId) // eslint-disable-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_chatId, setChatId] = useState(initialChatId)
  
  // États du token de liaison
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [botUrl, setBotUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  
  // États UI
  const [isLoading, setIsLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // États des notifications
  const [notifications, setNotifications] = useState(initialNotifications)

  // Gestion du compte à rebours pour le token
  useEffect(() => {
    if (!expiresAt) return

    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0) {
        clearInterval(interval)
        setToken(null) // On invalide visuellement le token expiré
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  // Formater le temps restant en MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Action : Générer un nouveau token de liaison
  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/telegram/link', { method: 'POST' })
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      
      setToken(data.token)
      setExpiresAt(new Date(data.expiresAt))
      setBotUrl(data.botUrl)
      toast.success('Code généré ! Suivez les instructions.')
    } catch (error) {
      toast.error('Erreur lors de la génération du code')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Action : Déconnecter le compte Telegram
  const handleDisconnect = async () => {
    if (!confirm('Voulez-vous vraiment déconnecter votre compte Telegram ?')) return
    
    setIsLoading(true)
    try {
      const res = await fetch('/api/telegram/link', { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur réseau')
      
      setIsConnected(false)
      setChatId(null)
      setToken(null)
      toast.success('Compte Telegram déconnecté')
    } catch {
      toast.error('Erreur lors de la déconnexion')
    } finally {
      setIsLoading(false)
    }
  }

  // Action : Sauvegarder les préférences de notification
  const handleToggleNotif = async (key: keyof typeof notifications) => {
    const newNotifs = { ...notifications, [key]: !notifications[key] }
    setNotifications(newNotifs)
    setIsSaving(true)
    
    try {
      await updateTelegramNotifications(newNotifs)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
      setNotifications(notifications) // Revert
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1A1A1A] border border-[#2A2A2A] shadow-2xl xl:col-span-3">
      {/* 🌟 Background Effects Héroïques 🌟 */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
      
      {/* Texture Grain Subtile */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none hidden sm:block"></div>

      <div className="relative z-10 flex flex-col md:flex-row">
        
        {/* Colonne de Gauche : Le Pitch */}
        <div className="p-8 sm:p-12 md:w-5/12 lg:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.01]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-black tracking-widest border border-emerald-500/20 w-fit mb-6">
            <Send size={14} /> TÉLÉGRAM BOT
          </div>
          
          <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-[1.1] mb-5">
            Vos alertes,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">en temps réel.</span>
          </h3>
          
          <p className="text-gray-400 text-[14px] font-medium leading-relaxed mb-8">
            Connectez votre boutique de façon sécurisée à l'application Telegram. Ne ratez aucune vente, réceptionnez les reçus instantanément.
          </p>

          {!isConnected ? (
            <div className="flex items-center gap-3 text-red-400 text-[13px] font-bold bg-red-500/10 px-4 py-3 rounded-2xl border border-red-500/20">
              <XCircle size={18} /> Hors ligne
            </div>
          ) : (
            <div className="flex items-center gap-3 text-emerald-400 text-[13px] font-bold bg-emerald-500/10 px-4 py-3 rounded-2xl border border-emerald-500/20">
              <CheckCircle2 size={18} /> Connecté et Actif
            </div>
          )}
        </div>

        {/* Colonne de Droite : Interactions */}
        <div className="p-8 sm:p-12 md:w-7/12 lg:w-2/3 flex flex-col justify-center bg-gray-900/40 backdrop-blur-2xl">
          
          {!isConnected ? (
            <div className="max-w-md mx-auto w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {!token ? (
                <div className="text-center space-y-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#0F7A60]/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgb(16,185,129,0.15)] border border-white/5 relative">
                    <div className="absolute inset-2 bg-gradient-to-br from-[#0F7A60]/40 to-emerald-500/40 rounded-full animate-ping opacity-20"></div>
                    <Send size={40} className="text-emerald-400" />
                  </div>
                  
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-[#0F7A60] to-emerald-500 hover:from-[#0D5C4A] hover:to-emerald-600 text-white rounded-[1.2rem] font-bold text-[15px] shadow-[0_8px_30px_rgb(16,185,129,0.25)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02]"
                  >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    Générer le code de liaison
                  </button>
                </div>
              ) : (
                <div className="bg-black/40 border border-gray-700/50 rounded-[2rem] p-8 space-y-8 relative overflow-hidden backdrop-blur-md">
                   <div className="text-center space-y-3 relative z-10">
                    <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Votre code unique</p>
                    <div className="font-mono text-5xl sm:text-6xl font-black text-white tracking-widest py-2">
                      {token}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[12px] font-bold text-amber-400 bg-amber-900/30 border border-amber-700/50 px-4 py-2 rounded-full w-fit mx-auto mt-4">
                      <Clock size={16} className="animate-pulse" />
                      {timeLeft > 0 ? (
                        <span>Expire dans : <b className="font-black text-white">{formatTime(timeLeft)}</b></span>
                      ) : (
                        <span className="text-red-400">Code expiré</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 pt-2 relative z-10">
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                      <p className="text-[13px] text-gray-300 font-medium leading-loose">
                        <span className="inline-flex w-5 h-5 items-center justify-center bg-emerald-500 text-white rounded-full text-[10px] font-black mr-2">1</span> Ouvrez <b className="text-white">@Yayyam_bot</b> sur Telegram<br/>
                        <span className="inline-flex w-5 h-5 items-center justify-center bg-emerald-500 text-white rounded-full text-[10px] font-black mr-2">2</span> Envoyez : <code className="bg-black/50 px-2 py-1 rounded-lg border border-[#2A2A2A] text-emerald-400 font-mono shadow-inner select-all">/start {token}</code>
                      </p>
                    </div>
                    
                    {timeLeft > 0 ? (
                      <a
                        href={botUrl || 'https://t.me/Yayyam_bot'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-white text-black rounded-2xl font-black text-[15px] text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgb(255,255,255,0.15)] hover:scale-[1.02] hover:bg-gray-100 transition-all"
                      >
                        Ouvrir l'application Telegram <ExternalLink size={18} />
                      </a>
                    ) : (
                      <button
                        onClick={handleConnect}
                        className="w-full py-4 border border-gray-600 text-gray-300 rounded-2xl font-bold text-[14px] text-center flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                      >
                        <RefreshCcw size={18} /> Générer un nouveau code
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[16px] font-black text-white flex items-center gap-2">
                  <Bell size={18} className="text-emerald-400" /> Flux d'informations
                </h4>
                {saveSuccess && (
                  <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full animate-in fade-in duration-300">
                    SAUVEGARDÉ ✓
                  </span>
                )}
              </div>

              {/* Grille de préférences en mode sombre */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ToggleOptionDark
                  icon={<ShoppingBag size={18} strokeWidth={1.5} />}
                  label="Achats"
                  description="Confirmation instantanée de commande."
                  checked={notifications.orders}
                  onChange={() => handleToggleNotif('orders')}
                />
                <ToggleOptionDark
                  icon={<CreditCard size={18} strokeWidth={1.5} />}
                  label="Paiements"
                  description="Réception des fonds."
                  checked={notifications.payments}
                  onChange={() => handleToggleNotif('payments')}
                />
                <ToggleOptionDark
                  icon={<MessageCircle size={18} strokeWidth={1.5} />}
                  label="Messages"
                  description="Nouveaux WA entrants."
                  checked={notifications.whatsapp}
                  onChange={() => handleToggleNotif('whatsapp')}
                />
                <ToggleOptionDark
                  icon={<AlertTriangle size={18} strokeWidth={1.5} />}
                  label="Inventaire"
                  description="Stocks sous contrôle."
                  checked={notifications.stock}
                  onChange={() => handleToggleNotif('stock')}
                />
              </div>

              <div className="pt-6 border-t border-gray-800 flex justify-end">
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="px-5 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 group"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />}
                  Révoquer l'accès
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Sous-composant Switch/Toggle Dark Mode ---

interface ToggleProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: () => void
}

function ToggleOptionDark({ icon, label, description, checked, onChange }: ToggleProps) {
  return (
    <div 
      className={`group flex items-center justify-between p-4 rounded-[1.2rem] transition-all cursor-pointer border ${
        checked 
          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_8px_30px_rgb(16,185,129,0.1)]' 
          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10'
      }`} 
      onClick={onChange}
    >
      <div className="flex gap-4 items-center">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
          checked ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgb(16,185,129,0.5)] scale-110' : 'bg-white/5 text-gray-500'
        }`}>
          {icon}
        </div>
        <div>
          <p className={`text-[14px] font-bold leading-tight mb-0.5 ${checked ? 'text-white' : 'text-gray-300'}`}>{label}</p>
          <p className="text-[11px] text-gray-500 font-medium leading-normal">{description}</p>
        </div>
      </div>
      
      <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-500 focus:outline-none ${
        checked ? 'bg-emerald-500' : 'bg-white/10'
      }`}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-500 shadow-sm ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </div>
  )
}
