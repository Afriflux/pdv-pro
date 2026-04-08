'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Play, Trash2, Plus, 
  Zap, Clock, Globe,
  CheckCircle2, Save,
  GitMerge, CheckSquare,
  Workflow, Sparkles, ArrowLeft, MessageCircle,
  Lock, CreditCard, X
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { purchaseAssetAction } from '@/app/dashboard/marketplace/actions'

// ─── TYPES MOCK ─────────────────────────────────────────────────────────────

interface ActionDef {
  type: string
  payload: Record<string, any>
}

interface WorkflowDef {
  id: string
  title: string
  description: string
  status: 'active' | 'inactive'
  triggerType: string
  config?: { 
    delay?: { active: boolean, amount: number, unit: string },
    condition?: { active: boolean, field: string, operator: string, value: string },
    actions?: ActionDef[] 
  }
  actionCount: number
  lastRun?: string
  is_premium?: boolean
  price?: number
}

export type WorkflowActions = {
  toggleStatus: (id: string, currentStatus: string) => Promise<{success: boolean, error?: string}>
  saveWorkflow: (workflow: WorkflowDef, ownerId: string) => Promise<{success: boolean, error?: string}>
  deleteWorkflow: (id: string) => Promise<{success: boolean, error?: string}>
  cloneWorkflow?: (templateId: string, ownerId: string, ownerType?: 'vendor' | 'client' | 'affiliate') => Promise<{success: boolean, error?: string}>
}

const DEFAULT_DESCRIPTION = "Automatisation personnalisée"

