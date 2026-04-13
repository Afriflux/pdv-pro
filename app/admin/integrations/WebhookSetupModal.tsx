import { X, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  serviceName: string
  webhookUrl: string
}

export default function WebhookSetupModal({ isOpen, onClose, serviceName, webhookUrl }: Props) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Contenu spécifique selon le service
  const getInstructions = () => {
    switch (serviceName.toLowerCase()) {
      case 'wave':
        return [
          "Connectez-vous à votre tableau de bord Wave Entreprise.",
          "Allez dans la section 'Développeurs' puis 'Webhooks'.",
          "Cliquez sur 'Ajouter un Webhook' et collez l'URL ci-dessous.",
          "Sélectionnez les événements de type 'Checkout Session Completed'."
        ]
      case 'orange money':
        return [
          "Ouvrez le portail Orange Money API partenaire.",
          "Naviguez vers les paramètres de votre application.",
          "Dans 'Notification URL', collez le lien ci-dessous.",
          "Sauvegardez pour commencer à recevoir les paiements web."
        ]
      case 'paytech':
        return [
          "Connectez-vous à Paytech.sn.",
          "Allez dans Profil > Paramètres d'intégration API.",
          "Collez cette URL dans le champ 'URL IPN' (Instant Payment Notification).",
          "N'oubliez pas d'enregistrer vos paramètres."
        ]
      case 'cinetpay':
        return [
          "Allez sur votre Backoffice CinetPay.",
          "Dans la section 'Configuration', repérez 'URL de notification'.",
          "Collez cette URL et cochez l'option d'activation.",
          "C'est fait ! Les transactions seront notifiées ici."
        ]
      default:
        return [
          "Allez dans les paramètres de votre compte développeur pour ce prestataire.",
          "Repérez la section Webhook ou URL de Notification (IPN).",
          "Collez l'URL générée ci-dessous et activez la notification."
        ]
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/50 overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        <div className="p-6 pb-0 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-tight">Configurer le Webhook</h3>
            <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center gap-1.5">
              Intégration {serviceName}
            </p>
          </div>
          <button onClick={onClose} title="Fermer la modale" aria-label="Fermer" className="p-2 -mr-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-[14px] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-[#FAFAF7]/50">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">ℹ️</span>
              Instructions
            </h4>
            <ul className="space-y-3">
              {getInstructions().map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm font-medium text-gray-600 leading-snug">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 border border-gray-300 shadow-inner text-gray-600 flex items-center justify-center text-xs font-black">{idx + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Nouvelle URL d'écoute (à copier)</label>
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm group">
               <input 
                 readOnly 
                 value={webhookUrl}
                 title="URL d'écoute du Webhook"
                 aria-label="URL d'écoute du Webhook"
                 className="flex-1 bg-transparent px-4 py-3 text-sm font-mono text-gray-600 outline-none w-full select-all"
               />
               <button 
                 onClick={handleCopy}
                 title="Copier l'URL"
                 aria-label="Copier l'URL"
                 className="flex items-center gap-2 px-6 py-3 bg-[#0D5C4A] hover:bg-emerald-700 text-white text-sm font-bold transition-colors shadow-inner"
               >
                 {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                 {copied ? 'Copié !' : 'Copier'}
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
