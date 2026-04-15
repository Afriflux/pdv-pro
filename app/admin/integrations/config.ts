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
  pingType?:   'wave' | 'cinetpay' | 'paytech' | 'orange_money' | 'bictorys' | 'anthropic' | 'openai' | 'gemini' | 'brevo' | 'telegram' | 'twilio' | 'generic'
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
        description: 'Moteur IA principal recommandé par Yayyam. Excellent pour la rédaction experte, l\'analyse du contexte et la génération de fiches produits sans hallucinations.',
        icon: '🤖',
        docsUrl: 'https://console.anthropic.com',
        pingType: 'anthropic',
        fields: [
          { key: 'ANTHROPIC_API_KEY', label: 'API Key', type: 'password', placeholder: 'sk-ant-api03-...' }
        ]
      },
      {
        id: 'openai',
        name: 'Configuration OpenAI (ChatGPT)',
        description: 'L\'un des moteurs IA les plus populaires. Idéal pour les assistants conversationnels, la génération d\'images (DALL-E) ou les flux automatisés.',
        icon: '🧠',
        docsUrl: 'https://platform.openai.com/api-keys',
        pingType: 'openai',
        fields: [
          { key: 'OPENAI_API_KEY', label: 'API Key', type: 'password', placeholder: 'sk-...' }
        ]
      },
      {
        id: 'gemini',
        name: 'Configuration Google Gemini',
        description: 'Moteur IA multi-modal rapide. Utile comme fallback ou pour des performances agiles liées à  l\'écosystème Google.',
        icon: '✨',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        pingType: 'gemini',
        fields: [
          { key: 'GEMINI_API_KEY', label: 'API Key', type: 'password', placeholder: 'AIzaSy...' }
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
        icon: '/wave.svg',
        docsUrl: 'https://wave.com/fr/business',
        webhookUrl: '/api/webhooks/wave',
        pingType: 'wave',
        fields: [
          { key: 'WAVE_API_KEY', testKey: 'WAVE_API_KEY_TEST', label: 'API Key', type: 'password' },
          { key: 'WAVE_API_SECRET', testKey: 'WAVE_API_SECRET_TEST', label: 'Webhook Secret', type: 'password' }
        ]
      },
      {
        id: 'bictorys',
        name: 'Configuration Bictorys',
        description: 'Processeur de paiements modernes et hautement sécurisé.',
        icon: '/bictorys.png',
        docsUrl: 'https://bictorys.com',
        webhookUrl: '/api/webhooks/bictorys',
        pingType: 'bictorys',
        fields: [
          { key: 'BICTORYS_SECRET_KEY', testKey: 'BICTORYS_SECRET_KEY_TEST', label: 'Secret Key', type: 'password' },
          { key: 'BICTORYS_WEBHOOK_SECRET', testKey: 'BICTORYS_WEBHOOK_SECRET_TEST', label: 'Webhook Secret', type: 'password' }
        ]
      },
      {
        id: 'paytech',
        name: 'Configuration Paytech',
        description: 'Agrégateur de paiements (Wave, Free, Orange Money, Cartes).',
        icon: '/paytech.png',
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
        icon: '/cinetpay.png',
        docsUrl: 'https://cinetpay.com',
        webhookUrl: '/api/webhooks/cinetpay',
        pingType: 'cinetpay',
        fields: [
          { key: 'CINETPAY_SITE_ID', testKey: 'CINETPAY_SITE_ID_TEST', label: 'Site ID', type: 'text', placeholder: 'Ex: 123456' },
          { key: 'CINETPAY_API_KEY', testKey: 'CINETPAY_API_KEY_TEST', label: 'API Key', type: 'password' }
        ]
      },
      {
        id: 'moneroo',
        name: 'Configuration Moneroo',
        description: 'Orchestrateur de paiement africain. Agrège tous vos PSPs (Wave, Orange Money, Visa, MC) en une seule API unifiée.',
        icon: '🔀',
        docsUrl: 'https://moneroo.io',
        webhookUrl: '/api/webhooks/moneroo',
        pingType: 'generic' as const,
        fields: [
          { key: 'MONEROO_SECRET_KEY', testKey: 'MONEROO_SECRET_KEY_TEST', label: 'Secret Key (Type: Privée)', type: 'password' as const, placeholder: 'Clé commençant parfois par sk_...' }
        ]
      },
      {
        id: 'intouch',
        name: 'Configuration InTouch',
        description: 'Agrégateur de paiements Mobile Money et Cartes.',
        icon: '🔗',
        docsUrl: 'https://intouchapi.com',
        webhookUrl: '/api/webhooks/intouch',
        pingType: 'generic' as const,
        fields: [
          { key: 'INTOUCH_API_KEY', testKey: 'INTOUCH_API_KEY_TEST', label: 'API Key', type: 'password' },
          { key: 'INTOUCH_API_SECRET', testKey: 'INTOUCH_API_SECRET_TEST', label: 'API Secret', type: 'password' },
          { key: 'INTOUCH_MERCHANT_ID', testKey: 'INTOUCH_MERCHANT_ID_TEST', label: 'Merchant ID', type: 'text' }
        ]
      },
      {
        id: 'orange_money',
        name: 'Configuration Orange Money API',
        description: 'Paiements directs via Orange Money Web Payment.',
        icon: '🟠',
        docsUrl: 'https://developer.orange.com',
        webhookUrl: '/api/webhooks/orange_money',
        pingType: 'orange_money',
        fields: [
          { key: 'ORANGE_MONEY_MERCHANT_KEY', testKey: 'ORANGE_MONEY_MERCHANT_KEY_TEST', label: 'Merchant Key', type: 'password' },
          { key: 'ORANGE_MONEY_AUTHORIZATION_HEADER', testKey: 'ORANGE_MONEY_AUTHORIZATION_HEADER_TEST', label: 'Authorization Header', type: 'password' }
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
        description: 'Notifications automatiques des commandes via @Yayyam_bot.',
        icon: '✈️',
        docsUrl: 'https://t.me/BotFather',
        webhookUrl: '/api/webhooks/telegram',
        pingType: 'telegram',
        fields: [
          { key: 'TELEGRAM_BOT_TOKEN', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF1234...'},
          { key: 'TELEGRAM_ADMIN_CHAT_ID', label: 'Chat ID Admin (alertes KYC, plaintes)', type: 'text', placeholder: '-1001234567890' }
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
        id: 'whatsapp-meta',
        name: 'Configuration WhatsApp Business',
        description: 'Communication Cloud API Meta (Bots, Templates, Relances).',
        icon: '💬',
        docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
        webhookUrl: '/api/webhooks/whatsapp-bot',
        pingType: 'generic',
        fields: [
          { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Phone Number ID', type: 'text', placeholder: '1023456789...' },
          { key: 'WHATSAPP_ACCESS_TOKEN', label: 'Access Token (Permanent)', type: 'password' },
          { key: 'WHATSAPP_VERIFY_TOKEN', label: 'Webhook Verify Token', type: 'password', placeholder: 'MonSecret123...' }
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
