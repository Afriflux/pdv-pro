'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Save, ExternalLink, Loader2, Eye, EyeOff, Activity, Copy, Clock, Beaker, AlertTriangle, TrendingUp, History } from 'lucide-react'
import type { IntegrationService } from './config'
import type { ConfigItem, ServiceStats } from './page'
import WebhookSetupModal from './WebhookSetupModal'

interface Props {
  service: IntegrationService
  configMap: Record<string, ConfigItem>
  stats?: ServiceStats
}

// Fonction utilitaire pour le masquage
function maskValueInline(val: string): string {
  if (!val) return ''
  if (val.length <= 8) return '••••••••'
  return `${val.slice(0, 4)}••••••••${val.slice(-4)}`
}

export default function ServiceCard({ service, configMap, stats }: Props) {
  const router = useRouter()
  const hasTestKeys = service.fields.some(f => !!f.testKey)
  const [isSandbox, setIsSandbox] = useState(false)
  
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({})
  const [revealingKey, setRevealingKey] = useState<string | null>(null)
  const [pinging, setPinging] = useState(false)
  const [isLivePinged, setIsLivePinged] = useState(false)
  const [isModalOpen, setIsModalOpen]   = useState(false)

  const hasRecentLogs = stats && stats.recentLogs && stats.recentLogs.length > 0
  const isNetworkLive = hasRecentLogs || isLivePinged

  const activeFields = (isSandbox ? service.fields.filter(f => f.testKey) : service.fields).map(f => ({
    ...f,
    actualKey: (isSandbox && f.testKey) ? f.testKey : f.key
  }))

  const isPartiallyConfigured = activeFields.some(f => !!configMap[f.actualKey]?.value)
  const lastUpdatedRaw = activeFields.map(f => configMap[f.actualKey]?.updatedAt).filter(Boolean).sort().reverse()[0]
  const formattedDate = lastUpdatedRaw 
    ? new Date(lastUpdatedRaw).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null
  const updatedByKey = activeFields.find(f => configMap[f.actualKey]?.updatedAt === lastUpdatedRaw)?.actualKey
  const lastAuthor = updatedByKey ? configMap[updatedByKey]?.updatedBy : null

  const handleChange = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  const handleSave = async () => {
    const payloadToSave: Record<string, string> = {}
    let hasChanges = false
    
    for (const f of activeFields) {
      if (formData[f.actualKey] !== undefined && formData[f.actualKey].trim() !== '') {
        payloadToSave[f.actualKey] = formData[f.actualKey].trim()
        hasChanges = true
      }
    }

    if (!hasChanges) {
      toast.info('Veuillez remplir au moins un champ pour sauvegarder.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/integrations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payloadToSave })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success(`${service.name} sauvegardé avec succès !`)
      setFormData({}) // Reset form
      setRevealedKeys({})
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleReveal = async (key: string) => {
    if (revealedKeys[key]) {
      const newReveals = {...revealedKeys}
      delete newReveals[key]
      setRevealedKeys(newReveals)
      return
    }
    
    setRevealingKey(key)
    try {
      const res = await fetch('/api/admin/integrations/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setRevealedKeys(prev => ({ ...prev, [key]: data.value }))
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la révélation')
    } finally {
      setRevealingKey(null)
    }
  }

  const handlePing = async () => {
    const firstKey = activeFields[0]?.actualKey
    if (!firstKey || !configMap[firstKey]?.value) {
      toast.error('Veuillez d\'abord configurer la clé principale.')
      return
    }
    setPinging(true)
    try {
      const res = await fetch('/api/admin/integrations/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: firstKey, pingType: service.pingType })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test échoué')
      toast.success(data.message || 'Connexion établie avec succès !')
      setIsLivePinged(true)
    } catch (err: any) {
      toast.error('Échec : ' + (err.message || 'Erreur inconnue'))
    } finally {
      setPinging(false)
    }
  }

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 relative group flex flex-col mb-8">
      
      {/* ── HEADER DE LA CARTE ── */}
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm border border-gray-100 group-hover:scale-105 transition-transform duration-300">
            {service.icon ?? '⚙️'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-gray-900 group-hover:text-[#0D5C4A] transition-colors">{service.name}</h3>
              {stats && stats.sparklineData && stats.sparklineData.some(d => d > 0) && (
                <div className="hidden sm:flex items-center gap-2 bg-emerald-50/50 px-2.5 py-1 rounded-xl border border-emerald-100/50">
                  <span className="text-[9px] uppercase font-black tracking-widest text-emerald-600/60 hidden md:block">7j</span>
                  <svg width="40" height="14" className="overflow-visible">
                    <polyline 
                      points={stats.sparklineData.map((val, i) => `${i * (40/6)},${14 - (val / Math.max(...stats.sparklineData, 1)) * 14}`).join(' ')} 
                      fill="none" 
                      stroke="#10B981" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {formattedDate && (
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 bg-gray-100/50 px-2 py-0.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5" /> {lastAuthor ? `Configuré par ${lastAuthor}` : `Mis à jour : ${formattedDate}`}
                </p>
              )}
              {stats && stats.volume30d > 0 && (
                <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">
                  <TrendingUp className="w-3.5 h-3.5" /> {stats.volume30d.toLocaleString('fr-FR')} FCFA (30j)
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          
          {isPartiallyConfigured && (
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm transition-all duration-300 ${
                isNetworkLive 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
              title={isNetworkLive ? "Connexion établie ou Webhooks actifs" : "En attente d'activité réseau"}
            >
              <div className="relative flex h-2.5 w-2.5">
                {isNetworkLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isNetworkLive ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-gray-300'}`}></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">
                {isNetworkLive ? 'En Ligne' : 'Attente'}
              </span>
            </div>
          )}

          {isPartiallyConfigured ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D5C4A]/5 text-[#0D5C4A] text-xs font-black uppercase tracking-wider border border-[#0D5C4A]/10">
              <CheckCircle2 className="w-4 h-4" /> Activé
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100/80 text-gray-500 text-xs font-black uppercase tracking-wider border border-gray-200">
              <XCircle className="w-4 h-4" /> Config
            </span>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D5C4A] text-white rounded-xl text-xs font-black shadow-sm hover:bg-[#083D31] hover:shadow-md transition-all disabled:opacity-50 ml-1"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Enregistrer</span>
          </button>
        </div>
      </div>

      {/* ── CORPS DE LA CARTE ── */}
      <div className="p-6 flex flex-col gap-6">
        
        <p className="text-sm text-gray-600 font-medium leading-relaxed max-w-3xl">
          {service.description}
        </p>

        {/* Alerte & Toggle Sandbox */}
        {hasTestKeys && (
          <div className="flex flex-col gap-4">
            <div className={`flex items-start gap-3 p-4 rounded-2xl border ${isSandbox ? 'bg-amber-50 border-amber-200' : 'bg-blue-50/50 border-blue-100'}`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isSandbox ? 'text-amber-500' : 'text-blue-500'}`} />
              <p className={`text-sm font-medium ${isSandbox ? 'text-amber-800' : 'text-blue-800'}`}>
                {isSandbox 
                  ? "Attention : Vous modifiez actuellement les clés Sandbox (Mode TEST). Ces clés ne pourront opérer que de fausses transactions." 
                  : "Assurez-vous d'utiliser les clés de test pour le développement et les clés de production pour le site en ligne."}
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer w-max group/toggle select-none">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isSandbox} 
                  onChange={(e) => {
                    setIsSandbox(e.target.checked)
                    setFormData({}) // Clear draft on mode switch
                  }} 
                />
                <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${isSandbox ? 'bg-amber-400' : 'bg-gray-200 group-hover/toggle:bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm flex items-center justify-center ${isSandbox ? 'translate-x-5' : ''}`}>
                   {isSandbox && <Beaker className="w-3 h-3 text-amber-500" />}
                </div>
              </div>
              <span className="text-sm font-black text-gray-700 select-none">Mode Test (Sandbox)</span>
            </label>
          </div>
        )}

        {/* ── CHAMPS DU FORMULAIRE ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2 border-t border-gray-100">
          {activeFields.map(field => {
            const serverValue = configMap[field.actualKey]?.value
            const draftValue  = formData[field.actualKey]
            const displayedValue = draftValue !== undefined ? draftValue : ''

            // Rendu spécifique pour les champs booléens (Smart Fallback Toggle)
            if (field.type === 'boolean') {
              // Valeur true si 'true' en BDD, on écrase par draftValue si existante
              const isChecked = draftValue !== undefined ? draftValue === 'true' : serverValue === 'true'
              
              return (
                <div key={field.actualKey} className="flex flex-col gap-2 col-span-1 md:col-span-2 pt-2">
                  <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl gap-4">
                    <div className="flex flex-col">
                       <label className="text-sm font-bold text-red-900 flex items-center gap-2">
                         <AlertTriangle className="w-4 h-4 text-red-500" />
                         {field.label}
                       </label>
                       <p className="text-xs text-red-700/80 mt-1 font-medium max-w-xl">
                         En activant cette option d'urgence, tous les flux et boutons de paiement destinés à {service.name} seront temporairement acheminés via la passerelle d'agrégation de secours si elle est disponible.
                       </p>
                    </div>

                    <label className="flex items-center justify-center cursor-pointer relative group/toggle shrink-0">
                      <input 
                        type="checkbox" 
                        title={`Activer / Désactiver ${field.label}`}
                        aria-label={`Activer / Désactiver ${field.label}`}
                        className="sr-only" 
                        checked={isChecked} 
                        onChange={(e) => handleChange(field.actualKey, e.target.checked ? 'true' : 'false')} 
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors duration-300 shadow-inner ${isChecked ? 'bg-red-500' : 'bg-gray-200 group-hover/toggle:bg-gray-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 shadow-sm flex items-center justify-center ${isChecked ? 'translate-x-6' : ''}`}>
                      </div>
                    </label>
                  </div>
                </div>
              )
            }

            return (
              <div key={field.actualKey} className="flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    {field.label}
                    {isSandbox && field.testKey && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] uppercase font-black rounded-md">Test</span>}
                  </label>
                  {serverValue && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Configuré
                    </span>
                  )}
                </div>

                <div className="relative group/input">
                  <input
                    type={field.type === 'password' && !revealedKeys[field.actualKey] ? 'password' : 'text'}
                    value={displayedValue}
                    onChange={(e) => handleChange(field.actualKey, e.target.value)}
                    placeholder={serverValue && !revealedKeys[field.actualKey] ? maskValueInline(serverValue) : field.placeholder || 'Saisir la clé...'}
                    className={`w-full bg-gray-50 border ${draftValue !== undefined ? 'border-[#0D5C4A] ring-2 ring-[#0D5C4A]/10' : 'border-gray-200'} rounded-xl py-2.5 px-4 text-sm font-mono focus:bg-white focus:border-[#0D5C4A] outline-none transition-all shadow-inner pr-12 text-gray-800`}
                  />
                  
                  {/* Action Oeil Intégré */}
                  {field.type === 'password' && serverValue && (
                    <button 
                      onClick={() => handleReveal(field.actualKey)} 
                      disabled={revealingKey === field.actualKey}
                      title="Afficher la clé stockée"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                      {revealingKey === field.actualKey ? <Loader2 className="w-4 h-4 animate-spin" /> : (revealedKeys[field.actualKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />)}
                    </button>
                  )}
                </div>
                
                {revealedKeys[field.actualKey] && (
                  <div className="text-xs bg-emerald-50 text-emerald-800 font-mono p-2 rounded-lg border border-emerald-200 break-all select-all mt-1 flex flex-col gap-1 shadow-inner animate-in fade-in slide-in-from-top-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Valeur Décryptée</span>
                    {revealedKeys[field.actualKey]}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── ZONE ACTIONS BOTTOM (Webhook & Ping & Docs) ── */}
        <div className="flex items-center justify-start gap-4 pt-4 border-t border-gray-100">
          {service.webhookUrl && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 py-3 px-5 border border-indigo-200/60 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-sm font-bold rounded-2xl transition-all shadow-sm"
            >
              <ExternalLink className="w-4 h-4" /> 
              Guide & Configuration Webhook
            </button>
          )}

          {service.pingType && isPartiallyConfigured && (
            <button onClick={handlePing} disabled={pinging} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50/50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 transition-all text-xs font-bold border border-purple-100/50" title="Tester la connexion API">
              {pinging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />} Tester la ligne
            </button>
          )}

          {service.docsUrl && (
            <a href={service.docsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all text-xs font-bold" title="Documentation API">
              Developer Docs <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* ── AFFICHAGE DES LOGS/REQUETES RECENTES ── */}
        {stats && stats.recentLogs && stats.recentLogs.length > 0 && (
          <div className="pt-6 border-t border-gray-100 flex flex-col gap-3 relative">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <History className="w-3.5 h-3.5" /> Activité Récente (Webhooks Confirmés)
            </h4>
            <div className="grid grid-cols-1 divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-gray-100">
              {stats.recentLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 text-sm transition-all hover:bg-white/80 group/log">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] block"></span>
                    <span className="font-mono text-gray-500 font-medium text-xs">Commande #{log.id.split('-')[0]}</span>
                    <span className="text-emerald-700 font-black tracking-tight">+{log.amount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0 text-xs font-semibold text-gray-500">
                    <span className="bg-emerald-100/50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 inline-block uppercase tracking-wider">{log.status}</span>
                    <span className="text-gray-400 font-medium flex-shrink-0">{new Date(log.date).toLocaleString('fr-FR', { day:'2-digit', month: 'short', hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      
      {/* Modale de Guide d'Intégration Webhook */}
      <WebhookSetupModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceName={service.name}
        webhookUrl={service.webhookUrl || ''}
      />
    </div>
  )
}
