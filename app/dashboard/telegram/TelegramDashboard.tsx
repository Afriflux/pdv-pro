// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send, Users, MailCheck, Link as LinkIcon, Plus, CheckCircle2,
  AlertCircle, Copy, Clock, RefreshCw, X, ShieldCheck, ChevronRight, MessageSquare, Trash2, Megaphone
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────
interface TelegramCommunity {
  id: string
  chat_id: string
  chat_title: string
  chat_type: 'group' | 'supergroup' | 'channel'
  product_id: string | null
  welcome_message?: string | null
  is_active: boolean
  members_count: number
  created_at: string
}

interface StoreProduct {
  id: string
  name: string
  type: string
  price: number
}

interface TelegramDashboardProps {
  store: {
    id: string
    name: string
    slug: string
    telegram_chat_id: string | null
  }
  communities: TelegramCommunity[]
  products: StoreProduct[]
  recentAccess: {
    id: string
    buyer_phone: string
    sent_at: string
  }[]
}

type ConnectStep = 'idle' | 'generating' | 'waiting' | 'success' | 'error'

// ─── StatCard Helper ───────────────────────────────────────────────────────
function StatCard({ label, value, icon, glowColor }: { label: string; value: number | string; icon: React.ReactNode; glowColor: string }) {
  return (
    <div className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${glowColor}`} />
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className={`p-2 rounded-xl bg-white/10 text-white`}>
          {icon}
        </div>
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-black text-white relative z-10">{value}</p>
    </div>
  )
}

// ─── Hook Countdown ────────────────────────────────────────────────────────
function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    if (!expiresAt) { setRemaining(0); return }
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      setRemaining(Math.max(0, diff))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return { remaining, display: `${mins}:${secs.toString().padStart(2, '0')}` }
}

// ─── Composant Principal ───────────────────────────────────────────────────
export default function TelegramDashboard({
  store,
  communities,
  products,
  recentAccess
}: TelegramDashboardProps) {
  const router = useRouter()

  // État local pour le linking de produits et les messages de bienvenue
  const [productLinks, setProductLinks] = useState<Record<string, string>>({})
  const [welcomeMessages, setWelcomeMessages] = useState<Record<string, string>>({})
  const [savingWelcome, setSavingWelcome] = useState<string | null>(null)

  useEffect(() => {
    const links: Record<string, string> = {}
    const messages: Record<string, string> = {}
    communities.forEach(c => {
      if (c.product_id) links[c.id] = c.product_id
      if (c.welcome_message) messages[c.id] = c.welcome_message
    })
    setProductLinks(links)
    setWelcomeMessages(messages)
  }, [communities])

  // État pour le Flow de Connexion
  const [step, setStep] = useState<ConnectStep>('idle')
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedBot, setCopiedBot] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [wizardStep, setWizardStep] = useState<number>(2)
  
  // État pour le "Mode Broadcast"
  const [broadcastTarget, setBroadcastTarget] = useState<string | null>(null)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const { remaining, display: countdown } = useCountdown(expiresAt)

  // Nettoyage Polling
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  // Action : Générer Code
  const handleGenerateCode = async () => {
    setStep('generating')
    setError(null)
    try {
      const res = await fetch('/api/telegram/community/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: store.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue')
      setCode(data.code)
      setExpiresAt(data.expires_at)
      setWizardStep(1)
      setStep('waiting')
      startPolling(data.code)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setStep('error')
    }
  }

  // Action : Auto-polling
  const startPolling = (pollCode: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    let elapsed = 0
    pollingRef.current = setInterval(async () => {
      elapsed += 5000
      if (elapsed > 120_000) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        return
      }
      try {
        const res = await fetch(
          `/api/telegram/community/verify?store_id=${store.id}&code=${pollCode}`
        )
        const data = await res.json()
        if (data.linked) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setStep('success')
          router.refresh()
        }
      } catch { /* silence */ }
    }, 5000)
  }

  // Action : Vérification manuelle
  const verifyConnection = async () => {
    if (!code) return
    try {
      const res = await fetch(
        `/api/telegram/community/verify?store_id=${store.id}&code=${code}`
      )
      const data = await res.json()
      if (data.linked) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        setStep('success')
        router.refresh()
      } else if (data.expired) {
        setError('Code expiré. Générez un nouveau code.')
        setStep('error')
      }
    } catch {
      setError('Erreur de vérification côté serveur.')
    }
  }

  // Action : Supprimer
  const deleteCommunity = async (communityId: string) => {
    if (!confirm('Déconnecter ce groupe ? Le groupe Telegram ne sera pas supprimé, mais vos clients ne recevront plus d\'invitation.')) return
    setDeleting(communityId)
    try {
      await fetch('/api/telegram/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ community_id: communityId }),
      })
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  // Action : Lier Produit
  async function linkProduct(communityId: string, productId: string | null) {
    setProductLinks(prev => ({ ...prev, [communityId]: productId || '' }))
    const res = await fetch('/api/telegram/community', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ community_id: communityId, product_id: productId || null })
    })
    if (!res.ok) {
      router.refresh()
    } else {
      router.refresh()
    }
  }

  // Sauvegarder le message de bienvenue
  const saveWelcomeMessage = async (communityId: string) => {
    setSavingWelcome(communityId)
    try {
      await fetch('/api/telegram/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          community_id: communityId, 
          welcome_message: welcomeMessages[communityId] || null 
        })
      })
      router.refresh()
    } catch {
      // Erreur silencieuse
    } finally {
      setSavingWelcome(null)
    }
  }

  // Action : Copier code
  const copyCode = () => {
    if (!code) return
    navigator.clipboard.writeText(`/connect ${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Reset
  const resetFlow = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setStep('idle')
    setCode(null)
    setExpiresAt(null)
    setError(null)
  }

  // Action : Diffuser un message
  const sendBroadcast = async () => {
    if (!broadcastTarget || !broadcastMessage.trim()) return
    setBroadcasting(true)
    try {
      const res = await fetch('/api/telegram/community/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ community_id: broadcastTarget, message: broadcastMessage })
      })
      if (!res.ok) throw new Error('Erreur diffusion')
      setBroadcastTarget(null)
      setBroadcastMessage('')
      alert("✅ Message diffusé avec succès sur Telegram !")
    } catch {
      alert("❌ Échec de l'envoi du message.")
    } finally {
      setBroadcasting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* ─── HERO AERO ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#1A1A1A] rounded-[2rem] p-6 lg:p-10 shadow-2xl">
        {/* Effets de lumière / Glassmorphism */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0DE0A1] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0DE0A1]"></span>
              </span>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Connecteur Telegram Actif</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight flex items-center gap-3">
              <Send className="text-[#0DE0A1] drop-shadow-[0_0_15px_rgba(13,224,161,0.5)]" fill="currentColor" size={40} />
              Communautés VIP
            </h1>
            <p className="text-white/70 font-medium max-w-xl text-sm leading-relaxed">
              Monétisez l'accès à vos canaux et groupes privés. Chaque client reçoit un lien unique et sécurisé par WhatsApp juste après son paiement.
            </p>
          </div>

          {step === 'idle' && (
            <button
              onClick={handleGenerateCode}
              className="group bg-white hover:bg-emerald-50 text-[#1A1A1A] px-6 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              <Plus size={20} className="text-[#0F7A60] group-hover:scale-110 transition-transform" />
              Connecter un Groupe
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 relative z-10">
          <StatCard label="Groupes" value={communities.filter(c => c.is_active).length} icon={<MessageSquare size={18} />} glowColor="bg-blue-500" />
          <StatCard label="Membres" value={communities.reduce((s, c) => s + (c.members_count || 0), 0)} icon={<Users size={18} />} glowColor="bg-purple-500" />
          <StatCard label="Invitations" value={recentAccess.length} icon={<MailCheck size={18} />} glowColor="bg-emerald-500" />
          <StatCard label="Liens Actifs" value={communities.filter(c => c.product_id).length} icon={<LinkIcon size={18} />} glowColor="bg-orange-500" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* ─── GAUCHE : ASSISTANT DE CONNEXION / LISTE DES GROUPES ─── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ASSISTANT DE CONNEXION (WIZARD) */}
          {(step !== 'idle') && (
            <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-2xl shadow-emerald-900/10 relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
              {step === 'generating' && (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-100 rounded-full" />
                    <div className="w-20 h-20 border-4 border-[#0F7A60] border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                    <ShieldCheck size={28} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#0F7A60]" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xl text-[#1A1A1A]">Génération du jeton sécurisé...</p>
                    <p className="text-sm text-slate-500 font-medium mt-2">Création d'un canal de communication chiffré</p>
                  </div>
                </div>
              )}

              {step === 'waiting' && code && (
                <div className="flex flex-col md:flex-row min-h-[450px]">
                  {/* ── Sidebar Explicative ── */}
                  <div className="md:w-2/5 bg-slate-50/50 p-8 lg:p-10 border-r border-slate-100 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                      <ShieldCheck size={250} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex gap-2 mb-8">
                        <span className={`h-1.5 rounded-full flex-1 transition-colors duration-500 ${wizardStep >= 1 ? 'bg-[#0DE0A1]' : 'bg-slate-200'}`} />
                        <span className={`h-1.5 rounded-full flex-1 transition-colors duration-500 ${wizardStep >= 2 ? 'bg-[#0DE0A1]' : 'bg-slate-200'}`} />
                      </div>
                      
                      <h3 className="font-black text-2xl lg:text-3xl text-[#1A1A1A] mb-4 tracking-tight">
                        {wizardStep === 1 ? "Préparation du Bot" : "Liaison Sécurisée"}
                      </h3>
                      
                      <p className="text-slate-500 font-medium text-[15px] leading-relaxed">
                        {wizardStep === 1 
                          ? "@PDVProBot agit comme le gardien exclusif de votre groupe Telegram. Il gérera de façon autonome les entrées de vos clients (génération de liens uniques) et les expulsions à la fin de leurs abonnements ou au remboursement."
                          : "Afin de s'assurer que vous êtes bien le propriétaire légitime du groupe, le bot doit recevoir une 'commande secrète'. Notre système est actuellement branché et scrute vos messages pour valider l'appairage en direct."}
                      </p>
                    </div>

                    <button onClick={resetFlow} className="text-slate-400 hover:text-red-500 text-sm font-bold flex items-center gap-2 mt-8 w-fit transition-colors relative z-10">
                      <X size={16} /> Annuler la procédure
                    </button>
                  </div>

                  {/* ── Contenu Interactif (Page) ── */}
                  <div className="md:w-3/5 p-8 lg:p-12 flex flex-col justify-center relative bg-white">
                    {wizardStep === 1 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-start gap-4 text-[#0F7A60] bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 flex-shrink-0 mt-0.5">
                            <ShieldCheck size={24} />
                          </div>
                          <p className="font-bold text-[15px] leading-snug">Ajoutez le compte <span className="font-mono bg-white px-2 py-0.5 rounded shadow-sm text-[#1A1A1A]">@PDVProBot</span> à votre groupe et nommez-le <b>Administrateur</b>.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 text-[15px] text-slate-600 bg-white p-4 border border-slate-100 shadow-sm rounded-xl">
                            <span className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center font-black text-sm shrink-0">1</span>
                            Ouvrez les paramètres administrateur de votre groupe
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-[15px] bg-blue-50 p-5 border-2 border-blue-200 shadow-md rounded-xl justify-between">
                            <div className="flex items-center gap-4">
                              <span className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">2</span>
                              <div className="font-bold text-blue-900">
                                Le plus important : Ajoutez le bot <br className="sm:hidden" />
                                <span className="font-black text-2xl text-blue-600 tracking-tight mt-1 inline-block selection:bg-blue-200">@PDVProBot</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText('@PDVProBot')
                                setCopiedBot(true)
                                setTimeout(() => setCopiedBot(false), 2000)
                              }}
                              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all w-full sm:w-auto justify-center ${
                                copiedBot ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white'
                              }`}
                            >
                              {copiedBot ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                              {copiedBot ? 'Nom copié !' : 'Copier'}
                            </button>
                          </div>

                          <div className="flex items-center gap-4 text-[15px] text-slate-600 bg-white p-4 border border-slate-100 shadow-sm rounded-xl">
                            <span className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center font-black text-sm shrink-0">3</span>
                            <div>Accordez-lui la permission <b className="text-[#1A1A1A]">"Inviter des utilisateurs"</b></div>
                          </div>
                        </div>

                        <button
                          onClick={() => setWizardStep(2)}
                          className="w-full mt-2 px-6 py-4 rounded-2xl bg-[#1A1A1A] font-display text-white text-base font-black shadow-xl shadow-black/10 hover:bg-black transition-all hover:-translate-y-1 flex items-center justify-between group"
                        >
                          C'est fait, le bot est administrateur !
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <ChevronRight size={18} />
                          </div>
                        </button>
                      </div>
                    )}

                    {wizardStep === 2 && (
                      <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="text-center space-y-3">
                          <h4 className="font-black text-2xl text-[#1A1A1A]">Envoyez la commande secrète</h4>
                          <p className="text-[15px] text-slate-500 font-medium mx-auto max-w-sm">Copiez ce code et postez-le dans votre groupe Telegram. Le message pourra être supprimé juste après.</p>
                        </div>
                        
                        <div className="flex flex-col items-center gap-5 bg-[#F8FAFC] p-8 rounded-[2rem] border border-[#E2E8F0] shadow-inner relative">
                          <code className="text-3xl lg:text-4xl font-mono font-black text-[#1A1A1A] tracking-wide selection:bg-[#0DE0A1]/30">
                            <span className="text-slate-400">/connect</span> <span className="text-[#0F7A60]">{code}</span>
                          </code>
                          
                          <button
                            onClick={copyCode}
                            className={`px-8 py-3.5 rounded-full text-[15px] font-black transition-all flex items-center gap-2.5 shadow-md ${
                              copied 
                                ? 'bg-[#0DE0A1] text-[#0F7A60] shadow-[#0DE0A1]/30 scale-105' 
                                : 'bg-white border-2 border-slate-200 text-[#1A1A1A] hover:border-[#0DE0A1] hover:shadow-lg'
                            }`}
                          >
                            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                            {copied ? 'Prenez place dans Telegram !' : 'Copier la commande'}
                          </button>
                        </div>

                        {/* Status Radar */}
                        <div className="flex flex-col items-center justify-center pt-8 border-t border-slate-100">
                          <div className="relative mb-4">
                            <div className="w-14 h-14 bg-emerald-50 text-[#0F7A60] rounded-full flex items-center justify-center shadow-inner relative z-10 border border-emerald-100">
                              <RefreshCw size={24} className="animate-spin" />
                            </div>
                            <span className="absolute inset-0 flex h-full w-full pointer-events-none">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0DE0A1] opacity-30"></span>
                            </span>
                          </div>
                          <p className="font-black text-lg text-[#1A1A1A]">Écoute en cours...</p>
                          <p className="text-sm text-slate-500 font-medium">L'écran se mettra à jour dans un instant.</p>
                          
                          <div className={`mt-5 flex items-center gap-2 text-xs font-bold w-fit px-4 py-2 rounded-full border shadow-sm ${
                            remaining < 120_000 ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-slate-500 border-slate-200 bg-slate-50'
                          }`}>
                            <Clock size={14} className={remaining < 120_000 ? 'animate-pulse' : ''} />
                            Code valide pour {countdown}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-10 space-y-5 animate-in zoom-in duration-500">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-emerald-400 animate-ping rounded-full opacity-20" />
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative z-10">
                      <CheckCircle2 className="text-white" size={40} />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-black text-3xl text-[#1A1A1A] tracking-tight">Appairage Réussi !</h2>
                    <p className="text-base text-slate-500 font-medium mt-2 max-w-sm mx-auto">Votre groupe Telegram est connecté et sécurisé.<br/>Il ne vous reste plus qu'à lier le produit d'accès.</p>
                  </div>
                  <button
                    onClick={resetFlow}
                    className="bg-[#1A1A1A] hover:bg-black text-white px-10 py-4 rounded-xl font-black mt-4 shadow-xl shadow-black/10 transition-all hover:-translate-y-1"
                  >
                    Fermer l'assistant
                  </button>
                </div>
              )}

              {step === 'error' && (
                <div className="text-center py-10 space-y-5">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="text-red-500" size={40} />
                  </div>
                  <p className="font-black text-xl text-red-600 max-w-md mx-auto">{error}</p>
                  <button
                    onClick={handleGenerateCode}
                    className="bg-[#1A1A1A] text-white px-8 py-3.5 rounded-xl text-sm font-black transition-transform hover:-translate-y-1"
                  >
                    Générer un nouveau code
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LISTE DES MESSAGES/GROUPES EXISTANTS */}
          {communities.length > 0 ? (
            <div className="space-y-5">
              <h2 className="font-black text-xl text-[#1A1A1A]">Groupes Connectés</h2>
              <div className="grid gap-5">
                {communities.map(c => (
                  <div key={c.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
                      
                      {/* Info Groupe */}
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 text-white">
                          <Send size={28} fill="currentColor" />
                        </div>
                        <div className="flex-1 w-full min-w-[200px]">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h3 className="font-black text-xl text-[#1A1A1A] leading-tight tracking-tight">{c.chat_title}</h3>
                            <button
                              onClick={() => setBroadcastTarget(c.id)}
                              className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                            >
                              <Megaphone size={14} /> Diffuser
                            </button>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                              {c.chat_type}
                            </span>
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                              <Users size={12} /> {c.members_count} membres
                            </span>
                            {c.is_active && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm border border-emerald-200">
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                </span>
                                Connecté
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Déconnecter */}
                      <button
                        onClick={() => deleteCommunity(c.id)}
                        disabled={deleting === c.id}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all disabled:opacity-50"
                        title="Déconnecter le groupe"
                      >
                        {deleting === c.id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>

                    {/* Lier le Produit (Premium Select) */}
                    <div className="mt-6 pt-5 border-t border-slate-100 relative">
                      <div className="flex items-center gap-2 mb-3">
                        <LinkIcon size={14} className="text-[#0F7A60]" />
                        <label className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest">
                          Produit d'accès (VIP)
                        </label>
                      </div>
                      <div className="relative group/select">
                        <select
                          title="Sélectionner le produit d'accès"
                          aria-label="Sélectionner le produit d'accès"
                          value={productLinks[c.id] || c.product_id || ''}
                          onChange={(e) => linkProduct(c.id, e.target.value || null)}
                          className="w-full text-base font-bold border border-slate-200 rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50 hover:bg-white transition-all text-[#1A1A1A] cursor-pointer"
                        >
                          <option value="">— Aucun produit sélectionné —</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.type === 'digital' ? '📦 Format Digital' : '🛍️ Format Physique'} — {p.name} ({p.price.toLocaleString('fr-FR')} F)
                            </option>
                          ))}
                        </select>
                        <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-emerald-500 transition-colors" />
                      </div>
                      {productLinks[c.id] && (
                        <div className="absolute top-5 right-0 bg-emerald-50 p-2 text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-2 border border-emerald-100 animate-in fade-in duration-300">
                          <CheckCircle2 size={14} /> Automatisé
                        </div>
                      )}
                    </div>

                    {/* Message de Bienvenue */}
                    <div className="mt-5 pt-5 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={14} className="text-blue-600" />
                          <label className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest">
                            Message de Bienvenue Automatique
                          </label>
                        </div>
                      </div>
                      <div className="relative group/textarea">
                        <textarea
                          title="Message de bienvenue"
                          aria-label="Message de bienvenue"
                          value={welcomeMessages[c.id] || ''}
                          onChange={(e) => setWelcomeMessages(prev => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="Bonjour {first_name} ! Bienvenue dans le groupe..."
                          className="w-full text-sm font-medium border border-slate-200 rounded-2xl px-5 py-4 min-h-[100px] resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all text-[#1A1A1A]"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => saveWelcomeMessage(c.id)}
                            disabled={savingWelcome === c.id || welcomeMessages[c.id] === c.welcome_message}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                              (welcomeMessages[c.id] || '') !== (c.welcome_message || '')
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {savingWelcome === c.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            {(welcomeMessages[c.id] || '') !== (c.welcome_message || '') ? 'Sauvegarder' : 'À jour'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : step === 'idle' ? (
            <div className="relative bg-gradient-to-br from-emerald-50 to-white rounded-[2rem] p-8 md:p-12 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-700 border border-emerald-100/50">
              {/* Effets d'arrière-plan */}
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0DE0A1]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                
                {/* Texte & Vente de la fonctionnalité */}
                <div className="md:w-1/2 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200/50 backdrop-blur-md">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0DE0A1] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0DE0A1]"></span>
                    </span>
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Nouveau Fonctionnement</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-5xl font-black text-[#1A1A1A] tracking-tight leading-tight">
                    Monétisez votre <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F7A60] to-emerald-500">Communauté VIP</span>
                  </h2>
                  
                  <p className="text-slate-600 font-medium text-base leading-relaxed">
                    Transformez vos groupes et canaux Telegram en espaces privés payants. PDV Pro gère automatiquement <b>l'ajout des membres via des liens uniques</b> et <b>leur expulsion</b> lorsque leur abonnement expire.
                  </p>
                  
                  <ul className="space-y-4 pt-2">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#0F7A60] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={14} strokeWidth={3} />
                      </div>
                      <p className="text-sm text-slate-700 font-medium"><b>100% Automatisé</b> : Ne gérez plus les ajouts et suppressions manuellement.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck size={14} strokeWidth={3} />
                      </div>
                      <p className="text-sm text-slate-700 font-medium"><b>Anti-Fuite</b> : Chaque invitation générée est à usage unique et liée à l'acheteur.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Users size={14} strokeWidth={3} />
                      </div>
                      <p className="text-sm text-slate-700 font-medium"><b>Rétention</b> : Gérez des abonnements hebdomadaires, mensuels ou annuels avec expulsion automatique à expiration.</p>
                    </li>
                  </ul>

                  <button
                    onClick={handleGenerateCode}
                    className="group bg-[#0DE0A1] hover:bg-emerald-400 text-[#0F7A60] px-8 py-4 rounded-2xl text-base font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/50 hover:shadow-xl hover:-translate-y-1 w-full sm:w-auto mt-4"
                  >
                    <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                    Connecter mon premier groupe
                  </button>
                </div>

                {/* Illustration Visuelle */}
                <div className="md:w-1/2 w-full max-w-sm mx-auto perspective-1000">
                  <div className="relative w-full aspect-square rotate-y-[-10deg] rotate-x-[10deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out">
                    {/* Fond UI Mockup */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl p-6 flex flex-col justify-between">
                      {/* En-tête Mockup */}
                      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                          <Send size={20} fill="white" className="text-white" />
                        </div>
                        <div>
                          <div className="h-3 w-24 bg-white/20 rounded-full mb-2"></div>
                          <div className="h-2 w-16 bg-emerald-400/50 rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Lignes de Chat Mockup */}
                      <div className="space-y-4 py-4 flex-1">
                        <div className="flex justify-start">
                          <div className="bg-white/10 rounded-2xl rounded-tl-sm p-3 w-3/4 animate-pulse">
                            <div className="h-2 w-full bg-white/20 rounded-full mb-2"></div>
                            <div className="h-2 w-2/3 bg-white/20 rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-[#0DE0A1]/20 rounded-2xl rounded-tr-sm p-3 w-2/3">
                            <div className="flex items-center gap-2 mb-2">
                              <ShieldCheck size={12} className="text-[#0DE0A1]" />
                              <div className="h-2 w-1/2 bg-[#0DE0A1]/50 rounded-full"></div>
                            </div>
                            <div className="h-2 w-full bg-white/30 rounded-full mb-1"></div>
                            <div className="h-2 w-4/5 bg-white/30 rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      {/* Notification Bubble */}
                      <div className="absolute -bottom-6 -left-6 bg-white text-[#1A1A1A] px-5 py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce border border-slate-100">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="font-black">+$</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500">Nouveau membre VIP</p>
                          <p className="font-black text-sm">Paiement reçu !</p>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : null}
        </div>

        {/* ─── DROITE : HISTORIQUE & AIDE ─── */}
        <div className="space-y-6 lg:sticky lg:top-8">
          
          {/* Historique "Wallet-like" */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-black text-sm text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-[#0F7A60]" /> Derniers Accès
              </h2>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">{recentAccess.length} Pilotes</span>
            </div>
            
            {recentAccess.length === 0 ? (
              <div className="p-10 text-center">
                <MailCheck size={32} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm font-medium">
                  Aucune invitation envoyée.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                {recentAccess.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                    <div>
                      <p className="text-sm font-black text-[#1A1A1A] mb-0.5 group-hover:text-[#0F7A60] transition-colors">{a.buyer_phone}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {new Date(a.sent_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guide Rapide (HelpCard) */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-3xl p-6 relative overflow-hidden">
            <h2 className="font-black text-sm text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck size={16} /> Comment ça marche ?
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-xs shrink-0 shadow-sm">1</div>
                <p className="text-xs text-blue-800 font-medium leading-relaxed pt-0.5">Le bot agit comme un portier pour générer des liens d'invitation à usage unique pour vos membres VIP.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-xs shrink-0 shadow-sm">2</div>
                <p className="text-xs text-blue-800 font-medium leading-relaxed pt-0.5">Liez un de vos groupes à un produit payant. Lorsqu'un client l'achète, le système déclenche l'invitation.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-xs shrink-0 shadow-sm">3</div>
                <p className="text-xs text-blue-800 font-medium leading-relaxed pt-0.5">L'accès est envoyé par WhatsApp automatiquement. Les clics et membres sont tracés ci-dessus.</p>
              </div>
            </div>
            
            <a href="https://wa.me/221770000000" target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-sm">
              <MessageSquare size={14} /> Contacter le Support
            </a>
          </div>

        </div>
      </div>

      {/* ─── MODAL DE DIFFUSION (BROADCAST) ────────────────────────────────────────────────────────── */}
      {broadcastTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !broadcasting && setBroadcastTarget(null)} />
          <div className="relative bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Megaphone size={20} />
                </div>
                <h3 className="font-black text-xl text-[#1A1A1A]">Diffuser une Annonce</h3>
              </div>
              <button 
                title="Fermer la modale"
                onClick={() => !broadcasting && setBroadcastTarget(null)}
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"
                disabled={broadcasting}
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 font-medium mb-6">
              Ce message sera envoyé immédiatement dans le groupe Telegram en tant que @PDVProBot.
            </p>

            <textarea
              title="Message à diffuser"
              aria-label="Message à diffuser"
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              placeholder="Rédigez votre annonce ici... Vous pouvez inclure des liens."
              className="w-full text-sm font-medium border border-slate-200 rounded-2xl px-5 py-4 min-h-[140px] resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all text-[#1A1A1A] mb-6"
            />
            
            <button
              title="Envoyer le message"
              onClick={sendBroadcast}
              disabled={broadcasting || !broadcastMessage.trim()}
              className="w-full bg-[#1A1A1A] hover:bg-black text-white px-5 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {broadcasting ? (
                <><RefreshCw size={18} className="animate-spin" /> Envoi en cours...</>
              ) : (
                <><Send size={18} /> Publier maintenant</>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
