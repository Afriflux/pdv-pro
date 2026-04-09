'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Loader2, Save, Percent, Coins, ArrowUpRight, TrendingDown, Package, ShieldCheck } from 'lucide-react'
import { updatePlatformConfig, AdminPlatformConfig } from '@/lib/admin/adminActions'

interface FinancesSectionProps {
  initialConfig: AdminPlatformConfig
}

export default function FinancesSection({ initialConfig }: FinancesSectionProps) {
  const [tier1, setTier1] = useState<number>(initialConfig.tier_1)
  const [tier2, setTier2] = useState<number>(initialConfig.tier_2)
  const [tier3, setTier3] = useState<number>(initialConfig.tier_3)
  const [tier4, setTier4] = useState<number>(initialConfig.tier_4)
  const [cod, setCod]     = useState<number>(initialConfig.cod)
  
  const [feeFixed, setFeeFixed]       = useState<number>(initialConfig.fee_fixed)
  const [minWithdrawal, setMinWithdrawal] = useState<number>(initialConfig.min_withdrawal)
  
  const [taxVatEnabled, setTaxVatEnabled] = useState<boolean>(initialConfig.tax_vat_enabled || false)
  const [taxVatRate, setTaxVatRate] = useState<number>(initialConfig.tax_vat_rate || 18)

  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    // Garde-fou mathématique : Les taux doivent être dégressifs ou égaux (tier1 >= tier2 >= tier3 >= tier4)
    if (tier1 < tier2 || tier2 < tier3 || tier3 < tier4) {
      toast.error('Erreur Mathématique ⚠️ : Les paliers de commission en ligne doivent être dégressifs (ex: 8% -> 7% -> 6% -> 5%).')
      setSaving(false)
      return
    }

    try {
      await updatePlatformConfig({
        tier_1: tier1,
        tier_2: tier2,
        tier_3: tier3,
        tier_4: tier4,
        cod: cod,
        fee_fixed: feeFixed,
        min_withdrawal: minWithdrawal,
        tax_vat_enabled: taxVatEnabled,
        tax_vat_rate: taxVatRate
      })
      toast.success('Paliers de commission sauvegardés avec succès ✅')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl py-3 pl-4 pr-11 text-sm font-black text-[#1A1A1A] ' +
    'focus:bg-white focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0F7A60]/10 outline-none transition-all duration-300 ' +
    'shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-gray-400 ' +
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  const labelCls = 'block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1'

  return (
    <form onSubmit={handleSave} className="space-y-8">
      
      {/* ── SECTIONS PALIER DE VENTES (ONLNE) ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-[#0F7A60]" />
          <h3 className="text-sm font-bold text-gray-800">Taux Dégressifs (Ventes Wave, OM, Carte)</h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50">
          <div>
            <label className={labelCls}>0 - 100K FCFA</label>
            <div className="relative">
              <input title="Commission 0-100K" placeholder="%" type="number" step="0.1" value={tier1} onChange={e => setTier1(Number(e.target.value))} className={inputCls} required />
              <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F7A60]" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Débutant</p>
          </div>
          <div>
            <label className={labelCls}>100K - 500K FCFA</label>
            <div className="relative">
              <input title="Commission 100K-500K" placeholder="%" type="number" step="0.1" value={tier2} onChange={e => setTier2(Number(e.target.value))} className={inputCls} required />
              <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F7A60]" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Actif</p>
          </div>
          <div>
            <label className={labelCls}>500K - 1M FCFA</label>
            <div className="relative">
              <input title="Commission 500K-1M" placeholder="%" type="number" step="0.1" value={tier3} onChange={e => setTier3(Number(e.target.value))} className={inputCls} required />
              <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F7A60]" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Pro</p>
          </div>
          <div>
            <label className={labelCls}>+ 1M FCFA</label>
            <div className="relative">
              <input title="Commission 1M+" placeholder="%" type="number" step="0.1" value={tier4} onChange={e => setTier4(Number(e.target.value))} className={inputCls} required />
              <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F7A60]" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Elite</p>
          </div>
        </div>
      </div>

      {/* ── AUTRES CONDITIONS ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-800">Politiques Paiement à la Livraison & Retraits</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* COD */}
          <div>
            <label className={labelCls}>Commission COD Fixe</label>
            <div className="relative">
              <input title="Commission COD" placeholder="%" type="number" step="0.1" value={cod} onChange={e => setCod(Number(e.target.value))} className={inputCls} required />
              <Package className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Prélevé indépendamment du CA.</p>
          </div>

          {/* Frais fixes */}
          <div>
            <label className={labelCls}>Frais Fixes / Vente</label>
            <div className="relative">
              <input title="Frais de retrait fixes" placeholder="Frais en FCFA" type="number" value={feeFixed} onChange={e => setFeeFixed(Number(e.target.value))} className={inputCls} required />
              <Coins className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Coût additionel au taux.</p>
          </div>

          {/* Retrait Minimum */}
          <div>
            <label className={labelCls}>Retrait Minimum</label>
            <div className="relative">
              <input title="Seuil minimal de retrait" placeholder="Montant en FCFA" type="number" value={minWithdrawal} onChange={e => setMinWithdrawal(Number(e.target.value))} className={inputCls} required />
              <ArrowUpRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Seuil minimal (Traitement Auto/48H).</p>
          </div>

          {/* TVA Optionnelle */}
          <div>
            <label className={labelCls}>Taxe / TVA (%)</label>
            <div className="relative flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" title="Activer la TVA" checked={taxVatEnabled} onChange={(e) => setTaxVatEnabled(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F7A60]"></div>
              </label>
              <div className="relative flex-1">
                 <input disabled={!taxVatEnabled} title="Taux de TVA" placeholder="%" type="number" step="0.1" value={taxVatRate} onChange={e => setTaxVatRate(Number(e.target.value))} className={`${inputCls} ${!taxVatEnabled && 'opacity-50'}`} required />
                 <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F7A60]" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Optionnel. Collecte Taxe Numérique.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0F7A60] to-teal-500 hover:from-[#0D5C4A] hover:to-[#0F7A60]
            disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl transition-all shadow-[0_4px_15px_rgba(15,122,96,0.2)] hover:shadow-[0_6px_20px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Enregistrer la politique'}
        </button>
      </div>
    </form>
  )
}
