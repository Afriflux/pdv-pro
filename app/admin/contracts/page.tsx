import { createAdminClient } from '@/lib/supabase/admin'
import { FileSignature, Search, ShieldAlert, ShieldCheck, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    page?: string
  }>
}

export default async function AdminContractsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = createAdminClient()

  const query = params.q ?? ''

  // 1. Récupérer les vendeurs (Stores)
  let storeQuery = supabase
    .from('Store')
    .select('id, name, contract_accepted, contract_accepted_at, User(name, email)')

  if (query) {
    storeQuery = storeQuery.ilike('name', `%${query}%`)
  }

  const { data: stores } = await storeQuery

  // 2. Récupérer les affiliés
  const affQuery = supabase
    .from('Affiliate')
    .select('id, user_id, contract_accepted, contract_accepted_at, User(name, email)')

  // Affiliates don't have their own names in search easily, but we'll fetch them all (or limit) and filter visually 
  const { data: affiliates } = await affQuery

  const allContracts = [
    ...(stores || []).map((s: any) => ({
      id: s.id,
      entityName: s.name,
      userName: s.User?.name || 'Inconnu',
      userEmail: s.User?.email || '',
      type: 'Vendeur',
      accepted: s.contract_accepted,
      acceptedAt: s.contract_accepted_at
    })),
    ...(affiliates || []).map((a: any) => ({
      id: a.id,
      entityName: a.User?.name || 'Inconnu',
      userName: a.User?.name || 'Inconnu',
      userEmail: a.User?.email || '',
      type: 'Affilié',
      accepted: a.contract_accepted,
      acceptedAt: a.contract_accepted_at
    }))
  ]

  // Filter if query in memory for affiliates
  const filteredContracts = allContracts.filter(c => 
    c.entityName.toLowerCase().includes(query.toLowerCase()) || 
    c.userName.toLowerCase().includes(query.toLowerCase()) || 
    c.userEmail.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => {
    if (a.accepted && !b.accepted) return 1;
    if (!a.accepted && b.accepted) return -1;
    return new Date(b.acceptedAt || 0).getTime() - new Date(a.acceptedAt || 0).getTime();
  })

  // KPIs
  const total = filteredContracts.length
  const signed = filteredContracts.filter(c => c.accepted).length
  const pending = total - signed

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-20">
      
      {/* ── HEADER ── */}
      <header className="w-full bg-gradient-to-r from-[#012928] via-[#0A4138] to-[#04332A] pt-6 pb-16 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <FileSignature className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Contrats & Légals</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                Suivi des signatures des conditions générales Yayyam.
              </p>
            </div>
          </div>

          <form action="/admin/contracts" method="GET" className="relative group max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-emerald-100/50 group-focus-within:text-emerald-300 transition-colors" />
            </div>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Chercher un partenaire..."
              className="w-full pl-11 pr-4 py-3 bg-white/10 border-white/20 text-white placeholder-emerald-100/50 rounded-2xl focus:bg-white/20 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 transition-all font-medium text-sm"
            />
          </form>
        </div>

        {/* ── KPIs ── */}
        <div className="relative z-10 mt-6 grid grid-cols-3 gap-3 max-w-3xl">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
            <span className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Total Partenaires</span>
            <span className="text-xl font-black text-white">{total}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
            <span className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
               <ShieldCheck size={12} /> Contrats Signés
            </span>
            <span className="text-xl font-black text-emerald-300">{signed}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
            <span className="text-amber-100 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
               <ShieldAlert size={12} /> En Attente
            </span>
            <span className="text-xl font-black text-amber-300">{pending}</span>
          </div>
        </div>
      </header>

      {/* ── TABLE ── */}
      <div className="flex flex-col gap-6 w-full relative z-20 px-6 lg:px-10 -mt-8 items-start">
        <div className="w-full bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100/80">
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400">Partenaire</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400">Rôle</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400">Statut Contrat</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-gray-400">Date Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">Aucun résultat trouvé.</td>
                  </tr>
                ) : (
                  filteredContracts.map((contact, i) => (
                    <tr key={contact.id + i} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{contact.entityName}</div>
                        <div className="text-xs text-gray-400">{contact.userEmail}</div>
                      </td>
                      <td className="px-4 py-4">
                         <span className={`inline-flex px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded border ${
                           contact.type === 'Vendeur' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-cyan-50 text-cyan-600 border-cyan-100'
                         }`}>
                           {contact.type}
                         </span>
                      </td>
                      <td className="px-4 py-4">
                        {contact.accepted ? (
                           <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full w-fit border border-emerald-100">
                             <CheckCircle2 size={14} /> Signé
                           </div>
                        ) : (
                           <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs bg-amber-50 px-2.5 py-1 rounded-full w-fit border border-amber-100">
                              <ShieldAlert size={14} /> Manquant
                           </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-gray-500">
                        {contact.accepted && contact.acceptedAt 
                           ? new Date(contact.acceptedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'})
                           : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
