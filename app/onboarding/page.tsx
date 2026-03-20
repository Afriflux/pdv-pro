'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { 
  checkStoreName, 
  saveStoreInfo, 
  savePaymentMethod, 
  completeOnboarding 
} from './actions'
import { ArrowRight, Check, UploadCloud, Copy, Store, Pickaxe, CheckCircle2, DollarSign, Wallet } from 'lucide-react'

// ─── TYPES & CONSTANTS ────────────────────────────────────────────────────────
const TOTAL_STEPS = 5
const CATEGORIES = ['Mode', 'Beauté', 'Tech', 'Formation', 'Alimentation', 'Services', 'Autre']
const COLORS = ['#0F7A60', '#C9A84C', '#E74C3C', '#3498DB', '#9B59B6', '#1A1A1A']
const STEP_ICONS = [Pickaxe, Store, Wallet, DollarSign, CheckCircle2]
const STEP_LABELS = ['Type', 'Boutique', 'Paiement', 'Modèle', 'Fin']

export default function OnboardingPage() {
  const supabase = createClient()
  
  const [step, setStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  
  // -- Step 1: Vendor Type
  const [vendorType, setVendorType] = useState<'digital' | 'physical' | 'hybrid' | null>(null)
  
  // -- Step 2: Store Identity
  const [storeName, setStoreName] = useState('')
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null)
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#0F7A60')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const logoRef = useRef<HTMLInputElement>(null)
  
  // -- Step 3: Payment Method
  const [payoutMethod, setPayoutMethod] = useState<'wave' | 'orange_money' | 'bank' | null>(null)
  const [payoutDetails, setPayoutDetails] = useState('')
  
  // -- Step 4: Business Model
  const [commissionAccepted, setCommissionAccepted] = useState(false)
  const simulatorSales = 500000
  const simulatorComm = simulatorSales * 0.06 // 6% pour 500k

  // ─── DEBOUNCED NAME CHECK ──────────────────────────────────────────────────
  useEffect(() => {
    if (!storeName.trim() || storeName.trim().length < 3) {
      setNameAvailable(null)
      return
    }
    const timer = setTimeout(async () => {
      setIsCheckingName(true)
      const res = await checkStoreName(storeName.trim())
      setNameAvailable(!res.exists)
      setIsCheckingName(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [storeName])
  
  // ─── LOGO UPLOAD ──────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo : taille max 2 MB')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLogoUploading(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `logos/${user.id}/logo_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('store-assets').upload(path, file, { upsert: true })
    
    if (error) {
      toast.error(`Upload échoué : ${error.message}`)
      setLogoUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('store-assets').getPublicUrl(path)
    setLogoUrl(publicUrl)
    setLogoUploading(false)
  }

  // ─── PROGRESSION & SAVING ────────────────────────────────────────────────
  const handleNext = async () => {
    setIsSaving(true)
    try {
      if (step === 1) {
        if (!vendorType) throw new Error("Veuillez choisir un type de vendeur")
        await saveStoreInfo({ vendor_type: vendorType })
      } 
      else if (step === 2) {
        if (!storeName.trim()) throw new Error("Le nom est obligatoire")
        if (nameAvailable === false) throw new Error("Ce nom est déjà pris")
        await saveStoreInfo({ 
          name: storeName.trim(), 
          primary_color: primaryColor, 
          logo_url: logoUrl || null,
          category: category || null,
          description: description.trim() || null
        })
      }
      else if (step === 3) {
        if (!payoutMethod || !payoutDetails.trim()) throw new Error("Veuillez renseigner un moyen de paiement complet")
        await savePaymentMethod(payoutMethod, payoutDetails.trim())
      }
      else if (step === 4) {
        if (!commissionAccepted) throw new Error("Veuillez accepter le modèle de commission")
        await completeOnboarding(storeName)
      }
      
      setStep(s => Math.min(s + 1, TOTAL_STEPS))
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => setStep(s => Math.max(s - 1, 1))
  
  // ─── RENDU ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center py-12 px-4 transition-all duration-500">
      
      {/* ── STEPPER VISUEL ── */}
      <div className="w-full max-w-3xl mb-8 mt-4">
        <div className="flex items-center justify-between relative px-2 md:px-6">
          <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full z-0"></div>
          <div 
            className="absolute left-[10%] top-1/2 -translate-y-1/2 h-1 bg-emerald rounded-full z-0 transition-all duration-500"
            style={{ width: `${Math.max(0, (step - 1)) * 20}%` }}
          ></div>
          
          {STEP_ICONS.map((Icon, i) => {
            const num = i + 1
            const isPast = num < step
            const isCurrent = num === step
            return (
               <div key={num} className="relative z-10 flex flex-col items-center gap-2">
                 <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                   isPast ? 'bg-emerald border-emerald text-white' : 
                   isCurrent ? 'bg-white border-emerald text-emerald shadow-lg scale-110' : 
                   'bg-white border-gray-200 text-gray-400'
                 }`}>
                   {isPast ? <Check size={20} /> : <Icon size={20} />}
                 </div>
                 <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest hidden sm:block ${isCurrent ? 'text-emerald' : 'text-gray-400'}`}>
                   {STEP_LABELS[i]}
                 </span>
               </div>
            )
          })}
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-xl border border-line overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {isSaving && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="w-12 h-12 rounded-full border-4 border-emerald/20 border-t-emerald animate-spin"></div>
          </div>
        )}

        <div className="p-8 md:p-12">
          
          {/* ════ ÉTAPE 1 ════ */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center">
                <span className="text-emerald font-mono tracking-widest uppercase text-xs mb-2 block font-bold">Base de la boutique</span>
                <h2 className="text-3xl font-display font-black text-ink mb-2">Que vendez-vous ?</h2>
                <p className="text-slate">Cela nous permet d'adapter l'interface de votre tableau de bord.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                {/* Numérique */}
                <button
                  onClick={() => setVendorType('digital')}
                  className={`p-6 rounded-2xl border-2 text-center transition-all ${
                    vendorType === 'digital' ? 'border-emerald bg-emerald/5 shadow-md scale-105' : 'border-line hover:border-emerald/30'
                  }`}
                >
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💾</div>
                  <h3 className="font-bold text-ink mb-1 text-lg">Digital</h3>
                  <p className="text-xs text-dust leading-relaxed">Formations, eBooks, PDF, accès Telegram, Coachings</p>
                </button>
                {/* Physique */}
                <button
                  onClick={() => setVendorType('physical')}
                  className={`p-6 rounded-2xl border-2 text-center transition-all ${
                    vendorType === 'physical' ? 'border-emerald bg-emerald/5 shadow-md scale-105' : 'border-line hover:border-emerald/30'
                  }`}
                >
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📦</div>
                  <h3 className="font-bold text-ink mb-1 text-lg">Physique</h3>
                  <p className="text-xs text-dust leading-relaxed">Prêt-à-porter, cosmétiques, électronique, alimentation</p>
                </button>
                {/* Hybride */}
                <button
                  onClick={() => setVendorType('hybrid')}
                  className={`p-6 rounded-2xl border-2 text-center transition-all ${
                    vendorType === 'hybrid' ? 'border-emerald bg-emerald/5 shadow-md scale-105' : 'border-line hover:border-emerald/30'
                  }`}
                >
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔀</div>
                  <h3 className="font-bold text-ink mb-1 text-lg">Hybride</h3>
                  <p className="text-xs text-dust leading-relaxed">Vous proposez des produits physiques ET numériques</p>
                </button>
              </div>
            </div>
          )}

          {/* ════ ÉTAPE 2 ════ */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center">
                <span className="text-emerald font-mono tracking-widest uppercase text-xs mb-2 block font-bold">Personnalisation</span>
                <h2 className="text-3xl font-display font-black text-ink mb-2">L'identité de la boutique</h2>
                <p className="text-slate">Donnez confiance à vos clients dès le premier coup d'œil.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Nom */}
                  <div>
                    <label className="block text-xs font-bold text-slate uppercase tracking-widest mb-2">Nom de la boutique *</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={storeName}
                        onChange={e => setStoreName(e.target.value)}
                        placeholder="Ex: Rose Beauty"
                        className={`w-full bg-cream border rounded-xl px-4 py-3 text-ink font-medium focus:outline-none focus:ring-2 focus:ring-emerald/20 transition-all ${
                          nameAvailable === true ? 'border-emerald' : nameAvailable === false ? 'border-red-500' : 'border-line focus:border-emerald'
                        }`}
                      />
                      <div className="absolute right-3 top-3.5">
                        {isCheckingName && <span className="text-xs text-dust animate-pulse">Vérification...</span>}
                        {nameAvailable === true && <CheckCircle2 size={18} className="text-emerald" />}
                        {nameAvailable === false && <span className="text-xs text-red-500 font-bold">Déjà pris</span>}
                      </div>
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="block text-xs font-bold text-slate uppercase tracking-widest mb-2">Catégorie</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-cream border border-line rounded-xl px-4 py-3 text-ink font-medium focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
                    >
                      <option value="">Choisir un secteur</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate uppercase tracking-widest mb-2">Courte Description</label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      maxLength={200}
                      placeholder="Votre slogan ou promesse client..."
                      className="w-full bg-cream border border-line rounded-xl px-4 py-3 text-ink font-medium focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all resize-none h-24"
                    />
                    <div className="text-right text-[10px] text-dust font-mono mt-1">{description.length}/200</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Logo */}
                  <div>
                    <label className="block text-xs font-bold text-slate uppercase tracking-widest mb-2">Logo (Max 2MB)</label>
                    <div 
                      onClick={() => logoRef.current?.click()}
                      className="w-full h-40 rounded-2xl border-2 border-dashed border-line hover:border-emerald bg-cream flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors relative overflow-hidden group"
                    >
                      {logoUrl ? (
                        <div className="absolute inset-0 bg-white flex items-center justify-center p-2">
                          <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Changer d'image</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={32} className="text-emerald" />
                          <span className="text-xs font-bold text-dust group-hover:text-emerald transition-colors">
                            {logoUploading ? 'Chargement...' : 'Cliquez pour uploader'}
                          </span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={logoRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>

                  {/* Couleur Accent */}
                  <div>
                    <label className="block text-xs font-bold text-slate uppercase tracking-widest mb-2">Couleur de la boutique</label>
                    <div className="flex gap-3 flex-wrap">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setPrimaryColor(color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${primaryColor === color ? 'border-ink scale-110 shadow-lg ring-4 ring-gray-100' : 'border-transparent shadow-sm'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ ÉTAPE 3 ════ */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center">
                <span className="text-emerald font-mono tracking-widest uppercase text-xs mb-2 block font-bold">Encaissement</span>
                <h2 className="text-3xl font-display font-black text-ink mb-2">Où recevez-vous votre argent ?</h2>
                <p className="text-slate">Vos clients paieront sur la plateforme, l'argent sera transféré ici.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
                {[
                  { id: 'wave', label: 'Wave', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                  { id: 'orange_money', label: 'Orange Money', color: 'bg-orange-50 text-orange-600 border-orange-200' },
                  { id: 'bank', label: 'Virement Bancaire', color: 'bg-gray-50 text-gray-700 border-gray-200' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPayoutMethod(method.id as any)}
                    className={`p-4 rounded-xl border-2 text-center transition-all font-bold ${
                      payoutMethod === method.id ? 'border-emerald ring-2 ring-emerald/20 ' + method.color : 'border-line hover:border-emerald/30 bg-white'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              <div className="bg-cream p-6 rounded-2xl border border-line">
                <label className="block text-sm font-bold text-ink mb-2">
                  {payoutMethod === 'bank' ? 'IBAN ou N° Compte Bancaire' : 'Numéro de téléphone (Format international)'}
                </label>
                <input 
                  type="text" 
                  value={payoutDetails}
                  onChange={e => setPayoutDetails(e.target.value)}
                  placeholder={payoutMethod === 'bank' ? 'SN010 010... etc.' : '+221 77 ...'}
                  className="w-full bg-white border border-line rounded-xl px-4 py-4 text-ink font-bold focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
                />
                <p className="text-xs text-dust mt-3 flex items-center gap-1.5 font-medium">
                  <span className="w-5 h-5 rounded-full bg-emerald/10 text-emerald flex items-center justify-center font-bold">i</span>
                  Important : Vérifiez bien ces informations, elles serviront à vos retraits express.
                </p>
              </div>
            </div>
          )}

          {/* ════ ÉTAPE 4 ════ */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
               <div className="text-center">
                <span className="text-emerald font-mono tracking-widest uppercase text-xs mb-2 block font-bold">Modèle Économique</span>
                <h2 className="text-3xl font-display font-black text-ink mb-2">100% à la commission.</h2>
                <p className="text-slate">Pas de frais cachés, pas d'abonnements. Nous gagnons quand vous gagnez.</p>
              </div>

              <div className="bg-ink text-white rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald/10 blur-[80px] rounded-full"></div>
                
                <h4 className="text-lg font-bold mb-6 text-cream relative z-10">Paliers dégressifs mensuels</h4>
                <div className="space-y-5 relative z-10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-cream/70 font-medium">0 – 100 000 FCFA</span>
                    <span className="font-display font-black text-2xl text-white">7%</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-cream/70 font-medium">100K – 500 000 FCFA</span>
                    <span className="font-display font-black text-2xl text-turquoise">6%</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-cream/70 font-medium">500K – 1 Million FCFA</span>
                    <span className="font-display font-black text-2xl text-emerald">5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-cream/70 font-medium">+ de 1 Million FCFA</span>
                    <span className="font-display font-black text-2xl text-gold">4%</span>
                  </div>
                </div>
              </div>

              <div className="bg-cream border border-line p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">🧮</div>
                <div>
                  <p className="text-sm font-bold text-ink">Simulateur Rapide</p>
                  <p className="text-xs text-slate mt-1">Si vous vendez <strong>500 000 FCFA</strong>, PDV Pro prend seulement <strong>{simulatorComm.toLocaleString()} FCFA</strong>. Tous frais de retrait inclus.</p>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 border border-line rounded-xl hover:bg-cream transition-colors">
                <input 
                  type="checkbox" 
                  checked={commissionAccepted}
                  onChange={e => setCommissionAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald focus:ring-emerald accent-emerald"
                />
                <span className="text-sm font-bold text-ink">J'ai compris et j'accepte le modèle 100% commission.</span>
              </label>
            </div>
          )}

          {/* ════ ÉTAPE 5 ════ */}
          {step === 5 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 text-center py-6">
              <div className="w-24 h-24 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto text-4xl mb-6">
                🎉
              </div>
              <h2 className="text-4xl font-display font-black text-ink mb-4">Votre boutique est prête !</h2>
              <p className="text-slate text-lg max-w-lg mx-auto mb-8">Félicitations, vous venez de poser la première pierre de votre empire. Voici ce qu'il vous reste à faire aujourd'hui :</p>

              <div className="max-w-md mx-auto space-y-3 text-left">
                <Link href="/dashboard/products/new" className="flex items-center gap-4 p-4 rounded-xl border border-line hover:border-emerald hover:bg-emerald/5 transition-all group">
                  <div className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center group-hover:bg-emerald group-hover:text-white group-hover:border-emerald transition-colors">1</div>
                  <span className="font-bold text-ink group-hover:text-emerald transition-colors">Ajouter votre premier produit</span>
                  <ArrowRight size={16} className="ml-auto text-dust group-hover:text-emerald group-hover:translate-x-1 transition-all" />
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-4 p-4 rounded-xl border border-line hover:border-emerald hover:bg-emerald/5 transition-all group">
                  <div className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center group-hover:bg-emerald group-hover:text-white group-hover:border-emerald transition-colors">2</div>
                  <span className="font-bold text-ink group-hover:text-emerald transition-colors">Personnaliser votre vitrine</span>
                  <ArrowRight size={16} className="ml-auto text-dust group-hover:text-emerald group-hover:translate-x-1 transition-all" />
                </Link>
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(`https://pdvpro.com/${storeName.toLowerCase().replace(/\s+/g, '-')}`)
                    toast.success('Lien copié dans le presse-papier !')
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-line hover:border-emerald hover:bg-emerald/5 transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center group-hover:bg-emerald group-hover:text-white group-hover:border-emerald transition-colors"><Copy size={14}/></div>
                  <span className="font-bold text-ink group-hover:text-emerald transition-colors">Copier le lien public</span>
                  <span className="ml-auto text-[10px] font-black uppercase text-white bg-gold px-2 py-1 rounded-md">Pour Bio Insta</span>
                </div>
              </div>

              <div className="pt-8">
                <Link href="/dashboard" className="inline-block w-full sm:w-auto px-12 py-5 bg-ink text-white font-black rounded-2xl shadow-xl shadow-ink/20 hover:bg-slate hover:scale-105 transition-all">
                  Aller sur mon Dashboard Marchand
                </Link>
              </div>
            </div>
          )}

          {/* ── FOOTER NAVIGATION ── */}
          {step < 5 && (
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-line">
              {step > 1 ? (
                <button onClick={handleBack} className="text-sm font-bold text-slate hover:text-ink transition-colors px-4 py-2">
                  ← Précédent
                </button>
              ) : <div></div>}
              
              <button
                onClick={handleNext}
                disabled={isSaving || (step===1 && !vendorType) || (step===2 && (!storeName || nameAvailable===false)) || (step===3 && (!payoutMethod || !payoutDetails)) || (step===4 && !commissionAccepted)}
                className="px-8 py-4 bg-emerald text-white font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-rich transition-all shadow-lg shadow-emerald/20 flex items-center gap-2 group"
              >
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Sauvegarde...</>
                ) : (
                  <>Continuer <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
