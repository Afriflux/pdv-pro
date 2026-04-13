'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Trash2, Edit3, Star, CheckCircle2, AlertCircle, Loader2, Navigation, X, Home, Briefcase, MapPinned, ExternalLink, MessageSquare } from 'lucide-react'
import { addDeliveryAddress, updateDeliveryAddress, setDefaultAddress, deleteDeliveryAddress } from './actions'

const MAX_ADDRESSES = 3

interface Address {
  id: string
  label: string
  name: string
  phone: string
  address: string
  city: string | null
  latitude: number | null
  longitude: number | null
  delivery_notes: string | null
  is_default: boolean
  created_at: string
}

interface AddressesClientProps {
  addresses: Address[]
  profileName: string
  profilePhone: string
}

const LABEL_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  'Domicile': { icon: <Home className="w-4 h-4" />, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Bureau': { icon: <Briefcase className="w-4 h-4" />, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Autre': { icon: <MapPinned className="w-4 h-4" />, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
}

export default function AddressesClient({ addresses, profileName, profilePhone }: AddressesClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Géolocalisation
  const [locating, setLocating] = useState(false)
  const [geoAddress, setGeoAddress] = useState('')
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null)

  const canAddMore = addresses.length < MAX_ADDRESSES

  const showMessage = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') { setSuccess(msg); setError('') }
    else { setError(msg); setSuccess('') }
    setTimeout(() => { setSuccess(''); setError('') }, 3500)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showMessage('error', 'La géolocalisation n\'est pas supportée par votre navigateur.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          setGeoCoords({ lat: latitude, lng: longitude })
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json() as {
            address?: { road?: string; suburb?: string; city?: string; town?: string; country?: string }
          }
          const addr = [
            data.address?.road,
            data.address?.suburb,
            data.address?.city ?? data.address?.town,
            data.address?.country
          ].filter(Boolean).join(', ')
          setGeoAddress(addr)
        } catch {
          showMessage('error', 'Impossible de récupérer votre position.')
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        showMessage('error', 'Accès à la localisation refusé.')
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    // Ajouter les coordonnées GPS si disponibles
    if (geoCoords) {
      formData.set('latitude', String(geoCoords.lat))
      formData.set('longitude', String(geoCoords.lng))
    } else if (editingAddress?.latitude && editingAddress?.longitude) {
      formData.set('latitude', String(editingAddress.latitude))
      formData.set('longitude', String(editingAddress.longitude))
    }

    try {
      let res
      if (editingAddress) {
        res = await updateDeliveryAddress(editingAddress.id, formData)
      } else {
        res = await addDeliveryAddress(formData)
      }

      if (res.error) {
        showMessage('error', res.error)
      } else {
        showMessage('success', editingAddress ? 'Adresse modifiée avec succès.' : 'Adresse ajoutée avec succès.')
        setIsModalOpen(false)
        setEditingAddress(null)
        setGeoAddress('')
        setGeoCoords(null)
        router.refresh()
      }
    } catch {
      showMessage('error', 'Une erreur réseau est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette adresse de livraison ?')) return
    setDeletingId(id)
    const res = await deleteDeliveryAddress(id)
    if (res.error) showMessage('error', res.error)
    else {
      showMessage('success', 'Adresse supprimée.')
      router.refresh()
    }
    setDeletingId(null)
  }

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id)
    const res = await setDefaultAddress(id)
    if (res.error) showMessage('error', res.error)
    else {
      showMessage('success', 'Adresse par défaut mise à jour.')
      router.refresh()
    }
    setSettingDefaultId(null)
  }

  const openEdit = (addr: Address) => {
    setEditingAddress(addr)
    setGeoAddress('')
    setGeoCoords(addr.latitude && addr.longitude ? { lat: addr.latitude, lng: addr.longitude } : null)
    setIsModalOpen(true)
  }

  const openAdd = () => {
    if (!canAddMore) {
      showMessage('error', `Limite de ${MAX_ADDRESSES} adresses atteinte. Supprimez-en une pour en ajouter une nouvelle.`)
      return
    }
    setEditingAddress(null)
    setGeoAddress('')
    setGeoCoords(null)
    setIsModalOpen(true)
  }

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  }

  return (
    <div className="w-full relative pb-10">
      
      {/* ── HEADER PREMIUM ÉMERAUDE ── */}
      <header className="bg-gradient-to-br from-[#0F7A60] via-[#0b5341] to-[#1A1A1A] border border-[#0F7A60]/50 rounded-[2.5rem] px-8 py-10 shadow-[0_10px_40px_rgba(15,122,96,0.3)] mb-10 w-full relative z-10 overflow-hidden text-white flex flex-col md:flex-row md:items-end justify-between gap-6 group">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#0F7A60]/20 blur-3xl rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.2rem] text-emerald-300 border border-white/10 shadow-lg">
               <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">Mes Adresses</h1>
              <p className="text-gray-400 mt-1 font-medium">Gérez vos lieux de livraison pour commander plus rapidement.</p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <span className="text-sm font-bold text-white/50">{addresses.length}/{MAX_ADDRESSES}</span>
            <button
              onClick={openAdd}
              disabled={!canAddMore}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Ajouter une adresse
            </button>
          </div>
      </header>

      {/* Messages globaux */}
      {(success || error) && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in zoom-in-95 ${success ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-red-50 text-red-600 border border-red-200 shadow-sm'}`}>
           {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
           <span>{success || error}</span>
        </div>
      )}

      {/* ── GRILLE D'ADRESSES ── */}
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-emerald-200/50 mb-6 text-emerald-400 animate-bounce">
            <MapPin size={40} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Aucune adresse enregistrée</h3>
          <p className="text-gray-500 text-sm mb-8 max-w-md font-medium leading-relaxed">
            Ajoutez votre adresse de domicile ou de bureau pour pré-remplir automatiquement la livraison lors de vos prochains achats.
          </p>
          <button 
            onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#0F7A60] hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-[0_8px_20px_rgba(15,122,96,0.25)] hover:-translate-y-1"
          >
            <Plus size={18} />
            Ajouter ma première adresse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {addresses.map((addr) => {
            const labelConf = LABEL_CONFIG[addr.label] || LABEL_CONFIG['Autre']
            return (
              <div 
                key={addr.id} 
                className={`relative bg-white/80 backdrop-blur-xl rounded-[2rem] border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden group/card ${
                  addr.is_default ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-gray-200/60'
                }`}
              >
                {/* Badge par défaut */}
                {addr.is_default && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" />
                    Adresse par défaut
                  </div>
                )}

                <div className={`p-6 ${addr.is_default ? 'pt-10' : ''}`}>
                  {/* Label + Nom */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${labelConf.bg} ${labelConf.color} border ${labelConf.border} shadow-sm`}>
                        {labelConf.icon}
                      </div>
                      <div>
                        <span className={`text-xs font-black uppercase tracking-widest ${labelConf.color}`}>{addr.label}</span>
                        <h3 className="font-black text-gray-900 text-lg leading-tight tracking-tight">{addr.name}</h3>
                      </div>
                    </div>

                    {/* Bouton Maps si GPS */}
                    {addr.latitude && addr.longitude && (
                      <button
                        onClick={() => openInMaps(addr.latitude!, addr.longitude!)}
                        title="Ouvrir dans Google Maps"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink size={11} />
                        Maps
                      </button>
                    )}
                  </div>

                  {/* Détails */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600 font-medium flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{addr.address}</span>
                    </p>
                    {addr.city && (
                      <p className="text-sm text-gray-500 font-medium pl-6">{addr.city}</p>
                    )}
                    <p className="text-sm text-gray-500 font-medium pl-6">{addr.phone}</p>
                  </div>

                  {/* Notes livreur */}
                  {addr.delivery_notes && (
                    <div className="mb-4 p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-800 font-medium italic line-clamp-2">{addr.delivery_notes}</p>
                    </div>
                  )}

                  {/* GPS indicator */}
                  {addr.latitude && addr.longitude && (
                    <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 w-fit">
                      <Navigation size={10} className="fill-emerald-500" />
                      GPS enregistré
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
                    <button 
                      onClick={() => openEdit(addr)} 
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-[#0F7A60] hover:bg-emerald-50 rounded-xl transition-colors"
                    >
                      <Edit3 size={14} /> Modifier
                    </button>
                    
                    {!addr.is_default && (
                      <button 
                        onClick={() => handleSetDefault(addr.id)}
                        disabled={settingDefaultId === addr.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {settingDefaultId === addr.id ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                        Par défaut
                      </button>
                    )}

                    <button 
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors ml-auto disabled:opacity-50"
                    >
                      {deletingId === addr.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Card "Ajouter" — visible seulement si pas au max */}
          {canAddMore && (
            <button 
              onClick={openAdd}
              className="flex flex-col items-center justify-center gap-4 min-h-[240px] rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 text-gray-400 hover:text-emerald-600 transition-all duration-300 group/add"
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 group-hover/add:border-emerald-200 group-hover/add:bg-emerald-50 flex items-center justify-center shadow-sm transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold">Ajouter une adresse</span>
              <span className="text-xs text-gray-400 font-medium">{addresses.length}/{MAX_ADDRESSES} utilisées</span>
            </button>
          )}
        </div>
      )}

      {/* ── MODAL AJOUT / MODIFICATION ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setEditingAddress(null); setGeoAddress(''); setGeoCoords(null) }} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <MapPin size={20} />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                </h3>
              </div>
              <button 
                aria-label="Fermer" 
                title="Fermer" 
                onClick={() => { setIsModalOpen(false); setEditingAddress(null); setGeoAddress(''); setGeoCoords(null) }} 
                className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Label + Ville */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-black uppercase tracking-wider text-gray-500 ml-1">Type de lieu</label>
                  <select 
                    title="Label de l'adresse" 
                    name="label" 
                    required 
                    defaultValue={editingAddress?.label || 'Domicile'}
                    className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3.5 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all appearance-none"
                  >
                    <option value="Domicile">🏠 Domicile</option>
                    <option value="Bureau">🏢 Bureau</option>
                    <option value="Autre">📍 Autre</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-black uppercase tracking-wider text-gray-500 ml-1">Ville</label>
                  <input 
                    title="Ville" 
                    name="city" 
                    type="text" 
                    placeholder="Dakar, Thiès..." 
                    required 
                    defaultValue={editingAddress?.city || ''}
                    className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3.5 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all"
                  />
                </div>
              </div>
              
              {/* Nom du destinataire */}
              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-wider text-gray-500 ml-1">Nom du destinataire</label>
                <input 
                  title="Nom de livraison" 
                  name="name" 
                  type="text" 
                  defaultValue={editingAddress?.name || profileName} 
                  required 
                  className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3.5 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all"
                />
              </div>

              {/* Téléphone de livraison */}
              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-wider text-gray-500 ml-1">Téléphone de livraison</label>
                <input 
                  title="Téléphone de livraison" 
                  name="phone" 
                  type="tel" 
                  defaultValue={editingAddress?.phone || profilePhone} 
                  required 
                  className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3.5 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all"
                />
              </div>

              {/* Adresse détaillée + Géolocalisation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-black uppercase tracking-wider text-gray-500 ml-1">Adresse de livraison</label>
                  <button 
                    type="button"
                    onClick={detectLocation}
                    disabled={locating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50"
                  >
                    {locating ? (
                      <><Loader2 size={12} className="animate-spin" /> Localisation...</>
                    ) : geoCoords ? (
                      <><CheckCircle2 size={12} /> ✓ GPS capturé</>
                    ) : (
                      <><Navigation size={12} /> 📍 Me localiser</>
                    )}
                  </button>
                </div>
                <textarea 
                  name="address" 
                  required 
                  placeholder="Quartier, rue, bâtiment, indications de livraison..." 
                  rows={3} 
                  defaultValue={editingAddress?.address || geoAddress}
                  key={geoAddress || editingAddress?.address || 'empty'}
                  className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3.5 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 transition-all resize-none"
                />
                {geoCoords && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                    <Navigation size={11} className="fill-emerald-500" /> 
                    Coordonnées GPS : {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
                  </p>
                )}
              </div>

              {/* Notes pour le livreur */}
              <div className="space-y-2">
                <label className="text-[12px] font-black uppercase tracking-wider text-gray-500 ml-1 flex items-center gap-1.5">
                  <MessageSquare size={12} />
                  Note pour le livreur <span className="text-gray-400 font-medium normal-case tracking-normal">(optionnel)</span>
                </label>
                <input 
                  name="delivery_notes" 
                  type="text"
                  defaultValue={editingAddress?.delivery_notes || ''}
                  placeholder="Ex: Bâtiment bleu, 2ème étage, sonner 2 fois..."
                  className="w-full bg-amber-50/50 outline-none border border-amber-200/60 rounded-[1rem] px-4 py-3.5 text-[14px] font-semibold text-gray-900 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 transition-all placeholder:text-amber-400/60"
                />
              </div>

              {/* Adresse par défaut */}
              {!editingAddress && (
                <label className="flex items-center gap-3 cursor-pointer select-none p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-emerald-50/50 transition-colors">
                  <input type="checkbox" name="is_default" value="true" className="w-4 h-4 rounded border-gray-300 text-[#0F7A60] focus:ring-[#0F7A60]" />
                  <span className="text-sm font-bold text-gray-700">Définir comme adresse par défaut</span>
                </label>
              )}

              {/* Boutons */}
              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setEditingAddress(null); setGeoAddress(''); setGeoCoords(null) }} 
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 py-3.5 bg-[#0F7A60] hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(15,122,96,0.25)]"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {editingAddress ? 'Sauvegarder' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
