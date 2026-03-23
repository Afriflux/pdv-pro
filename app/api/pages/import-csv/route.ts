import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface PageInsert {
  id:          string
  store_id:    string
  title:       string
  slug:        string
  template:    string
  active:      boolean
  sections:    any[]
  product_ids: string[]
  created_at:  string
  updated_at:  string
}

const TEMPLATES = [
  { id: 'beauty', sections: [{ type: 'hero', title: 'Sublimez votre beauté naturelle', subtitle: 'Produits 100% naturels', cta: 'Découvrir' }, { type: 'benefits', items: ['Formules naturelles', 'Livraison rapide'] }] },
  { id: 'ebook', sections: [{ type: 'hero', title: 'Le guide qui va changer votre vie', subtitle: 'Téléchargement immédiat', cta: 'Obtenir le guide' }] },
  { id: 'formation', sections: [{ type: 'hero', title: 'Maîtrisez votre domaine en 30 jours', subtitle: 'Formation complète', cta: 'Rejoindre la formation' }] },
  { id: 'food', sections: [{ type: 'hero', title: 'La cuisine du terroir livrée chez vous', subtitle: 'Préparé frais chaque jour', cta: 'Commander maintenant' }] },
  { id: 'fashion', sections: [{ type: 'hero', title: 'Style africain, élégance moderne', subtitle: 'Collection exclusive', cta: 'Voir la collection' }] },
  { id: 'services', sections: [{ type: 'hero', title: 'Des services digitaux qui convertissent', subtitle: 'Design & marketing', cta: 'Obtenir un devis' }] },
  { id: 'coaching', sections: [{ type: 'hero', title: 'Transformez votre vie', subtitle: 'Coaching personnalisé', cta: 'Réserver ma session' }] },
  { id: 'ecommerce', sections: [{ type: 'hero', title: 'Qualité premium, prix local', subtitle: 'Livraison 24-48h', cta: 'Acheter maintenant' }] },
  { id: 'music', sections: [{ type: 'hero', title: 'Découvrez mon univers musical', subtitle: 'Beats & œuvres', cta: 'Écouter' }] },
  { id: 'event', sections: [{ type: 'hero', title: 'Un événement qui va vous transformer', subtitle: 'Places limitées', cta: 'Réserver ma place' }] },
]

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: store } = await supabase.from('Store').select('id').eq('user_id', user.id).single()
    if (!store) return NextResponse.json({ error: 'Espace introuvable' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as Blob
    if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })

    const text = await file.text()
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    
    if (lines.length < 2) return NextResponse.json({ error: 'Fichier CSV vide ou invalide (entête uniquement)' }, { status: 400 })

    const errors: string[] = []
    const pagesToInsert: PageInsert[] = []

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
      const cols = parts.map(c => c.replace(/^"|"$/g, '').trim())

      if (cols.length < 3) {
        errors.push(`Ligne ${i + 1} : pas assez de colonnes.`)
        continue
      }

      const rawTitle = cols[0] || ''
      const rawSlug = cols[1] || ''
      const rawTemplate = cols[2] || 'ecommerce'
      const rawActive = (cols[3] || '').trim().toLowerCase()

      if (!rawTitle) {
        errors.push(`Ligne ${i + 1} : le titre est manquant.`)
        continue
      }

      const active = rawActive === 'oui' || rawActive === 'yes' || rawActive === 'true'

      const finalSlug = rawSlug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || crypto.randomUUID().slice(0, 8)

      const templateData = TEMPLATES.find(t => t.id === rawTemplate) || TEMPLATES.find(t => t.id === 'ecommerce')
      
      pagesToInsert.push({
        id: crypto.randomUUID(),
        store_id: store.id,
        title: rawTitle,
        slug: finalSlug,
        template: templateData?.id || 'ecommerce',
        active,
        sections: templateData?.sections || [],
        product_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    if (pagesToInsert.length > 0) {
      const { error: insertErr } = await supabase.from('SalePage').insert(pagesToInsert)
      if (insertErr) {
        return NextResponse.json({ error: 'Erreur SQL : ' + insertErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ imported: pagesToInsert.length, errors })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
