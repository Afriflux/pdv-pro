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
import { toast } from 'sonner'

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
  const [_chatId, setChatId] = useState(initialChatId)
  
  // États du token de liaison
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [botUrl, setBotUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  
  // États UI
  const [isLoading, setIsLoading] = useState(false)
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
    } catch (error) {
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
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
      setNotifications(notifications) // Revert
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 bg-[#FAFAF7]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center text-[#0F7A60]">
              <Send size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Intégration Telegram</h3>
              <p className="text-sm text-gray-500">Recevez vos alertes de vente en temps réel</p>
            </div>
          </div>
          
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
              <CheckCircle2 size={14} /> Connecté
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 text-gray-500 rounded-full text-xs font-bold">
              <XCircle size={14} /> Non connecté
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Section Liaison */}
        {!isConnected ? (
          <div className="space-y-6">
            {!token ? (
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <ExternalLink size={32} className="text-[#0F7A60] opacity-30" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <p className="text-sm text-gray-600">
                    Connectez votre boutique à notre bot <b>@PDVProBot</b> pour ne rater aucune commande.
                  </p>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="px-6 py-3 bg-[#0F7A60] hover:bg-[#0D6A53] text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-900/10 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Connecter Telegram
                </button>
              </div>
            ) : (
              <div className="bg-[#FAFAF7] border-2 border-dashed border-gray-200 rounded-3xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Votre code de liaison</p>
                  <div className="font-mono text-5xl font-black text-[#0F7A60] tracking-tighter py-4">
                    {token}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full w-fit mx-auto">
                    <Clock size={14} />
                    {timeLeft > 0 ? (
                      <span>⏱️ Expire dans : <b>{formatTime(timeLeft)}</b></span>
                    ) : (
                      <span>Code expiré</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-6">
                  <p className="text-sm text-center text-gray-600">
                    1. Ouvrez <b>@PDVProBot</b> sur Telegram<br/>
                    2. Envoyez le message : <code>/start {token}</code>
                  </p>
                  
                  {timeLeft > 0 ? (
                    <a
                      href={botUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 bg-[#0F7A60] text-white rounded-2xl font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-transform"
                    >
                      Ouvrir dans Telegram <ExternalLink size={16} />
                    </a>
                  ) : (
                    <button
                      onClick={handleConnect}
                      className="w-full py-4 border border-emerald-600 text-emerald-600 rounded-2xl font-bold text-center flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
                    >
                      <RefreshCcw size={16} /> Générer un nouveau code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <Send size={16} /> Votre compte est lié
              </p>
              <p className="text-xs text-emerald-700 opacity-80">
                Vous recevez vos notifications sur l&apos;application Telegram.
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              Déconnecter
            </button>
          </div>
        )}

        {/* Section Préférences */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-[#C9A84C]" />
              <h4 className="font-bold text-gray-900">Préférences de notification</h4>
            </div>
            {saveSuccess && (
              <span className="text-[10px] font-black text-emerald-600 animate-pulse uppercase tracking-wider">
                Sauvegardé ✓
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToggleOption
              icon={<ShoppingBag size={18} />}
              label="Nouvelles commandes"
              description="Alertes instantanées dès qu'un client achète."
              checked={notifications.orders}
              onChange={() => handleToggleNotif('orders')}
            />
            <ToggleOption
              icon={<CreditCard size={18} />}
              label="Paiements confirmés"
              description="Confirmation de réception des fonds (Wave, Orange Money...)"
              checked={notifications.payments}
              onChange={() => handleToggleNotif('payments')}
            />
            <ToggleOption
              icon={<MessageCircle size={18} />}
              label="Messages WhatsApp"
              description="Notifications lors de nouveaux messages entrants."
              checked={notifications.whatsapp}
              onChange={() => handleToggleNotif('whatsapp')}
            />
            <ToggleOption
              icon={<AlertTriangle size={18} />}
              label="Stock faible"
              description="Alertes quand un produit descend sous le seuil critique."
              checked={notifications.stock}
              onChange={() => handleToggleNotif('stock')}
            />
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest leading-relaxed">
          Propulsé par le Bot PDV Pro — Sécurisé par chiffrement de bout en bout
        </p>
      </div>
    </div>
  )
}

// --- Sous-composant Switch/Toggle ---

interface ToggleProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: () => void
}

function ToggleOption({ icon, label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition-all cursor-pointer" onClick={onChange}>
      <div className="flex gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
          checked ? 'bg-[#0F7A60]/10 text-[#0F7A60]' : 'bg-gray-100 text-gray-400'
        }`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{label}</p>
          <p className="text-[11px] text-gray-500 leading-tight">{description}</p>
        </div>
      </div>
      
      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-[#0F7A60]' : 'bg-gray-200'
      }`}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </div>
  )
}
