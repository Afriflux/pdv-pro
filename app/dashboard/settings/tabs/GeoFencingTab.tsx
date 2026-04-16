'use client'

import React, { useState } from 'react'
import { MapPin, Globe, CheckCircle2, ShieldAlert, Navigation } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { COUNTRIES } from '@/components/providers/GeoProvider'

export function GeoFencingTab({ store }: { store: any }) {
  const router = useRouter()
  const [baseCountry, setBaseCountry] = useState(store?.base_country || 'SN')
  const [targetCountries, setTargetCountries] = useState<string[]>(store?.target_countries || [])
  const [loading, setLoading] = useState(false)

  const handleToggleTarget = (code: string) => {
    if (code === 'ALL') {
      setTargetCountries([])
      return
    }
    setTargetCountries(prev => {
      if (prev.includes(code)) return prev.filter(c => c !== code)
      return [...prev, code]
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/update-field', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'geo', value: { base_country: baseCountry, target_countries: targetCountries } }),
      })
      if (!res.ok) throw new Error('Erreur de sauvegarde')
      
      toast.success('Règles de localisation mises à jour')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const isGlobal = targetCountries.length === 0

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        <div className="h-48 sm:h-64 w-full relative bg-[#F7F9FC] overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/20"></div>
          <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10">
            <Globe size={240} strokeWidth={0.5} />
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          <div className="relative -mt-16 sm:-mt-20 mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-white p-2 shadow-xl relative z-10">
              <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-blue-50 flex items-center justify-center relative border border-blue-100">
                <MapPin size={36} className="text-blue-600" />
              </div>
            </div>
          </div>
            
          <div className="pb-8 space-y-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Geo-Fencing Privé</h2>
            <p className="text-[14px] text-gray-500 font-medium">Contrôlez les zones géographiques où votre boutique est visible et active.</p>
          </div>

          <div className="space-y-10">
            
            {/* Base Country */}
            <div className="bg-white/40 p-6 sm:p-8 rounded-[2rem] border border-gray-200/50">
              <h4 className="text-[16px] font-black text-gray-900 flex items-center gap-2 mb-2">
                <Navigation size={18} className="text-blue-500" /> Pays de Résidence
              </h4>
              <p className="text-[13px] text-gray-500 font-medium mb-6">D\'où expédiez-vous vos produits ou gérez-vous vos services ?</p>
              
              <div className="relative max-w-sm">
                <select 
                  title="Pays de résidence"
                  value={baseCountry} 
                  onChange={(e) => setBaseCountry(e.target.value)}
                  className="w-full px-5 py-4 bg-white/80 border border-gray-200/80 rounded-[1rem] focus:ring-0 focus:border-blue-500 font-bold text-gray-900 appearance-none shadow-sm outline-none"
                >
                  {COUNTRIES.filter(c => c.code !== 'ALL').map(c => (
                    <option key={c.code} value={c.code}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Countries */}
            <div className="bg-white/40 p-6 sm:p-8 rounded-[2rem] border border-gray-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-[16px] font-black text-gray-900 flex items-center gap-2 mb-2">
                    <ShieldAlert size={18} className="text-emerald-500" /> Zones Ciblées (Filtrage public)
                  </h4>
                  <p className="text-[13px] text-gray-500 font-medium max-w-xl">
                    Seuls les clients situés dans ces pays verront votre boutique sur la marketplace.
                  </p>
                </div>
                
                <button 
                  onClick={() => handleToggleTarget('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isGlobal ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                >
                  🌍 Vendre au Monde Entier
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {COUNTRIES.filter(c => c.code !== 'ALL').map(country => {
                  const isSelected = targetCountries.includes(country.code)
                  return (
                    <button
                      key={country.code}
                      onClick={() => handleToggleTarget(country.code)}
                      disabled={isGlobal}
                      className={`px-5 py-3 rounded-2xl flex items-center gap-3 transition-all font-bold text-sm ${
                        isGlobal 
                          ? 'opacity-40 cursor-not-allowed bg-gray-50 border border-gray-200' 
                          : isSelected 
                            ? 'bg-blue-600 text-white shadow-lg border border-blue-500 scale-105' 
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      {country.emoji} {country.name}
                      {isSelected && !isGlobal && <CheckCircle2 size={16} />}
                    </button>
                  )
                })}
              </div>

              {isGlobal && (
                <div className="mt-6 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in">
                  <Globe className="text-emerald-500 shrink-0" size={24} />
                  Vous ciblez actuellement TOUT LE MONDE. Aucune restriction géographique n\'est appliquée à votre boutique.
                </div>
              )}
            </div>

          </div>

          <div className="mt-8 flex justify-end border-t border-gray-200/50 pt-8">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <CheckCircle2 size={18} />}
              Appliquer les règles
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
