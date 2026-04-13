import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Payment Processors registered in admin/integrations ───
// These exactly mirror app/admin/integrations/config.ts > category "Paiements"
const PAYMENT_PROCESSORS = [
  {
    id: 'wave',
    label: 'Wave',
    subtitle: 'Paiement direct Wave',
    enabledKey: 'WAVE_ENABLED',
    requiredKeys: ['WAVE_API_KEY'],
    priority: 1,
    color: '#1ebbf0',
    icon: '/wave.svg',
  },
  {
    id: 'bictorys',
    label: 'Bictorys',
    subtitle: 'CB, Mobile Money, Wave',
    enabledKey: 'BICTORYS_ENABLED',
    requiredKeys: ['BICTORYS_SECRET_KEY'],
    priority: 2,
    color: '#6366F1',
    icon: '/bictorys.png',
  },
  {
    id: 'paytech',
    label: 'PayTech',
    subtitle: 'CB, Wave, OM, Free Money',
    enabledKey: 'PAYTECH_ENABLED',
    requiredKeys: ['PAYTECH_API_KEY'],
    priority: 3,
    color: '#F97316',
    icon: '/paytech.png',
  },
  {
    id: 'cinetpay',
    label: 'CinetPay',
    subtitle: 'CB, Mobile Money multi-pays',
    enabledKey: 'CINETPAY_ENABLED',
    requiredKeys: ['CINETPAY_API_KEY', 'CINETPAY_SITE_ID'],
    priority: 4,
    color: '#059669',
    icon: '/cinetpay.png',
  },
  {
    id: 'moneroo',
    label: 'Moneroo',
    subtitle: 'Orchestrateur multi-PSP',
    enabledKey: 'MONEROO_ENABLED',
    requiredKeys: ['MONEROO_SECRET_KEY'],
    priority: 5,
    color: '#8B5CF6',
    icon: '🔀',
  },
]

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Collect all keys we need to check
    const allKeys = [
      ...PAYMENT_PROCESSORS.map(p => p.enabledKey),
      ...PAYMENT_PROCESSORS.flatMap(p => p.requiredKeys),
    ]

    const { data } = await supabase
      .from('IntegrationKey')
      .select('key, value')
      .in('key', allKeys)

    const keyMap: Record<string, string> = {}
    if (data) {
      for (const row of data) {
        keyMap[row.key] = row.value
      }
    }

    // Filter: processor is available if ENABLED !== 'false' AND all required keys exist
    const available = PAYMENT_PROCESSORS
      .filter(p => {
        const isEnabled = keyMap[p.enabledKey] !== 'false' // Default true if absent
        const hasKeys = p.requiredKeys.every(k => !!keyMap[k])
        return isEnabled && hasKeys
      })
      .sort((a, b) => a.priority - b.priority)
      .map(p => ({
        id: p.id,
        label: p.label,
        subtitle: p.subtitle,
        color: p.color,
        icon: p.icon,
      }))

    return NextResponse.json(
      { methods: available },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('[payments/available] Error:', error)
    return NextResponse.json({ methods: [] }, { status: 500 })
  }
}
