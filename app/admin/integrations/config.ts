export interface ServiceField {
  key:         string
  testKey?:    string
  label:       string
  type:        'text' | 'password' | 'boolean'
  placeholder?: string
}

export interface IntegrationService {
  id:          string
  name:        string
  description: string
  icon?:       string
  docsUrl?:    string | null
  webhookUrl?: string
  pingType?:   'wave' | 'cinetpay' | 'paytech' | 'orange_money' | 'bictorys' | 'anthropic' | 'brevo' | 'telegram' | 'twilio' | 'generic'
  fields:      ServiceField[]
}

export interface IntegrationCategory {
  category: string
  services: IntegrationService[]
}

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  {
    category: '🤖 Intelligence Artificielle',
    services: [
      {
        id: 'anthropic',
        name: 'Configuration Claude AI',
        description: 'Générateur IA de fiches produits et d\'assistants conversationnels.',
        icon: '🤖',
        docsUrl: 'https://console.anthropic.com',
        pingType: 'anthropic',
        fields: [
          { key: 'ANTHROPIC_API_KEY', label: 'API Key', type: 'password', placeholder: 'sk-ant-api03-...' }
        ]
      }
    ]
  },
  {
    category: '💳 Paiements Mobile Money & Cartes',
    services: [
      {
        id: 'wave',
        name: 'Configuration Wave',
        description: 'Encaissement via Wave Sénégal et Côte d\'Ivoire.',
        icon: '🌊',
        docsUrl: 'https://wave.com/fr/business',
        webhookUrl: '/api/webhooks/wave',
        pingType: 'wave',
        fields: [
          { key: 'WAVE_API_KEY', testKey: 'WAVE_API_KEY_TEST', label: 'API Key', type: 'password' },
          { key: 'WAVE_API_SECRET', testKey: 'WAVE_API_SECRET_TEST', label: 'Webhook Secret', type: 'password' },
          { key: 'FALLBACK_WAVE_PAYTECH', label: 'Bascule d\'urgence vers Paytech (Routage Smart)', type: 'boolean' }
        ]
      },
      {
        id: 'bictorys',
        name: 'Configuration Bictorys',
        description: 'Processeur de paiements modernes et hautement sécurisé.',
        icon: '🔗',
        docsUrl: 'https://bictorys.com',
        webhookUrl: '/api/webhooks/bictorys',
        pingType: 'bictorys',
        fields: [
          { key: 'BICTORYS_SECRET_KEY', testKey: 'BICTORYS_SECRET_KEY_TEST', label: 'Secret Key', type: 'password' },
          { key: 'BICTORYS_WEBHOOK_SECRET', testKey: 'BICTORYS_WEBHOOK_SECRET', label: 'Webhook Secret', type: 'password' }
        ]
      },
      {
        id: 'orange-money',
        name: 'Configuration Orange Money',
        description: 'Encaissement direct via Orange Money Web Pay.',
        icon: '🟠',
        docsUrl: 'https://developer.orange.com',
        webhookUrl: '/api/webhooks/orange-money',
        pingType: 'orange_money',
        fields: [
          { key: 'ORANGE_MONEY_API_KEY', testKey: 'ORANGE_MONEY_API_KEY_TEST', label: 'Authorization (Bearer)', type: 'password' },
          { key: 'ORANGE_MONEY_MERCHANT_KEY', testKey: 'ORANGE_MONEY_MERCHANT_KEY_TEST', label: 'Merchant Key', type: 'password' }
        ]
      },
      {
        id: 'paytech',
        name: 'Configuration Paytech',
        description: 'Agrégateur de paiements (Wave, Free, Orange Money, Cartes).',
        icon: '💳',
        docsUrl: 'https://paytech.sn',
        webhookUrl: '/api/webhooks/paytech',
        pingType: 'paytech',
        fields: [
          { key: 'PAYTECH_API_KEY', testKey: 'PAYTECH_API_KEY_TEST', label: 'API Key', type: 'password' },
          { key: 'PAYTECH_API_SECRET', testKey: 'PAYTECH_API_SECRET_TEST', label: 'API Secret', type: 'password' }
        ]
      },
      {
        id: 'cinetpay',
        name: 'Configuration CinetPay',
        description: 'Paiements Mobile Money multi-pays et Cartes Bancaires.',
        icon: '🟩',
        docsUrl: 'https://cinetpay.com',
        webhookUrl: '/api/webhooks/cinetpay',
        pingType: 'cinetpay',
        fields: [
          { key: 'CINETPAY_SITE_ID', testKey: 'CINETPAY_SITE_ID_TEST', label: 'Site ID', type: 'text', placeholder: 'Ex: 123456' },
          { key: 'CINETPAY_API_KEY', testKey: 'CINETPAY_API_KEY_TEST', label: 'API Key', type: 'password' }
        ]
      }
    ]
  },
  {
    category: '📱 Notifications & Messaging',
    services: [
      {
        id: 'telegram',
        name: 'Configuration Telegram Bot',
        description: 'Notifications automatiques des commandes via @YayyamProBot.',
        icon: '✈️',
        docsUrl: 'https://t.me/BotFather',
        webhookUrl: '/api/webhooks/telegram',
        pingType: 'telegram',
        fields: [
          { key: 'TELEGRAM_BOT_TOKEN', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF1234...'}
        ]
      },
      {
        id: 'brevo',
        name: 'Configuration Brevo (Sendinblue)',
        description: 'Emails transactionnels (Reçus, Factures).',
        icon: '📧',
        docsUrl: 'https://app.brevo.com/settings/keys/api',
        pingType: 'brevo',
        fields: [
          { key: 'BREVO_API_KEY', label: 'API Key (v3)', type: 'password' }
        ]
      },
      {
        id: 'twilio',
        name: 'Configuration Twilio',
        description: 'Messagerie WhatsApp Business API.',
        icon: '💬',
        docsUrl: 'https://console.twilio.com',
        webhookUrl: '/api/webhooks/twilio',
        pingType: 'twilio',
        fields: [
          { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', type: 'text' },
          { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', type: 'password' }
        ]
      }
    ]
  }
]

export function maskValue(val: string): string {
  if (!val) return ''
  if (val.length <= 8) return '••••••••'
  return `${val.slice(0, 4)}••••••••${val.slice(-4)}`
}
