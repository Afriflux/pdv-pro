'use client'

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import { Upload, Download, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'

// Format CSV attendu (colonnes)
const CSV_HEADERS = ['Titre de la page', 'URL (slug)', 'Template', 'Actif (oui/non)']

const TEMPLATE_CSV = `Titre de la page,URL (slug),Template,Actif (oui/non)
Ma sublime boutique,boutique-officielle,ecommerce,oui
Formation Dropshipping,formation-dropshipping,formation,oui
Mon ebook gratuit,ebook-gratuit,ebook,non`

interface PreviewRow {
  title:    string
  slug:     string
  template: string
  active:   string
}

interface ImportResult {
  imported: number
  errors:   string[]
}

export default function ImportCSVPages({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [dragging,  setDragging]  = useState(false)
  const [preview,   setPreview]   = useState<PreviewRow[]>([])
  const [fileName,  setFileName]  = useState<string | null>(null)
  const [rawFile,   setRawFile]   = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result,    setResult]    = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'modele_pages_pdvpro.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string): PreviewRow[] => {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    return lines.slice(1, 6).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      return {
        title:    cols[0] ?? '',
        slug:     cols[1] ?? '',
        template: cols[2] ?? '',
        active:   cols[3] ?? '',
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
      const res  = await fetch('/api/pages/import-csv', { method: 'POST', body: formData })
      const data = await res.json() as ImportResult
      setResult(data)
      if (data.imported > 0) {
        toast.success(`${data.imported} page(s) importée(s) avec succès !`)
        if (onImportSuccess) onImportSuccess()
      }
      if (data.errors && data.errors.length > 0) {
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
    <div className="bg-white border border-[#0F7A60]/20 rounded-2xl overflow-hidden shadow-sm relative">
      <div className="absolute top-0 right-0 bg-[#0F7A60] pt-1 pb-1.5 px-3 rounded-bl-xl text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
        <Upload size={12} className="text-[#C9A84C]" /> IMPORT CSV
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center text-[#0F7A60]">
            <Upload size={20} />
          </div>
          <div>
            <h3 className="font-black text-[#1A1A1A] text-lg">Import de Pages de Vente</h3>
            <p className="text-xs text-gray-500 mt-0.5">Créez vos pages en masse depuis un fichier CSV.</p>
          </div>
        </div>
        {!fileName ? (
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
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); downloadTemplate() }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-bold text-gray-700 hover:border-[#0F7A60] hover:text-[#0F7A60] transition-all"
              >
                <Download className="w-4 h-4" /> Télécharger le modèle CSV
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F7A60] text-white rounded-xl text-sm font-bold hover:bg-[#0D6B53] transition-all shadow-sm"
              >
                Parcourir mes fichiers
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 mt-6 font-mono tracking-wide">
              COLONNES REQUISES : {CSV_HEADERS.join(', ')}
            </p>
            <input aria-label="Fichier CSV" title="Fichier CSV" ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#FAFAF7] border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F7A60]" />
                <span className="text-sm font-semibold text-[#1A1A1A]">{fileName}</span>
              </div>
              <button aria-label="Supprimer le fichier" title="Supprimer le fichier" onClick={reset} className="p-1 text-gray-400 hover:text-red-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {preview.length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Aperçu (5 premières lignes)</p>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0F7A60]/5 border-b border-gray-100 text-gray-400 uppercase font-black tracking-widest">
                      <tr>{CSV_HEADERS.map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.map((row, i) => (
                        <tr key={i} className="hover:bg-[#FAFAF7]">
                          <td className="px-3 py-2 font-medium text-[#1A1A1A]">{row.title}</td>
                          <td className="px-3 py-2 text-gray-400">{row.slug}</td>
                          <td className="px-3 py-2 text-[#C9A84C] font-bold">{row.template}</td>
                          <td className="px-3 py-2">{row.active}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result && (
              <div className={`p-4 rounded-xl border text-sm ${result.errors.length === 0 ? 'bg-[#0F7A60]/10 border-[#0F7A60]/20 text-[#0F7A60]' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                {result.errors.length === 0 ? (
                  <p className="font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Import terminé avec succès !</p>
                ) : (
                  <div>
                    <p className="font-bold flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4" /> {result.errors.length} erreur(s) rencontrée(s)</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                      {result.errors.length > 5 && <li>... et {result.errors.length - 5} autres erreurs.</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!result && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-[#1A1A1A] hover:bg-black disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {importing ? "Importation en cours..." : "Lancer l'importation"}
              </button>
            )}
            
            {result && (
              <button onClick={reset} className="w-full bg-[#1A1A1A] hover:bg-black text-white font-black py-4 rounded-xl transition-all">
                Importer un autre fichier
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
