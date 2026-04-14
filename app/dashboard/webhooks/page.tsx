'use client'

import { useState, useEffect } from 'react'
import { Webhook, Trash2, Link as LinkIcon, Loader2, Code2, AlertTriangle, Blocks, CheckCircle2, Copy, Send, Settings2, Activity, Check } from 'lucide-react'
import { getWebhooksAction, createWebhookAction, deleteWebhookAction, testWebhookAction } from './actions'

// Helper to determine platform based on URL
function getPlatformInfo(url: string) {
  if (url.includes('zapier.com') || url.includes('_via=zapier')) return { name: 'Zapier', logo: 'https://cdn.simpleicons.org/zapier/FF4A00', color: 'orange' }
  if (url.includes('make.com') || url.includes('integromat.com') || url.includes('_via=make')) return { name: 'Make', logo: 'https://cdn.simpleicons.org/make/512194', color: 'purple' }
  if (url.includes('notion.com') || url.includes('notion.so') || url.includes('_via=notion')) return { name: 'Notion', logo: 'https://cdn.simpleicons.org/notion/000000', color: 'gray' }
  if (url.includes('n8n.io') || url.includes('n8n.cloud') || url.includes('_via=n8n')) return { name: 'n8n', logo: 'https://cdn.simpleicons.org/n8n/EA4E43', color: 'red' }
  return { name: 'Personnalisée / Autre', logo: null, color: 'violet' }
}

const AVAILABLE_EVENTS = [
  { id: 'order.created', icon: '💳', title: 'Nouvel Achat', desc: 'Lancé lors d\'un paiement réussi' },
  { id: 'order.delivered', icon: '🚚', title: 'Livraison Validée', desc: 'Lancé quand le coursier livre' },
  { id: 'customer.created', icon: '👥', title: 'Nouveau Lead', desc: 'Lancé à la création d\'un client' },
  { id: 'checkout.abandoned', icon: '🛒', title: 'Panier Abandonné', desc: 'Déclenche une relance automatique' },
  { id: 'refund.processed', icon: '💸', title: 'Remboursement', desc: 'Alerte lors d\'un remboursement' },
  { id: 'product.created', icon: '📦', title: 'Nouveau Produit', desc: 'Ajout catalogue ou mise à jour' }
]

