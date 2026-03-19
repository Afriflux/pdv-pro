import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import ComplaintsClient from './ComplaintsClient'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ComplaintRow {
  id:          string
  type:        string
  description: string
  status:      'pending' | 'investigating' | 'resolved' | 'dismissed'
  created_at:  string
  store_id:    string | null
  product_id:  string | null
  reporter_id: string | null
  evidence_url: string | null
  admin_notes: string | null
  Store:       { name: string } | null
}

// ─── PAGE ADMIN PLAINTES — Server Component ───────────────────────────────────
export default async function AdminComplaintsPage() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()

  // Toutes les plaintes, triées par date décroissante
  const { data: complaints } = await supabaseAdmin
    .from('Complaint')
    .select('id, type, description, status, created_at, store_id, product_id, reporter_id, evidence_url, admin_notes, Store(name)')
    .order('created_at', { ascending: false })

  const list = (complaints as unknown as ComplaintRow[]) ?? []

  // Stats rapides
  const byStatus = {
    pending:       list.filter(c => c.status === 'pending').length,
    investigating: list.filter(c => c.status === 'investigating').length,
    resolved:      list.filter(c => c.status === 'resolved').length,
    dismissed:     list.filter(c => c.status === 'dismissed').length,
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* ── EN-TÊTE ── */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-red-50 text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Plaintes & Signalements</h1>
        </div>
        <p className="text-gray-400 text-sm">Traitez les signalements de fraude, plagiat et contenus inappropriés.</p>
      </header>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'En attente',    count: byStatus.pending,       color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'En cours',      count: byStatus.investigating, color: 'bg-blue-50 text-blue-600 border-blue-100'    },
          { label: 'Résolues',      count: byStatus.resolved,      color: 'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20' },
          { label: 'Rejetées',      count: byStatus.dismissed,     color: 'bg-gray-50 text-gray-500 border-gray-200'    },
        ] as const).map(stat => (
          <div key={stat.label} className={`border rounded-2xl p-4 ${stat.color}`}>
            <p className="text-2xl font-black">{stat.count}</p>
            <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── TABLEAU — Composant client pour les filtres interactifs ── */}
      <ComplaintsClient complaints={list} />

    </div>
  )
}
