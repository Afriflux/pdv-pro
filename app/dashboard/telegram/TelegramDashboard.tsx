'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ──────────────────────────────────────────────────────────────────
interface TelegramCommunity {
  id: string
  chat_id: string
  chat_title: string
  chat_type: 'group' | 'supergroup' | 'channel'
  product_id: string | null
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
function StatCard({ label, value, emoji }: { label: string; value: number | string; emoji: string }) {
  return (
    <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{emoji}</span>
        <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
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

  // État local pour le linking de produits (optimiste)
  const [productLinks, setProductLinks] = useState<Record<string, string>>({})
  useEffect(() => {
    const links: Record<string, string> = {}
    communities.forEach(c => {
      if (c.product_id) links[c.id] = c.product_id
    })
    setProductLinks(links)
  }, [communities])

  // État pour le Flow de Connexion
  const [step, setStep] = useState<ConnectStep>('idle')
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
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
      if (!res.ok) throw new Error(data.error)
      setCode(data.code)
      setExpiresAt(data.expires_at)
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
      setError('Erreur de vérification')
    }
  }

  // Action : Supprimer
  const deleteCommunity = async (communityId: string) => {
    if (!confirm('Supprimer cette communauté ? Le groupe Telegram ne sera pas supprimé.')) return
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
      // Revert if error
      router.refresh()
    } else {
      router.refresh()
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-10">
      
      {/* SECTION 1 — Hero/Stats */}
      <div className="bg-gradient-to-br from-[#0F7A60] to-emerald-700 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-emerald/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔐</span>
            <h1 className="text-2xl md:text-3xl font-black">Communautés Telegram</h1>
          </div>
          {step === 'idle' && (
            <button
              onClick={handleGenerateCode}
              className="hidden md:flex bg-white text-[#0F7A60] px-5 py-2.5 rounded-xl text-sm font-black hover:bg-emerald-50 transition-colors items-center gap-2"
            >
              <span>+</span> Nouveau groupe
            </button>
          )}
        </div>
        <p className="text-emerald-100 text-sm md:text-base mb-8 max-w-2xl">
          Vendez l&apos;accès à vos groupes privés. Vos clients reçoivent automatiquement 
          leur invitation VIP par WhatsApp et email juste après leur achat.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Groupes actifs" value={communities.filter(c => c.is_active).length} emoji="💬" />
          <StatCard label="Membres total" value={communities.reduce((s, c) => s + (c.members_count || 0), 0)} emoji="👥" />
          <StatCard label="Invitations envoyées" value={recentAccess.length} emoji="📨" />
          <StatCard label="Produits liés" value={communities.filter(c => c.product_id).length} emoji="🔗" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* SECTION 2 — Liste des communautés & Flow de connexion */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between md:hidden">
            <h2 className="text-xl font-black text-ink">Mes groupes</h2>
            {step === 'idle' && (
              <button onClick={handleGenerateCode} className="bg-[#0F7A60] text-white px-4 py-2 rounded-lg text-sm font-bold">
                + Nouveau
              </button>
            )}
          </div>

          {/* Flow de connexion (le même que l'ancien onglet) */}
          {(step !== 'idle') && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6 border-l-4 border-l-[#0F7A60]">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-[#1A1A1A]">Connecter un groupe</h3>
                <button onClick={resetFlow} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              {step === 'generating' && (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-8 h-8 border-3 border-[#0F7A60] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-gray-500">Génération d&apos;un code sécurisé…</span>
                </div>
              )}

              {step === 'waiting' && code && (
                <div className="space-y-6">
                  {/* Étape 1 */}
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 bg-[#0F7A60]/10 text-[#0F7A60] rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm">1</div>
                    <div className="pt-1">
                      <p className="font-bold text-sm text-[#1A1A1A]">Ajoutez @PDVProBot comme administrateur</p>
                      <p className="text-xs text-gray-500 mt-1">Permission requise : Inviter des utilisateurs</p>
                    </div>
                  </div>

                  {/* Étape 2 */}
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 bg-[#0F7A60]/10 text-[#0F7A60] rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm">2</div>
                    <div className="flex-1 space-y-3 pt-1">
                      <p className="font-bold text-sm text-[#1A1A1A]">Envoyez ce code dans le groupe :</p>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <code className="flex-1 font-mono text-sm text-[#1A1A1A] font-black px-2">
                          /connect {code}
                        </code>
                        <button
                          onClick={copyCode}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            copied ? 'bg-[#0F7A60] text-white shadow-sm' : 'bg-white border shadow-sm text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {copied ? '✓ Copié' : '📋 Copier'}
                        </button>
                      </div>
                      <p className={`text-xs font-bold flex items-center gap-1.5 ${
                        remaining < 120_000 ? 'text-orange-500' : 'text-gray-400'
                      }`}>
                        <span className="animate-pulse">⏱️</span> Expire dans {countdown}
                      </p>
                    </div>
                  </div>

                  {/* Étape 3 */}
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm">3</div>
                    <div className="flex-1 pt-1">
                      <p className="font-bold text-sm text-[#1A1A1A] mb-3">Patientez quelques secondes...</p>
                      <button
                        onClick={verifyConnection}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors w-full"
                      >
                        Vérifier manuellement
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-8 space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-4xl text-emerald-600">✅</span>
                  </div>
                  <div>
                    <p className="font-black text-xl text-[#1A1A1A]">Groupe connecté !</p>
                    <p className="text-sm text-gray-500 mt-2">Votre groupe Telegram est prêt à être lié à un produit.</p>
                  </div>
                  <button
                    onClick={resetFlow}
                    className="bg-[#0F7A60] hover:bg-[#0D6B53] text-white px-8 py-3 rounded-xl font-black mt-4 shadow-lg shadow-emerald/20 transition-all"
                  >
                    Terminer
                  </button>
                </div>
              )}

              {step === 'error' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">❌</span>
                  </div>
                  <p className="font-bold text-red-600">{error}</p>
                  <button
                    onClick={handleGenerateCode}
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold"
                  >
                    Générer un nouveau code
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Liste des communautés existantes */}
          {communities.length > 0 ? (
            <div className="space-y-4">
              {communities.map(c => (
                <div key={c.id} className="bg-white rounded-3xl border border-line p-5 shadow-sm hover:shadow-md transition-all hover:border-emerald/20 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none group-hover:scale-150 transition-transform duration-500 ease-out" />
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                        <span className="text-2xl">{c.chat_type === 'channel' ? '📢' : '💬'}</span>
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-ink leading-tight">{c.chat_title}</h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                            {c.chat_type}
                          </span>
                          <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                            <span className="text-[10px]">👥</span> {c.members_count} membres
                          </span>
                          {c.is_active && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Actif
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteCommunity(c.id)}
                      disabled={deleting === c.id}
                      className="text-white hover:text-red-500 bg-red-50 hover:bg-red-100 text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 self-end sm:self-center"
                      title="Déconnecter le groupe"
                    >
                      {deleting === c.id ? '...' : (
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Lier le produit */}
                  <div className="mt-5 pt-4 border-t border-gray-100 relative z-10 bg-gray-50/50 -mx-5 -mb-5 p-5 rounded-b-3xl">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      Produit lié (Donne accès)
                    </label>
                    <select
                      value={productLinks[c.id] || c.product_id || ''}
                      onChange={(e) => linkProduct(c.id, e.target.value || null)}
                      className="w-full text-sm font-medium border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0F7A60] bg-white transition-colors"
                    >
                      <option value="">— Aucun produit sélectionné —</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.type === 'digital' ? '📦' : '🛍️'} {p.name} — {p.price.toLocaleString('fr-FR')} F
                        </option>
                      ))}
                    </select>
                    {productLinks[c.id] && (
                      <p className="text-[11px] text-[#0F7A60] font-bold mt-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Les acheteurs de ce produit seront ajoutés automatiquement.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : step === 'idle' ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <span className="text-5xl opacity-40">📭</span>
              </div>
              <p className="font-black text-xl text-ink">Aucun groupe connecté</p>
              <p className="text-gray-500 mt-2 max-w-sm">
                Vous n&apos;avez pas encore connecté de communauté Telegram. Cliquez sur &quot;Nouveau groupe&quot; pour commencer.
              </p>
            </div>
          ) : null}
        </div>

        {/* Côté Droit : Historique & Comment ça marche */}
        <div className="space-y-6">
          
          {/* SECTION 3 — Historique d'accès */}
          <div className="bg-white rounded-3xl border border-line p-6 shadow-sm">
            <h2 className="font-black text-lg text-ink mb-5 flex items-center gap-2">
              <span className="text-xl">📨</span> Dernières invitations
            </h2>
            {recentAccess.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                Aucune invitation envoyée.
                <br /><span className="text-xs">Liez un produit et attendez une vente !</span>
              </p>
            ) : (
              <div className="space-y-3">
                {recentAccess.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-sm hover:border-emerald/20 border border-transparent transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-lg">
                        📱
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink">{a.buyer_phone}</p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {new Date(a.sent_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-black uppercase tracking-wider shrink-0 shadow-sm border border-emerald-200">
                      ✓ Envoyée
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4 — Guide pas-à-pas */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
            <h2 className="font-black text-lg text-blue-900 mb-5 relative z-10 flex items-center gap-2">
              <span className="text-xl">📖</span> Comment ça marche ?
            </h2>
            <div className="space-y-4 relative z-10">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs shrink-0 shadow-inner">1</div>
                <div className="pt-1.5">
                  <p className="font-bold text-sm text-blue-900 leading-tight">Créez votre groupe Telegram</p>
                  <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">Groupe privé ou canal, ajoutez @PDVProBot comme admin pour qu&apos;il puisse inviter vos clients.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs shrink-0 shadow-inner">2</div>
                <div className="pt-1.5">
                  <p className="font-bold text-sm text-blue-900 leading-tight">Connectez & Liez un produit</p>
                  <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">Générez un code ici et choisissez le produit payant qui donnera l&apos;accès au groupe.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs shrink-0 shadow-inner">3</div>
                <div className="pt-1.5">
                  <p className="font-bold text-sm text-blue-900 leading-tight">Le client reçoit l&apos;accès</p>
                  <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">Après son achat, un lien unique et sécurisé lui est envoyé par WhatsApp et email automatiquement.</p>
                </div>
              </div>
            </div>
            
            {/* Call to action for help */}
            <a href="https://wa.me/221770000000" target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-600 hover:text-white border-2 border-blue-100 hover:border-blue-600 text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm">
              💬 Une question ? Support PDV Pro
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
