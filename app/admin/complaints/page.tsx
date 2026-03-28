import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  const { data: userData } = await supabase.from('User').select('role').eq('id', user.id).single()
  if (!userData || !['super_admin', 'gestionnaire'].includes(userData.role)) {
    redirect('/dashboard')
  }

  const supabaseAdmin = createAdminClient()

  // Toutes les plaintes, triées par date décroissante
  const { data: complaints } = await supabaseAdmin
    .from('Complaint')
    .select('id, type, description, status, created_at, store_id, product_id, reporter_id, evidence_url, admin_notes, Store(name)')
    .order('created_at', { ascending: false })

  const list = (complaints as unknown as ComplaintRow[]) ?? []

  // ─── INJECTION MOCK DATA (Mode Démo) ───
  let displayList = list
  let isDemoMode = false
  if (displayList.length === 0) {
    isDemoMode = true
    const now = new Date()
    displayList = [
      {
        id: 'mock-comp-1',
        type: 'fraude',
        description: "La commande a été payée, mais le vendeur refuse de livrer et ne répond plus sur WhatsApp depuis 3 jours. C'est une arnaque !",
        status: 'investigating',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(), // Il y a 2 jours
        store_id: 'store-demo-1',
        product_id: 'prod-demo-1',
        reporter_id: 'user-plaignant-1',
        evidence_url: 'https://images.unsplash.com/photo-1550000000-000000000000?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NTYyMDF8MHwxfHNlYXJjaHwyfHxwcm9vZnxlbnwwfHx8fDE3MTUyNDkwNDJ8MA&ixlib=rb-4.0.3&q=80&w=400',
        admin_notes: 'J\'ai contacté Wave pour vérifier le Payout de cette transaction.',
        Store: { name: 'Elite Sneakers SN' }
      },
      {
        id: 'mock-comp-2',
        type: 'plagiat',
        description: "Cette boutique a volé toutes mes images de produits, même mes descriptions copywritées mot pour mot ! Je demande la suspension.",
        status: 'pending',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(), // Il y a 5 heures
        store_id: 'store-demo-2',
        product_id: 'prod-demo-2',
        reporter_id: 'user-plaignant-2',
        evidence_url: null,
        admin_notes: null,
        Store: { name: 'Tech Store Cheap' }
      },
      {
        id: 'mock-comp-3',
        type: 'contenu_inapproprie',
        description: "Le vendeur utilise des images explicites pour vendre de la lingerie, ce qui enfreint les règles de la Marketplace.",
        status: 'pending',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        store_id: 'store-demo-3',
        product_id: null,
        reporter_id: 'user-plaignant-3',
        evidence_url: 'https://images.unsplash.com/photo-1600000000-000000000000?auto=format&fit=crop&q=80',
        admin_notes: null,
        Store: { name: 'Sensual Vibes' }
      },
      {
        id: 'mock-comp-4',
        type: 'autre',
        description: "Article livré cassé (une montre intelligente). J'ai refusé de payer à la livraison mais le livreur m'a forcé la main.",
        status: 'resolved',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        store_id: 'store-demo-4',
        product_id: 'prod-demo-4',
        reporter_id: 'user-plaignant-4',
        evidence_url: null,
        admin_notes: 'Commande annulée, coursier réprimandé. Remboursement acheteur validé.',
        Store: { name: 'Chronos Watches' }
      },
      {
        id: 'mock-comp-5',
        type: 'fraude',
        description: "Signalement de tentatives de phishing : le vendeur demande aux clients de cliquer sur un lien externe pour payer moins cher.",
        status: 'dismissed',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        store_id: 'store-demo-5',
        product_id: null,
        reporter_id: 'user-plaignant-5',
        evidence_url: null,
        admin_notes: 'Fausse alerte, dénonciation calomnieuse de la part d\'un concurrent.',
        Store: { name: 'Boutique Cosmétique' }
      }
    ]
  }

  return (
    <div className="animate-in fade-in duration-500">
      <ComplaintsClient complaints={displayList} isDemoMode={isDemoMode} />
    </div>
  )
}