const QUICK_TEMPLATES: Record<string, { label: string, text: string }[]> = {
  'whatsapp_message': [
    { label: 'Relance Urgence (Panier)', text: 'Bonjour {{client_name}} ⏳,\nVotre panier contenant "{{product_name}}" expire bientôt sur {{store_name}} !\n👉 Finalisez vite avant la rupture de stock : {{checkout_link}}' },
    { label: 'Relance Promo (Panier)', text: 'Hello {{client_name}} 👋,\nVous avez oublié "{{product_name}}" 🛒.\n🎁 Voici -10% immédiats pour vous décider (CODE : VIP10) :\n👉 {{checkout_link}}' },
    { label: 'Confirmation d\'Achat', text: 'Merci {{client_name}} ! 🎉\nVotre commande de "{{product_name}}" est confirmée avec succès chez {{store_name}}.\nNous préparons l\'expédition le plus vite possible !' },
    { label: 'En Cours de Livraison', text: 'Bonne nouvelle {{client_name}} 📦 !\nVotre commande ("{{product_name}}") est en route !\nNotre livreur vous contactera très bientôt au numéro indiqué. Merci de rester joignable 🚚.' },
    { label: 'Demande d\'Avis / VIP', text: 'Bonjour {{client_name}} 🌟, nous espérons que vous adorez votre achat ("{{product_name}") !\n📸 Envoyez-nous une petite photo et obtenez -15% sur votre prochaine commande !' },
    { label: 'Message d\'Absence', text: 'Bonjour {{client_name}} ! L\'équipe {{store_name}} est actuellement fermée 🌙.\nLaissez votre message ou votre commande ici et nous vous répondrons dès demain matin à la première heure !' }
  ],
  'sms': [
    { label: '🛒 Relance Panier', text: 'Bonjour {{client_name}}, votre panier de "{{product_name}}" sur {{store_name}} vous attend toujours ! Finalisez vite : {{checkout_link}}' },
    { label: '🎉 Confirmation', text: 'Merci pour votre commande {{client_name}} ! Votre achat chez {{store_name}} est confirmé. Total encaissé.' },
    { label: '🚚 Suivi Livraison', text: 'Votre commande {{store_name}} est en route. Le livreur vous contactera très bientôt.' }
  ],
  'push_notification': [
    { label: '🎉 Vente Réussie', text: 'Nouvelle commande enregistrée pour {{product_name}} par {{client_name}} ! 💰 Préparez le colis.' },
    { label: '🚨 Panier VIP à Relancer', text: 'Alerte ! Un gros panier de "{{product_name}}" vient d\'être abandonné par {{client_name}}. Appelez-le !' },
    { label: '🛒 Rupture Imminente', text: 'Attention équipe {{store_name}} : Les stocks tournent vite. Pensez à vérifier {{product_name}}.' },
    { label: '💬 Nouveau Message', text: 'Nouveau ticket support reçu de {{client_name}} sur {{store_name}} ! À traiter.' }
  ],
  'email_customer': [
    { label: '🌟 Bienvenue', text: 'Objet : Bienvenue chez {{store_name}}, {{client_name}} ! 🎉\n\nNous sommes ravis de vous compter parmi nos membres Premium. Découvrez nos offres exclusives dès maintenant...' },
    { label: '🛒 Mail de Relance', text: 'Objet : Avez-vous oublié quelque chose, {{client_name}} ? 👀\n\nVotre coup de cœur pour "{{product_name}}" vous attend toujours dans votre panier. Le stock est limité !\n\nLien : {{checkout_link}}' },
    { label: '🎁 Newsletter Flash', text: 'Objet : Vente Privée - Jusqu\'à épuisement des stocks ! ⚡\n\nBonjour {{client_name}},\nLes Soldes Flash démarrent aujourd\'hui sur {{store_name}}. Soyez le premier à profiter des meilleures offres sur {{product_name}} et bien d\'autres !' },
    { label: '🧾 Facture / Reçu', text: 'Objet : Meci pour votre achat, {{client_name}} ! 🧾\n\nVoici le récapitulatif de votre commande de "{{product_name}}".\nTotal encaissé avec succès. L\'équipe {{store_name}} vous remercie de votre confiance.' }
  ],
  'telegram_vip': [
    { label: '🎫 Accès VIP', text: 'Félicitations {{client_name}} ! 🎉 Votre accès Premium au canal {{store_name}} est prêt.\n👉 Cliquez ici pour nous rejoindre : {{telegram_link}}' },
    { label: '📚 Cours Vidéo', text: 'Bonjour {{client_name}}, merci pour l\'achat de la formation "{{product_name}}".\nVotre espace de cours privé se trouve ici : {{telegram_link}}' }
  ],
  'telegram_group': [
    { label: '🔔 Alerte Vente', text: 'Nouveau client VIP 🚀 : {{client_name}} vient d\'acheter {{product_name}} ! Souhaitez-lui la bienvenue !' },
    { label: '📢 Annonce', text: 'Grande Nouvelle la communauté ! Offre spéciale sur {{product_name}} aujourd\'hui 🎉.' }
  ]
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────
export function UniversalWorkflowBuilder({ 
  initialWorkflows = [], 
  globalWorkflows = [],
  purchasedAssetIds = [],
  ownerId,
  ownerType = 'vendor',
  actions
}: { 
  initialWorkflows?: WorkflowDef[], 
  globalWorkflows?: WorkflowDef[],
  purchasedAssetIds?: string[],
  ownerId?: string,
  ownerType?: 'vendor' | 'closer' | 'affiliate',
  actions: WorkflowActions
}) {
  const router = useRouter()
  const [view, setView] = useState<'dashboard' | 'builder'>('dashboard')
  const [workflows, setWorkflows] = useState<WorkflowDef[]>(initialWorkflows)
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDef | null>(null)
  
  // Freemium workflow
  const [purchaseModalWf, setPurchaseModalWf] = useState<WorkflowDef | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [cloneLoading, setCloneLoading] = useState<string | null>(null)
  
  const [isSaving, setIsSaving] = useState(false)

  const handleToggleStatus = async (id: string) => {
    const wf = workflows.find(w => w.id === id)
    if (!wf) return
    
    // Optimistic UI
    const newStatus = wf.status === 'active' ? 'inactive' : 'active'
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w))
    
    const res = await actions.toggleStatus(id, wf.status)
    if (res.success) {
      toast.success(`Workflow "${wf.title}" ${newStatus === 'active' ? 'activé' : 'désactivé'}`)
    } else {
      toast.error(res.error || 'Erreur inconnue')
      // Revert if error
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: wf.status } : w))
    }
  }



  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Voulez-vous vraiment supprimer ce workflow ?')) return
    const res = await actions.deleteWorkflow(id)
    if (res.success) {
      setWorkflows(prev => prev.filter(w => w.id !== id))
      toast.success('Workflow supprimé')
    } else {
      toast.error(res.error || 'Erreur inconnue')
    }
  }

  const openBuilder = (workflow?: WorkflowDef) => {
    if (workflow) {
      setEditingWorkflow(workflow)
    } else {
      setEditingWorkflow({
        id: Math.random().toString(), // Will be updated to UUID in backend
        title: 'Nouveau Workflow',
        description: DEFAULT_DESCRIPTION,
        status: 'inactive',
        triggerType: '',
        actionCount: 0,
        config: { actions: [] }
      })
    }
    setView('builder')
  }

  const addActionNode = () => {
    if (!editingWorkflow) return
    setEditingWorkflow(prev => {
      if (!prev) return prev
      return {
        ...prev,
        actionCount: prev.actionCount + 1,
        config: {
          ...prev.config,
          actions: [...(prev.config?.actions || []), { type: 'whatsapp_message', payload: {} }]
        }
      }
    })
  }

  const handleSave = async () => {
    if (!editingWorkflow || !ownerId) return
    if (!editingWorkflow.triggerType) {
      toast.error('Veuillez sélectionner un déclencheur (Trigger)')
      return
    }

    setIsSaving(true)
    const res = await actions.saveWorkflow(editingWorkflow, ownerId)
    setIsSaving(false)

    if (res.success) {
      toast.success("Workflow sauvegardé avec succès !")
      // On recharge la page pour simplifier (ou on peut upfater la liste locale)
      window.location.reload()
    } else {
      toast.error(res.error || 'Erreur inconnue')
    }
  }

  if (view === 'dashboard') {
    return (
      <div className="w-full px-6 pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER HERO */}
        <div className="bg-gradient-to-br from-[#0F7A60] to-emerald-deep rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-xl shadow-emerald-deep/10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                <SparklesIcon /> Édition Premium
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">
                Pilotez votre boutique en pilote automatique.
              </h2>
              <p className="text-emerald-pale/80 leading-relaxed text-sm md:text-base">
                Créez des scénarios sur-mesure pour récupérer vos paniers, onboarder vos clients ou alerter votre équipe sans lever le petit doigt.
              </p>
            </div>
            
            <button 
              onClick={() => openBuilder()}
              className="bg-white text-[#0F7A60] px-8 py-4 rounded-2xl font-extrabold text-sm hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2 whitespace-nowrap group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              Créer un Workflow
            </button>
          </div>
        </div>

        {/* LISTE DES WORKFLOWS */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-ink flex items-center gap-2">
            <Workflow size={20} className="text-[#0DE0A1]" /> 
            Vos Automatisations ({workflows.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {workflows.map(wf => (
              <div key={wf.id} className="bg-white border border-line rounded-[2rem] p-6 shadow-sm hover:shadow-md hover:border-[#0DE0A1]/30 transition-all duration-300 group flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${wf.status === 'active' ? 'bg-emerald-pale text-[#0F7A60]' : 'bg-cream text-dust'}`}>
                    <Zap size={24} className={wf.status === 'active' ? 'fill-[#0F7A60]/20' : ''} />
                  </div>
                  
                  {/* SWITCH TOGGLE */}
                  <button 
                    title={wf.status === 'active' ? "Désactiver" : "Activer"}
                    aria-label={wf.status === 'active' ? "Désactiver" : "Activer"}
                    onClick={() => handleToggleStatus(wf.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${wf.status === 'active' ? 'bg-[#0F7A60]' : 'bg-linemed'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${wf.status === 'active' ? 'translate-x-6 shadow-sm' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex-1">
                  <h4 className="text-base font-bold text-ink mb-2">{wf.title}</h4>
                  <p className="text-sm text-slate leading-relaxed line-clamp-2">{wf.description}</p>
                </div>

                <div className="mt-6 pt-5 border-t border-line flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-slate font-medium">
                    <span className="flex items-center gap-1.5"><Play size={14} className={wf.status === 'active' ? 'text-emerald' : ''} /> {wf.triggerType}</span>
                  </div>
                  <button 
                    onClick={() => openBuilder(wf)}
                    className="text-[#0F7A60] font-bold bg-emerald-pale px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-subtle"
                  >
                    Éditer
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, wf.id)}
                    className="text-dust hover:text-[#EF4444] px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* CARD CREATION RAPIDE */}
            <button 
              onClick={() => openBuilder()}
              className="border-2 border-dashed border-linemed rounded-[2rem] p-6 flex flex-col items-center justify-center text-dust hover:text-[#0F7A60] hover:border-[#0DE0A1]/50 hover:bg-[#0DE0A1]/5 transition-all duration-300 min-h-[240px]"
            >
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Plus size={24} />
              </div>
              <span className="font-bold text-sm">Nouveau Workflow</span>
            </button>
          </div>
        </div>

        {/* BIBLIOTHÈQUE DE MODÈLES GLOBALE */}
        {globalWorkflows && globalWorkflows.length > 0 && (
          <div className="space-y-6 pt-10 border-t border-line mt-10">
            <h3 className="text-lg font-black text-ink flex items-center gap-2">
              <Sparkles size={20} className="text-gold" /> 
              Bibliothèque de Modèles Premium
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {globalWorkflows.map(wf => {
                const isLocked = wf.is_premium && !purchasedAssetIds.includes(wf.id)

                return (
                  <div key={wf.id} className="relative bg-white border border-line rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col overflow-hidden">
                    {/* Badge Freemium */}
                    {isLocked ? (
                      <div className="absolute top-4 right-4 bg-amber-100/80 text-amber-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Lock size={12} /> {wf.price} FCFA
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 bg-[#0F7A60]/10 text-[#0F7A60] text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Globe size={12} /> Gratuit / Acquis
                      </div>
                    )}

                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner bg-gold/10 text-gold mb-4">
                      <Workflow size={24} />
                    </div>

                    <div className="flex-1">
                      <h4 className="text-base font-bold text-ink mb-2">{wf.title}</h4>
                      <p className="text-sm text-slate leading-relaxed line-clamp-2">{wf.description}</p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-line">
                      {isLocked ? (
                        <button 
                          onClick={() => setPurchaseModalWf(wf)}
                          className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Lock size={16} /> Débloquer le Modèle
                        </button>
                      ) : (
                        <button 
                          disabled={cloneLoading === wf.id}
                          onClick={async () => {
                             if (!actions.cloneWorkflow || !ownerId) return;
                             setCloneLoading(wf.id)
                             const res = await actions.cloneWorkflow(wf.id, ownerId, ownerType as any)
                             if (res.success) {
                               toast.success("Modèle installé avec succès !")
                               window.location.reload()
                             } else {
                               toast.error(res.error || "Erreur d'installation")
                             }
                             setCloneLoading(null)
                          }}
                          className="w-full bg-cream hover:bg-emerald-pale text-[#0F7A60] font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-linemed hover:border-[#0DE0A1]/30 disabled:opacity-50"
                        >
                          {cloneLoading === wf.id ? <span className="w-4 h-4 border-2 border-[#0F7A60]/30 border-t-[#0F7A60] rounded-full animate-spin" /> : <><Plus size={16} /> Installer ce Modèle</>}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* MODAL ACHAT FREEMIUM WORKFLOW */}
        {purchaseModalWf && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setPurchaseModalWf(null)} 
                title="Fermer la fenêtre"
                aria-label="Fermer la fenêtre"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
              
              <div className="text-center mb-6 mt-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm text-amber-500">
                  <Workflow size={28} />
                </div>
                <h3 className="text-2xl font-black text-ink">Automatisation Premium</h3>
                <p className="text-gray-500 mt-2 text-sm">Débloquez l'automatisation <strong>{purchaseModalWf.title}</strong> pour votre boutique.</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-gray-500">Prix :</span>
                  <span className="text-ink text-xl">{purchaseModalWf.price} FCFA</span>
                </div>
              </div>

              {purchaseError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center">
                  {purchaseError}
                </div>
              )}

              <button
                disabled={purchaseLoading}
                onClick={async () => {
                  setPurchaseLoading(true)
                  setPurchaseError(null)
                  const res = await purchaseAssetAction(purchaseModalWf.id, 'WORKFLOW', purchaseModalWf.price || 0, purchaseModalWf.title)
                  if (res.success) {
                    setPurchaseModalWf(null)
                    router.refresh()
                  } else {
                    setPurchaseError(res.error || 'Erreur inconnue')
                  }
                  setPurchaseLoading(false)
                }}
                className="w-full bg-ink hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {purchaseLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CreditCard size={18} /> Payer avec mon Solde</>}
              </button>
              <p className="text-center text-xs mt-4 text-gray-400 font-medium">Le montant sera déduit de votre solde disponible.</p>
            </div>
          </div>
        )}

      </div>
    )
  }

  // ============== VIEW : BUILDER ==============
  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-[calc(100vh-80px)]">
      
      {/* BUILDER HEADER */}
      <div className="bg-white border-b border-linemed px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('dashboard')}
            className="w-10 h-10 bg-cream rounded-full flex items-center justify-center text-slate hover:text-charcoal transition-colors border border-linemed"
            title="Retour ou Fermer"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-xl font-bold text-ink">
            {editingWorkflow?.id && !editingWorkflow.id.includes('.') ? editingWorkflow.title : 'Nouveau Workflow'}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('dashboard')}
            className="text-slate hover:text-charcoal font-bold px-4 py-2 text-sm"
          >
            Fermer
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-[#0F7A60] to-emerald-rich text-white px-6 py-2.5 rounded-xl text-sm font-extrabold hover:to-[#0DE0A1] transition-all shadow-md shadow-emerald-deep/10 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save size={16} />}
            Sauvegarder & Quitter
          </button>
        </div>
      </div>
      {/* FIN HEADER BUILDER */}

      {/* BUILDER CANVAS */}
      <div className="flex-1 overflow-auto bg-cream p-10 relative flex flex-col items-center">
        
        <div className="max-w-[600px] w-full mt-10 space-y-0 flex flex-col items-center pb-32">
          
          {/* NODE : TRIGGER */}
          <div className="bg-white border-2 border-[#0DE0A1]/50 shadow-[0_8px_30px_rgb(15,122,96,0.12)] rounded-[2rem] w-full p-6 relative group transition-all hover:scale-[1.02]">
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-[#0DE0A1] to-[#0F7A60] rounded-xl text-white flex items-center justify-center shadow-lg rotate-12 group-hover:rotate-0 transition-transform">
              <Zap size={20} className="fill-white/20" />
            </div>
            
            <div className="ml-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#0F7A60] mb-1">Déclencheur (Trigger)</p>
              <h3 className="text-xl font-bold text-ink mb-4">Quand cet événement se produit :</h3>
              
              <select 
                title="Déclencheur"
                aria-label="Déclencheur"
                value={editingWorkflow?.triggerType || ''}
                onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, triggerType: e.target.value } : null)}
                className="w-full bg-cream border border-linemed rounded-xl px-4 py-3 text-sm font-bold text-charcoal outline-none focus:border-[#0DE0A1] focus:ring-4 focus:ring-[#0DE0A1]/10 transition-all cursor-pointer"
              >
                <option value="">Sélectionnez un déclencheur...</option>
                {ownerType === 'vendor' && (
                  <>
                    <option value="Panier Abandonné">Panier Abandonné (Checkout non terminé)</option>
                    <option value="Nouvelle Commande">Nouvelle Commande (Validée COD)</option>
                    <option value="Commande Livrée">Commande Livrée (Succès)</option>
                    <option value="Nouvelle Question">Nouvelle Question Client</option>
                  </>
                )}
                {ownerType === 'closer' && (
                  <>
                    <option value="Nouveau Lead">Nouveau Lead Assigné</option>
                    <option value="Rendez-vous Booké">Nouveau Call Programmé</option>
                    <option value="Appel Manqué">Client absent au Call (No-Show)</option>
                  </>
                )}
                {ownerType === 'affiliate' && (
                  <>
                    <option value="Nouveau Clic">Nouveau Clic sur mon lien</option>
                    <option value="Nouvelle Commission">Vente validée (Commission gagnée)</option>
                    <option value="Nouveau Filleul">Nouvelle inscription (Filleul)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="w-[2px] h-12 bg-linemed relative">
            <button 
              onClick={addActionNode}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-linemed rounded-full flex items-center justify-center text-dust hover:text-[#0F7A60] hover:border-[#0DE0A1] hover:shadow-md transition-all group/add"
              title="Ajouter une action"
            >
              <Plus size={16} className="group-hover/add:scale-125 transition-transform" />
            </button>
          </div>

          {/* DÉLAI OPTIONNEL */}
          <div className={`bg-white border rounded-[2rem] w-full p-6 relative transition-all shadow-sm ${editingWorkflow?.config?.delay?.active ? 'border-gold-light shadow-md' : 'border-linemed'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${editingWorkflow?.config?.delay?.active ? 'bg-gold-pale text-gold' : 'bg-slate-100 text-slate'}`}>
                  <Clock size={16} />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${editingWorkflow?.config?.delay?.active ? 'text-gold' : 'text-slate'}`}>Condition de Temps</p>
                  <h3 className="font-bold text-ink">Attendre avant d'exécuter la suite</h3>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  title="Activer le délai"
                  aria-label="Activer le délai"
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={editingWorkflow?.config?.delay?.active || false}
                  onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, delay: { ...(prev.config?.delay || {amount: 2, unit: 'hours'}), active: e.target.checked } } } : null)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-light"></div>
              </label>
            </div>
            
            {editingWorkflow?.config?.delay?.active && (
              <div className="flex items-center gap-3 bg-cream p-4 rounded-xl border border-line animate-in slide-in-from-top-4 duration-200">
                <input 
                  title="Durée du délai"
                  aria-label="Durée du délai"
                  type="number" 
                  value={editingWorkflow.config.delay.amount || 1} 
                  onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, delay: { ...(prev.config?.delay || {active: true, unit: 'hours', amount: 1}), amount: Number(e.target.value) } } } : null)}
                  className="w-20 bg-white border border-linemed rounded-lg px-3 py-2 text-sm font-bold text-center outline-none focus:border-gold" 
                />
                <select 
                  title="Unité de délai"
                  aria-label="Unité de délai"
                  value={editingWorkflow.config.delay.unit || 'hours'}
                  onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, delay: { ...(prev.config?.delay || {active: true, amount: 1, unit: 'hours'}), unit: e.target.value } } } : null)}
                  className="flex-1 bg-white border border-linemed rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-gold"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Heures</option>
                  <option value="days">Jours</option>
                </select>
              </div>
            )}
          </div>

          <div className="w-[2px] h-6 bg-linemed"></div>

          {/* FILTRE / CONDITION OPTIONNELLE */}
          <div className={`bg-white border rounded-[2rem] w-full p-6 relative transition-all shadow-sm mb-4 ${editingWorkflow?.config?.condition?.active ? 'border-purple-300 shadow-md' : 'border-linemed'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${editingWorkflow?.config?.condition?.active ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate'}`}>
                  <GitMerge size={16} />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${editingWorkflow?.config?.condition?.active ? 'text-purple-600' : 'text-slate'}`}>Filtre</p>
                  <h3 className="font-bold text-ink">Continuer uniquement si...</h3>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  title="Activer la condition"
                  aria-label="Activer la condition"
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={editingWorkflow?.config?.condition?.active || false}
                  onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, condition: { ...(prev.config?.condition || {field: 'order_total', operator: '>', value: '50000'}), active: e.target.checked } } } : null)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            
            {editingWorkflow?.config?.condition?.active && (
              <div className="flex items-center gap-2 bg-cream p-4 rounded-xl border border-line animate-in slide-in-from-top-4 duration-200">
                <select 
                  title="Champ à évaluer"
                  aria-label="Champ à évaluer"
                  value={editingWorkflow.config.condition.field || 'order_total'}
                  onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, condition: { ...(prev.config?.condition || {active: true, operator: '>', value: '50000', field: 'order_total'}), field: e.target.value } } } : null)}
                  className="w-1/3 bg-white border border-linemed rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-purple-500"
                >
                  <option value="order_total">Montant de la Commande</option>
                  <option value="customer_city">Ville du Client</option>
                  <option value="lead_score_ai">Score IA du Client (0-10)</option>
                </select>
                <select 
                  title="Opérateur de comparaison"
                  aria-label="Opérateur de comparaison"
                  value={editingWorkflow.config.condition.operator || '>'}
                  onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, condition: { ...(prev.config?.condition || {active: true, field: 'order_total', value: '50000', operator: '>'}), operator: e.target.value } } } : null)}
                  className="w-1/4 bg-white border border-linemed rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-purple-500"
                >
                  <option value=">">Supérieur à</option>
                  <option value="<">Inférieur à</option>
                  <option value="==">Est exactement</option>
                </select>
                <input 
                  title="Valeur de comparaison"
                  aria-label="Valeur de comparaison"
                  type="text" 
                  value={editingWorkflow.config.condition.value || ''}
                  onChange={(e) => setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, condition: { ...(prev.config?.condition || {active: true, field: 'order_total', operator: '>', value: ''}), value: e.target.value } } } : null)}
                  placeholder="Ex: 50000"
                  className="flex-1 bg-white border border-linemed rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>

          {/* NODE : ACTION (Générique pour tous les ajouts) */}
          {editingWorkflow?.actionCount !== undefined && editingWorkflow.actionCount > 0 && Array.from({ length: Math.max(1, editingWorkflow.actionCount) }).map((_, i) => {
            const currentAction = editingWorkflow.config?.actions?.[i] || { type: 'whatsapp_message', payload: { message: '' } }
            
            const handleActionChange = (field: 'type' | 'message', value: string) => {
              setEditingWorkflow(prev => {
                if (!prev) return prev
                const newActions = [...(prev.config?.actions || [])]
                if (!newActions[i]) newActions[i] = { type: 'whatsapp_message', payload: {} }
                
                if (field === 'type') {
                  newActions[i].type = value
                  if (value === 'telegram_vip') newActions[i].payload = { message: 'Félicitations {{client_name}} ! Voici votre accès au groupe : {{telegram_link}}' }
                  else if (value === 'telegram_group') newActions[i].payload = { message: '🚀 Nouvelle commande de {{product_name}} par {{client_name}} !' }
                  else if (value === 'whatsapp_message') newActions[i].payload = { message: 'Bonjour {{client_name}}...' }
                  else if (value === 'sms') newActions[i].payload = { message: 'Bonjour {{client_name}}...' }
                  else if (value === 'webhook') newActions[i].payload = { url: 'https://', method: 'POST' }
                  else if (value === 'create_task') newActions[i].payload = { title: 'Appeler {{client_name}} pour confirmer', priority: 'high' }
                  else newActions[i].payload = { message: '' }
                } else if (field === 'message') {
                  newActions[i].payload = { ...newActions[i].payload, message: value }
                } else if (field === 'payload_field') {
                  // Used for dynamic payload updates (delay, filter, webhook, etc.)
                  // value is actually an object here
                }
                
                return { ...prev, config: { ...prev.config, actions: newActions } }
              })
            }
            
            return (
            <div key={i} className={`bg-white border shadow-sm rounded-[2rem] w-full p-6 relative transition-all mb-4 border-linemed hover:border-turquoise-light hover:shadow-md`}>
              {/* CONNECTEUR HAUT */}
              <div className="absolute -top-4 left-1/2 w-[2px] h-4 bg-linemed"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 w-full max-w-[80%]">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-turquoise-pale text-turquoise`}>
                    {currentAction.type === 'whatsapp_message' ? <MessageCircle size={16} /> : 
                     currentAction.type === 'webhook' ? <Globe size={16} /> : 
                     currentAction.type === 'create_task' ? <CheckSquare size={16} /> : 
                     currentAction.type === 'auto_reply_ai' ? <Sparkles size={16} /> :
                     currentAction.type.includes('telegram') ? <CheckCircle2 size={16} /> : 
                     <Zap size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 text-turquoise`}>
                      Action (Résultat)
                    </p>
                    <select 
                      title="Type d'action"
                      aria-label="Type d'action"
                      value={currentAction.type}
                      onChange={(e) => handleActionChange('type', e.target.value)}
                      className={`w-full bg-cream border border-linemed rounded-xl px-3 py-2 text-sm font-bold text-charcoal outline-none transition-all cursor-pointer focus:ring-4 focus:ring-opacity-20 focus:border-turquoise focus:ring-turquoise`}
                    >
                      <optgroup label="⚡ Actions (Communications)">
                        <option value="whatsapp_message">💬 Envoyer un message WhatsApp</option>
                        <option value="sms">📱 Envoyer un SMS textuel</option>
                        <option value="email_customer">📧 Envoyer un Email au client</option>
                        <option value="telegram_vip">🎫 Lien Privé (Bot Telegram Yayyam)</option>
                        <option value="telegram_group">📢 Diffuser dans le Groupe Telegram</option>
                        <option value="push_notification">📱 Envoyer une alerte Push interne</option>
                      </optgroup>
                      <optgroup label="🤖 Intelligence Artificielle (Actions)">
                        <option value="auto_reply_ai">✨ Auto-Réponse SAV 1er Niveau</option>
                      </optgroup>
                      <optgroup label="⚙️ Actions Avancées (CRM & Dev)">
                        <option value="create_task">📋 Créer une Tâche CRM Interne</option>
                        <option value="webhook">🌐 Envoyer une Requête Webhook (Zapier/Make)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingWorkflow(prev => prev ? { ...prev, actionCount: Math.max(0, prev.actionCount - 1) } : null)}
                  className="text-dust hover:text-[#EF4444] p-2 transition-colors shrink-0"
                  title="Supprimer cette action"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="bg-cream p-4 rounded-xl border border-line">
                {currentAction.type === 'webhook' ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-slate italic mb-1">Envoie un JSON détaillé avec toutes les informations de l'événement vers Zapier, Make, ou votre propre serveur.</p>
                    <div className="flex items-center gap-2">
                       <select 
                         title="Méthode HTTP"
                         aria-label="Méthode HTTP"
                         value={currentAction.payload?.method || 'POST'}
                         onChange={(e) => {
                           const newActions = [...(editingWorkflow.config?.actions || [])]
                           newActions[i].payload = { ...newActions[i].payload, method: e.target.value }
                           setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, actions: newActions } } : null)
                         }}
                         className="w-24 bg-white border border-linemed rounded-lg px-2 py-2 text-sm font-bold text-ink outline-none focus:border-turquoise"
                       >
                         <option value="POST">POST</option>
                         <option value="GET">GET</option>
                       </select>
                       <input 
                         title="URL du Webhook"
                         aria-label="URL du Webhook"
                         type="url"
                         value={currentAction.payload?.url || ''}
                         onChange={(e) => {
                           const newActions = [...(editingWorkflow.config?.actions || [])]
                           newActions[i].payload = { ...newActions[i].payload, url: e.target.value }
                           setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, actions: newActions } } : null)
                         }}
                         placeholder="https://hook.make.com/..."
                         className="flex-1 bg-white border border-linemed rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/20"
                       />
                    </div>
                  </div>
                ) : currentAction.type === 'create_task' ? (
                  <div className="flex flex-col gap-3">
                     <label className="text-xs font-bold text-slate uppercase tracking-wider">Titre de la tâche à créer au CRM :</label>
                     <input 
                       title="Titre de la tâche interne"
                       aria-label="Titre de la tâche interne"
                       type="text"
                       value={currentAction.payload?.title || ''}
                       onChange={(e) => {
                         const newActions = [...(editingWorkflow.config?.actions || [])]
                         newActions[i].payload = { ...newActions[i].payload, title: e.target.value }
                         setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, actions: newActions } } : null)
                       }}
                       placeholder="Ex: Appeler {{client_name}} pour confirmer l'expédition"
                       className="w-full bg-white border border-linemed rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/20"
                     />
                     <div className="text-[11px] text-slate/70 flex gap-2 flex-wrap">
                      <span className="bg-white border border-line px-1.5 py-0.5 rounded text-dust font-mono">{"{{client_name}}"}</span>
                      <span className="bg-white border border-line px-1.5 py-0.5 rounded text-dust font-mono">{"{{order_id}}"}</span>
                    </div>
                  </div>
                ) : currentAction.type === 'auto_reply_ai' ? (
                  <div className="flex flex-col gap-3 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 p-4 border border-indigo-100 rounded-xl">
                    <div className="absolute top-0 right-0 p-2 opacity-5"><Sparkles size={64}/></div>
                    <div className="flex gap-2">
                       <Sparkles size={20} className="text-indigo-600 mt-1 shrink-0" />
                       <div>
                         <h4 className="font-bold text-indigo-900 text-sm">Réponse Automatisée par l'IA</h4>
                         <p className="text-xs text-indigo-700/80 mt-1 mb-3">L'assistant Claude 3.5 analysera la question entrante et tentera d'y répondre à l'aide de votre base de connaissances.</p>
                       </div>
                    </div>
                    <label className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Prompt de Personnalité (Optionnel) :</label>
                    <textarea 
                      value={currentAction.payload?.instructions || ''}
                      onChange={(e) => {
                        const newActions = [...(editingWorkflow.config?.actions || [])]
                        newActions[i].payload = { ...newActions[i].payload, instructions: e.target.value }
                        setEditingWorkflow(prev => prev ? { ...prev, config: { ...prev.config, actions: newActions } } : null)
                      }}
                      placeholder="Ex: Tu es l'assistant de notre boutique. Réponds toujours de façon courtoise et concise. Si la question concerne les délais, dis 48h."
                      className="w-full bg-white border border-indigo-200 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 resize-y min-h-[80px]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate uppercase tracking-wider flex items-center justify-between">
                      Contenu du message :
                      
                      {QUICK_TEMPLATES[currentAction.type] && (
                        <div className="flex gap-2 flex-wrap justify-end max-w-[70%]">
                          {QUICK_TEMPLATES[currentAction.type].map((tpl, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleActionChange('message', tpl.text)}
                              className="text-[10px] bg-white hover:bg-turquoise-pale border border-linemed hover:border-turquoise text-ink hover:text-turquoise px-2 flex-shrink-0 h-6 rounded-md transition-all font-semibold shadow-sm"
                            >
                              + {tpl.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </label>
                    <textarea 
                      value={currentAction.payload?.message || ''}
                      onChange={(e) => handleActionChange('message', e.target.value)}
                      placeholder={currentAction.type === 'whatsapp_message' ? "Ex: Bonjour {{client_name}}, merci pour votre commande..." : "Entrez votre message ici..."}
                      className="w-full bg-white border border-linemed rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/20 min-h-[120px] resize-y shadow-inner"
                    />
                    <div className="text-[11px] text-slate/70 flex gap-2 flex-wrap mt-1">
                      <span className="bg-white border border-line px-1.5 py-0.5 rounded text-dust font-mono">{"{{client_name}}"}</span>
                      <span className="bg-white border border-line px-1.5 py-0.5 rounded text-dust font-mono">{"{{product_name}}"}</span>
                      <span className="bg-white border border-line px-1.5 py-0.5 rounded text-dust font-mono">{"{{store_name}}"}</span>
                      {currentAction.type === 'telegram_vip' && (
                        <span className="bg-turquoise-pale border-turquoise text-turquoise px-1.5 py-0.5 rounded font-mono font-bold">{"{{telegram_link}}"}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )})}

          {/* AJOUTER BOUTON FINAL POUR NOUVEAU WORKFLOW */}
          {editingWorkflow?.actionCount === 0 && (
             <button 
                onClick={addActionNode}
                className="bg-white border-2 border-dashed border-linemed rounded-[2rem] w-full py-8 relative hover:border-turquoise-light hover:bg-turquoise-pale/50 hover:text-turquoise transition-all text-slate font-bold flex flex-col items-center gap-3 shadow-sm group"
             >
                <div className="w-12 h-12 bg-pearl group-hover:bg-turquoise-pale rounded-full flex items-center justify-center transition-colors">
                  <Plus size={24} />
                </div>
                Ajouter une Action ou Condition
             </button>
          )}

        </div>
      </div>
    </div>
  )
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  )
}