const PLATFORMS = [
  { id: 'auto', name: 'Auto (Reconnaissance)', logo: null },
  { id: 'zapier', name: 'Zapier', logo: 'https://cdn.simpleicons.org/zapier/FF4A00' },
  { id: 'make', name: 'Make', logo: 'https://cdn.simpleicons.org/make/512194' },
  { id: 'notion', name: 'Notion', logo: 'https://cdn.simpleicons.org/notion/000000' }
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  const [newUrl, setNewUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['order.created'])
  const [selectedPlatform, setSelectedPlatform] = useState<string>('auto')
  
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{id: string, success: boolean, msg: string} | null>(null)

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      setLoading(true)
      const res = await getWebhooksAction()
      if (res.success) {
        setWebhooks(res.webhooks || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const toggleEvent = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
       // Empêcher de tout décocher
       if (selectedEvents.length === 1) return
       setSelectedEvents(selectedEvents.filter(id => id !== eventId))
    } else {
       setSelectedEvents([...selectedEvents, eventId])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl) return
    if (!newUrl.startsWith('http')) {
      setError('L\'URL doit commencer par http:// ou https://')
      return
    }

    setCreating(true)
    setError('')

    // Append platform as query param if explicitly selected and not present
    let finalUrl = newUrl
    if (selectedPlatform !== 'auto' && !newUrl.includes('_via=')) {
      const sep = finalUrl.includes('?') ? '&' : '?'
      finalUrl = `${finalUrl}${sep}_via=${selectedPlatform}`
    }

    const eventString = selectedEvents.join(',') // order.created,customer.created
    const res = await createWebhookAction(finalUrl, eventString)
    
    if (res.success && res.webhook) {
      setWebhooks([res.webhook, ...webhooks])
      setNewUrl('')
      setSelectedEvents(['order.created'])
      setSelectedPlatform('auto')
    } else {
      setError(res.error || 'Erreur lors de la création')
    }
    setCreating(false)
  }

  const handleDelete = async (id: string) => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: 'Voulez-vous vraiment supprimer ce webhook ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (!result.isConfirmed) return
    const res = await deleteWebhookAction(id)
    if (res.success) {
      setWebhooks(webhooks.filter(w => w.id !== id))
    }
  }

  const handleTest = async (id: string, url: string) => {
    setTestingId(id)
    setTestResult(null)
    const res = await testWebhookAction(url)
    setTestingId(null)
    setTestResult({
      id,
      success: res.success,
      msg: res.success ? 'Ping envoyé avec succès ! (200 OK)' : (res.error || 'Échec du test')
    })
    setTimeout(() => setTestResult(null), 5000)
  }

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-ink opacity-50" />
        <p className="text-gray-500 font-bold animate-pulse">Initialisation du moteur d'automatisation...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-ink text-white p-10 lg:p-14 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-[#0F7A60]/30 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8 justify-between">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-gradient-to-br from-[#0F7A60] to-emerald-900 rounded-[2rem] shadow-xl shadow-[#0F7A60]/30 border border-white/10">
              <Blocks size={40} className="text-white drop-shadow-md" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-black tracking-widest uppercase mb-3 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connexions en temps réel
              </div>
              <h1 className="text-xl lg:text-3xl font-black text-white tracking-tight mb-2">Automatisations & API</h1>
              <p className="text-gray-400 font-medium text-lg max-w-2xl">Associez votre compte Yayyam aux outils que vous utilisez tous les jours (Make, Zapier, Notion) pour scaler sans effort.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 min-w-[200px] bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10"><Activity size={60} /></div>
             <p className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center">Trafic Actif</p>
             <p className="text-4xl font-black text-emerald-400 text-center">{webhooks.length} <span className="text-lg text-gray-500">/ 5 cibles</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
         {/* Formulaire de création */}
         <div className="lg:col-span-5 xl:col-span-4 space-y-6 flex flex-col">
            <div className="bg-white p-8 rounded-[2rem] border border-line shadow-xl shadow-gray-200/50 relative overflow-hidden group hover:border-[#0F7A60]/30 transition-colors">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F7A60]/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
               
               <h2 className="text-xl font-black text-ink mb-6 flex items-center gap-3 relative z-10">
                 <div className="w-10 h-10 bg-[#0F7A60]/10 text-[#0F7A60] rounded-xl flex items-center justify-center">
                    <Settings2 size={20} />
                 </div>
                 Configurer une cible
               </h2>

               <form onSubmit={handleCreate} className="space-y-6 relative z-10">
                 {error && <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 font-medium flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}</div>}
                 
                 {/* SOURCE (Plateforme) */}
                 <div className="space-y-3">
                    <label className="block text-xs font-black text-slate uppercase tracking-wider pl-1">Application de Destination</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {PLATFORMS.map(p => (
                         <div 
                           key={p.id}
                           onClick={() => setSelectedPlatform(p.id)}
                           className={`cursor-pointer border-2 rounded-2xl flex flex-col items-center justify-center p-3 gap-2 transition-all ${selectedPlatform === p.id ? 'border-[#0F7A60] bg-[#0F7A60]/5 shadow-sm' : 'border-line hover:border-gray-300 bg-[#FAFAF7]'}`}
                         >
                            {p.logo ? (
                               <img src={p.logo} alt={p.name} className={`w-6 h-6 object-contain ${selectedPlatform !== p.id ? 'grayscale opacity-50' : ''}`} />
                            ) : (
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${selectedPlatform === p.id ? 'bg-[#0F7A60] text-white' : 'bg-gray-200 text-gray-500'}`}>A</div>
                            )}
                            <span className={`text-xs font-bold text-center ${selectedPlatform === p.id ? 'text-[#0F7A60]' : 'text-gray-500'}`}>{p.name}</span>
                         </div>
                      ))}
                    </div>
                 </div>

                 {/* URL */}
                 <div className="space-y-2">
                    <label className="block text-xs font-black text-slate uppercase tracking-wider pl-1">Lien du Webhook (URL)</label>
                    <div className="relative group/input">
                       <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-[#0F7A60] transition-colors" size={18} />
                       <input 
                         type="url"
                         placeholder="https://hooks.zapier.com/..."
                         value={newUrl}
                         onChange={e => setNewUrl(e.target.value)}
                         className="w-full bg-[#FAFAF7] border-2 border-line rounded-2xl pl-12 pr-5 py-4 text-sm font-medium focus:border-[#0F7A60] focus:bg-white focus:ring-4 focus:ring-[#0F7A60]/10 outline-none transition-all placeholder:text-gray-300"
                       />
                    </div>
                    {/* Auto-detect info si Auto */}
                    {selectedPlatform === 'auto' && newUrl && (
                      <div className="pl-2 pt-2 flex items-center gap-2 text-xs font-bold text-gray-500">
                         <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A60]"></span>
                         Identifié automatiquement : <span className="text-ink">{getPlatformInfo(newUrl).name}</span>
                      </div>
                    )}
                 </div>

                 {/* MULTIPLES EVENEMENTS */}
                 <div className="space-y-3">
                    <label className="block text-xs font-black text-slate uppercase tracking-wider pl-1">Évènements à écouter</label>
                    <div className="flex flex-col gap-2">
                       {AVAILABLE_EVENTS.map(evt => {
                          const isActive = selectedEvents.includes(evt.id)
                          return (
                             <div 
                               key={evt.id} 
                               onClick={() => toggleEvent(evt.id)}
                               className={`cursor-pointer border-2 rounded-2xl p-4 flex gap-4 transition-all ${isActive ? 'border-[#0F7A60] bg-[#0F7A60]/5 shadow-sm' : 'border-line hover:border-gray-300 bg-[#FAFAF7]'}`}
                             >
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isActive ? 'bg-[#0F7A60] border-[#0F7A60]' : 'border-gray-300 bg-white'}`}>
                                   {isActive && <Check size={14} className="text-white" />}
                                </div>
                                <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                     <span className="text-sm">{evt.icon}</span>
                                     <span className={`text-sm font-black ${isActive ? 'text-ink' : 'text-slate'}`}>{evt.title}</span>
                                   </div>
                                   <p className="text-xs text-gray-500 font-medium">{evt.desc}</p>
                                </div>
                             </div>
                          )
                       })}
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={creating || !newUrl}
                   className="w-full bg-ink text-white font-black py-4 rounded-2xl hover:bg-black hover:shadow-xl hover:shadow-black/20 transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2 text-sm mt-2"
                 >
                   {creating ? <Loader2 size={18} className="animate-spin" /> : 'Créer l\'intégration'}
                 </button>
               </form>
            </div>

         </div>

         {/* Liste des webhooks */}
         <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
               <h2 className="text-2xl font-black text-ink flex items-center gap-3">
                  Vos Intégrations Actives
               </h2>
               <span className="bg-[#FAFAF7] border border-line text-xs font-bold text-slate px-3 py-1.5 rounded-full inline-flex items-center gap-2 w-fit">
                 Ping : Temps Réel
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               </span>
            </div>

            {webhooks.length === 0 ? (
               <div className="flex-1 bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-inner z-10">
                     <Webhook size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-black text-ink mb-2 z-10">Aucun flux de données</h3>
                  <p className="text-slate font-medium max-w-md mx-auto leading-relaxed mb-8 z-10">Enregistrez une URL pour commencer à envoyer automatiquement des informations vers l'extérieur (comptabilité, factures automatisées, notion).</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {webhooks.map(wh => {
                     const platform = getPlatformInfo(wh.url)
                     const whEvents = wh.event.split(',') // Split if multiple events
                     
                     return (
                     <div key={wh.id} className="bg-white border hover:border-[#0F7A60]/30 border-line rounded-[2rem] p-6 lg:p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl hover:shadow-[#0F7A60]/5 transition-all group">
                        
                        <div className="flex items-start lg:items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-[#FAFAF7] flex items-center justify-center shrink-0 border border-line shadow-sm overflow-hidden p-2">
                                {platform.logo ? (
                                   <img src={platform.logo} alt={platform.name} className="w-full h-full object-contain" />
                                ) : (
                                   <Webhook size={28} className="text-[#0F7A60]" />
                                )}
                              </div>
                              <div>
                                 <h4 className="text-base font-black text-ink mb-2">{platform.name}</h4>
                                 <div className="flex flex-wrap items-center gap-2">
                                    {whEvents.map((evtName: string) => (
                                       <span key={evtName} className="bg-ink text-white text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                                          {evtName}
                                       </span>
                                    ))}
                                    {wh.active && (
                                      <span className="flex items-center gap-1.5 text-xs font-black text-[#0F7A60] uppercase tracking-widest bg-[#0F7A60]/10 px-2 py-1 rounded-md">
                                        <div className="w-1.5 h-1.5 bg-[#0F7A60] rounded-full animate-pulse"></div> En Ligne
                                      </span>
                                    )}
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-center gap-2">
                              <button 
                                 onClick={() => handleTest(wh.id, wh.url)}
                                 disabled={testingId === wh.id}
                                 className="h-10 px-4 bg-[#FAFAF7] border border-line text-slate hover:bg-[#0F7A60] hover:text-white hover:border-[#0F7A60] rounded-xl flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50"
                                 title="Envoyer un test factice"
                              >
                                 {testingId === wh.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                 <span className="hidden sm:inline">Tester (Ping)</span>
                              </button>
                              <button 
                                 onClick={() => handleDelete(wh.id)}
                                 className="h-10 w-10 bg-white border border-line text-gray-400 hover:bg-red-500 hover:border-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                                 title="Supprimer l'intégration"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </div>

                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-[#FAFAF7] to-transparent z-10 rounded-l-xl pointer-events-none"></div>
                           <p className="font-mono text-xs sm:text-sm text-gray-600 truncate bg-[#FAFAF7] px-5 py-4 rounded-xl border border-line flex-1 relative group/copy cursor-pointer transition-colors hover:bg-gray-50" onClick={() => copyToClipboard(wh.url, wh.id)}>
                             {wh.url.replace('&_via=zapier', '').replace('_via=zapier', '').replace('?_via=make', '').replace('&_via=make', '')} {/* Clean display */}
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 sm:w-8 sm:h-8 px-2 sm:px-0 flex items-center justify-center bg-white border border-line rounded-lg shadow-sm opacity-0 group-hover/copy:opacity-100 transition-opacity whitespace-nowrap">
                               {copiedId === wh.id ? <><CheckCircle2 size={14} className="text-emerald-500 sm:mr-0 mr-1" /><span className="sm:hidden text-xs font-bold text-emerald-600">Copié</span></> : <><Copy size={14} className="text-gray-400 sm:mr-0 mr-1" /><span className="sm:hidden text-xs font-bold text-gray-500">Copier</span></>}
                             </span>
                           </p>
                        </div>
                        
                        {/* Affichage résultat du test ping */}
                        {testResult && testResult.id === wh.id && (
                           <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                              {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                              {testResult.msg}
                           </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs font-bold text-slate">
                           <span>Création : {new Date(wh.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span className="text-gray-400">ID: {wh.id.split('-')[0]}</span>
                        </div>
                     </div>
                  )})}
               </div>
            )}

            {/* Doc Technique - Fixe en bas de la deuxieme colonne */}
            <div className="mt-8 bg-[#1A1A1A] p-8 rounded-[2rem] border border-[#333] shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Code2 size={100} />
               </div>
               <h3 className="font-black text-white text-sm flex items-center gap-2 mb-4 relative z-10">
                 <Webhook size={18} className="text-emerald-400" /> Structure du Payload Webhook (POST)
               </h3>
               <div className="bg-[#0D0D0D] p-4 rounded-2xl border border-white/5 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed relative z-10 custom-scrollbar">
<pre>{`{
  "event": "order.created",
  "data": {
    "order_id": "ord_12345",
    "amount": 25000,
    "buyer": {
      "name": "Jean Dupont",
      "phone": "+22177...",
      "address": "Dakar"
    },
    "product": "Offre VIP Coaching"
  }
}`}</pre>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
