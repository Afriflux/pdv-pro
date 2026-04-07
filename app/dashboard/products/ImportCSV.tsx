// ─── ImportCSV — Import de produits en masse via fichier CSV ──────────────────
// Client Component : drag & drop, aperçu, POST /api/products/import-csv

'use client'

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import { Upload, Download, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { toast } from '@/lib/toast'

// Format CSV attendu (colonnes)
const CSV_HEADERS = ['Nom du produit', 'Description', 'Prix (FCFA)', 'Type (physical/digital/coaching)', 'Catégorie', 'Stock']

const TEMPLATE_CSV = `Nom du produit,Description,Prix (FCFA),Type (physical/digital/coaching),Catégorie,Stock
Robe en wax premium,Magnifique robe en wax authentique 100% coton,25000,physical,Mode,20
Cours Excel débutant,Formation complète Excel pour démarrer rapidement,10000,digital,Formation,
Coaching business 1h,Session de coaching individuelle,50000,coaching,Business,`

interface PreviewRow {
  name:        string
  description: string
  price:       string
  type:        string
  category:    string
  stock:       string
}

interface ImportResult {
  imported: number
  errors:   string[]
}

export default function ImportCSV() {
  const [dragging,  setDragging]  = useState(false)
  const [preview,   setPreview]   = useState<PreviewRow[]>([])
  const [fileName,  setFileName]  = useState<string | null>(null)
  const [rawFile,   setRawFile]   = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result,    setResult]    = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Téléchargement du modèle ──────────────────────────────────────────────
  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'modele_produits_yayyampro.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Parser CSV côté client pour l'aperçu ─────────────────────────────────
  const parseCSV = (text: string): PreviewRow[] => {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    return lines.slice(1, 6).map(line => {
      // Gestion des guillemets simples dans les champs CSV
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      return {
        name:        cols[0] ?? '',
        description: cols[1] ?? '',
        price:       cols[2] ?? '',
        type:        cols[3] ?? '',
        category:    cols[4] ?? '',
        stock:       cols[5] ?? '',
      }
    })
  }

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Fichier CSV requis.')
      return
    }
    setFileName(file.name)
    setRawFile(file)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setPreview(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleImport = async () => {
    if (!rawFile) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', rawFile)
      const res  = await fetch('/api/products/import-csv', { method: 'POST', body: formData })
      const data = await res.json() as ImportResult
      setResult(data)
      if (data.imported > 0) {
        toast.success(`${data.imported} produit(s) importé(s) avec succès !`)
      }
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} ligne(s) ignorée(s). Consultez les erreurs.`)
      }
    } catch {
      toast.error('Erreur lors de l\'import.')
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setFileName(null)
    setRawFile(null)
    setPreview([])
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAF7]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1A1A1A]">Import CSV</h2>
            <p className="text-xs text-gray-400">Importez vos produits en masse</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {!fileName ? (
          /* ── Zone de dépôt ── */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              dragging
                ? 'border-[#0F7A60] bg-[#0F7A60]/5'
                : 'border-gray-200 hover:border-[#0F7A60]/40 hover:bg-[#FAFAF7]'
            }`}
          >
            <Upload className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
            <p className="font-bold text-[#1A1A1A] text-lg mb-2">Déposez votre fichier CSV ici</p>
            <p className="text-sm text-gray-500 mb-6">
              Assurez-vous de respecter le format attendu. Vous pouvez télécharger notre modèle Excel/CSV prêt à l'emploi.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  downloadTemplate()
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 shadow-sm
                  rounded-xl text-sm font-bold text-gray-700 hover:border-[#0F7A60] hover:text-[#0F7A60] transition-all"
              >
                <Download className="w-4 h-4" />
                Télécharger le modèle CSV
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  fileRef.current?.click()
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F7A60] text-white
                  rounded-xl text-sm font-bold hover:bg-[#0D6B53] transition-all shadow-sm"
              >
                Parcourir mes fichiers
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 mt-6 font-mono tracking-wide">
              COLONNES REQUISES : {CSV_HEADERS.join(', ')}
            </p>
            <input
              aria-label="Fichier CSV"
              title="Fichier CSV"
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        ) : (
          /* ── Fichier sélectionné ── */
          <div className="space-y-4">
            {/* Info fichier */}
            <div className="flex items-center justify-between bg-[#FAFAF7] border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F7A60]" />
                <span className="text-sm font-semibold text-[#1A1A1A]">{fileName}</span>
              </div>
              <button aria-label="Supprimer le fichier" title="Supprimer le fichier" onClick={reset} className="p-1 text-gray-400 hover:text-red-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Aperçu tableau */}
            {preview.length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  Aperçu (5 premières lignes)
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0F7A60]/5 border-b border-gray-100 text-gray-400 uppercase font-black tracking-widest">
                      <tr>
                        {CSV_HEADERS.map(h => <th key={h} className="px-3 py-2">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.map((row, i) => (
                        <tr key={i} className="hover:bg-[#FAFAF7]">
                          <td className="px-3 py-2 font-medium text-[#1A1A1A] max-w-[120px] truncate">{row.name}</td>
                          <td className="px-3 py-2 text-gray-400 max-w-[150px] truncate">{row.description}</td>
                          <td className="px-3 py-2 text-[#C9A84C] font-bold">{row.price}</td>
                          <td className="px-3 py-2">{row.type}</td>
                          <td className="px-3 py-2">{row.category}</td>
                          <td className="px-3 py-2">{row.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Résultat import */}
            {result && (
              <div className={`p-4 rounded-xl border text-sm ${
                result.errors.length === 0
                  ? 'bg-[#0F7A60]/10 border-[#0F7A60]/20 text-[#0F7A60]'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {result.errors.length === 0
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <AlertCircle className="w-4 h-4" />}
                  {result.imported} produit(s) importé(s)
                  {result.errors.length > 0 && ` · ${result.errors.length} erreur(s)`}
                </div>
                {result.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {result.errors.slice(0, 5).map((e, i) => (
                      <li key={i} className="text-xs font-mono">• {e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Bouton import */}
            {!result && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#C9A84C]
                  hover:bg-[#b8922e] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm
                  font-black rounded-xl transition-all shadow-sm"
              >
                {importing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Import en cours…</>
                  : <><Upload className="w-4 h-4" /> Importer {preview.length > 0 ? `(aperçu: ${preview.length} lignes)` : 'les produits'}</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
