// ─── app/dashboard/wallet/page.tsx ───────────────────────────────────────────
// Server Component — Portefeuille vendeur
// Charge en parallèle : store, wallet, 10 dernières commandes

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WithdrawForm from './WithdrawForm'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoreData {
  id:                string
  withdrawal_method: string | null
  withdrawal_number: string | null
  withdrawal_name:   string | null
}

interface WalletData {
  balance:      number
  pending:      number
  total_earned: number
}

interface OrderRow {
  id:            string
  created_at:    string
  vendor_amount: number
  status:        string
  buyer_name:    string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function formatDate(iso: string): string {
  const now  = new Date()
  const date = new Date(iso)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60)    return "à l'instant"
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'hier'

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const METHOD_LABELS: Record<string, string> = {
  wave:         'Wave',
  orange_money: 'Orange Money',
  bank:         'Virement bancaire',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Récupérer le store du vendeur
  const { data: storeRaw } = await supabase
    .from('Store')
    .select('id, withdrawal_method, withdrawal_number, withdrawal_name')
    .eq('user_id', user.id)
    .single()

  const store = storeRaw as StoreData | null
  if (!store) redirect('/dashboard')

  // 2. Charger wallet + commandes en parallèle avec le store.id
  const [walletRes, recentOrdersRes] = await Promise.all([
    supabase
      .from('Wallet')
      .select('balance, pending, total_earned')
      .eq('vendor_id', store.id)
      .single(),
    supabase
      .from('Order')
      .select('id, created_at, vendor_amount, status, buyer_name')
      .eq('store_id', store.id)
      .in('status', ['completed', 'paid'])
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const wallet       = walletRes.data as WalletData | null
  const recentOrders = (recentOrdersRes.data ?? []) as OrderRow[]

  const balance     = Number(wallet?.balance)      || 0
  const pending     = Number(wallet?.pending)      || 0
  const totalEarned = Number(wallet?.total_earned) || 0

  const hasWithdrawalAccount = !!store.withdrawal_number?.trim()
  const canWithdraw          = hasWithdrawalAccount && balance >= 5000
  const methodLabel          = METHOD_LABELS[store.withdrawal_method ?? 'wave'] ?? 'Wave'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── En-tête ── */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-[#0F7A60]/10">
            <span className="text-xl">💰</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Mon Portefeuille</h1>
        </div>
        <p className="text-sm text-gray-400 ml-12">
          Suivez vos revenus et effectuez vos retraits.
        </p>
      </header>

      {/* ── Alerte : compte de retrait non configuré ── */}
      {!hasWithdrawalAccount && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              Compte de retrait non configuré
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Configurez votre compte Wave, Orange Money ou bancaire dans les Paramètres
              avant de pouvoir effectuer un retrait.
            </p>
            <Link
              href="/dashboard/settings#retrait"
              className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#0F7A60] hover:underline"
            >
              Configurer maintenant →
            </Link>
          </div>
        </div>
      )}

      {/* ── 3 Cards stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Solde disponible */}
        <div className="bg-[#0F7A60] rounded-2xl p-5 text-white shadow-sm col-span-1">
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
            Solde disponible
          </p>
          <p className="text-2xl font-black leading-none">
            {new Intl.NumberFormat('fr-FR').format(balance)}
          </p>
          <p className="text-sm text-white/70 mt-1">FCFA</p>
        </div>

        {/* En attente */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            En attente
          </p>
          <p className="text-2xl font-black text-[#C9A84C] leading-none">
            {new Intl.NumberFormat('fr-FR').format(pending)}
          </p>
          <p className="text-sm text-gray-400 mt-1">FCFA</p>
        </div>

        {/* Total gagné */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Total gagné
          </p>
          <p className="text-2xl font-black text-[#1A1A1A] leading-none">
            {new Intl.NumberFormat('fr-FR').format(totalEarned)}
          </p>
          <p className="text-sm text-gray-400 mt-1">FCFA cumulés</p>
        </div>
      </div>

      {/* ── Compte de retrait (readonly) ── */}
      {hasWithdrawalAccount && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">💳</span>
              <p className="text-sm font-black text-[#1A1A1A]">Compte de retrait</p>
            </div>
            <Link
              href="/dashboard/settings#retrait"
              className="text-xs font-bold text-[#0F7A60] hover:underline"
            >
              Modifier →
            </Link>
          </div>
          <div className="bg-[#FAFAF7] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center text-lg flex-shrink-0">
              {store.withdrawal_method === 'wave'         ? '🌊'
                : store.withdrawal_method === 'orange_money' ? '🟠'
                : '🏦'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A1A1A]">{methodLabel}</p>
              <p className="text-xs text-gray-500 font-mono truncate mt-0.5">
                {store.withdrawal_number}
              </p>
              {store.withdrawal_name && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Au nom de : <strong>{store.withdrawal_name}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Section retrait ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-black text-[#1A1A1A] mb-1">Demander un retrait</h2>
        <p className="text-xs text-gray-400 mb-4">
          Minimum : {formatAmount(5000)} · Délai de traitement : 24–48h
        </p>

        {canWithdraw ? (
          <WithdrawForm
            balance={balance}
            withdrawalMethod={store.withdrawal_method ?? 'wave'}
            withdrawalNumber={store.withdrawal_number ?? ''}
            withdrawalName={store.withdrawal_name ?? ''}
            storeId={store.id}
          />
        ) : (
          <div className="space-y-3">
            <button
              disabled
              className="w-full py-3 text-sm font-bold text-white bg-gray-300 rounded-xl cursor-not-allowed"
            >
              Demander un retrait
            </button>
            {!hasWithdrawalAccount ? (
              <p className="text-xs text-amber-600 text-center">
                ⚠️ Configurez votre compte de retrait dans les{' '}
                <Link href="/dashboard/settings#retrait" className="underline font-bold">
                  Paramètres
                </Link>{' '}
                en premier.
              </p>
            ) : (
              <p className="text-xs text-gray-400 text-center">
                Solde insuffisant — minimum : {formatAmount(5000)}
                {' '}· Solde actuel : <strong>{formatAmount(balance)}</strong>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Dernières transactions ── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-black text-[#1A1A1A]">📋 Dernières transactions</h2>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-gray-400">Aucune transaction pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3.5
                  hover:bg-[#FAFAF7] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#0F7A60]/10 flex items-center
                    justify-center flex-shrink-0">
                    <span className="text-sm text-[#0F7A60] font-black">
                      {order.buyer_name?.[0]?.toUpperCase() ?? 'C'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1A1A1A] truncate">
                      {order.buyer_name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <p className="text-sm font-black text-[#0F7A60]">
                    +{new Intl.NumberFormat('fr-FR').format(Number(order.vendor_amount))} FCFA
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
