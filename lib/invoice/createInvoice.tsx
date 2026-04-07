import { createClient } from '@/lib/supabase/server'
import { generateInvoicePdfBuffer } from '../pdf/generateInvoice'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Format : Yayyam-YYYY-00000X */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateInvoiceNumber(supabase: SupabaseClient<any, 'public', any>, date: Date): Promise<string> {
  const year = date.getFullYear()
  const prefix = `Yayyam-${year}-`

  // Trouver la dernière facture de l'année pour incrémenter
  const { data } = await supabase
    .from('Invoice')
    .select('numero')
    .ilike('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1)

  let sequence = 1
  if (data && data.length > 0) {
    const lastNum = data[0].numero
    const parts = lastNum.split('-')
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1
    }
  }

  // Padding à 6 chiffres (ex: 000001)
  return `${prefix}${sequence.toString().padStart(6, '0')}`
}

export async function createAndStoreInvoice(orderId: string): Promise<string | null> {
  const supabase = await createClient()

  // ── 1. Charger la commande et les infos associées ───────────
  const { data: order, error } = await supabase
    .from('Order')
    .select(`
      id, created_at, buyer_name, buyer_phone, delivery_address,
      quantity, subtotal, promo_discount, total,
      store_id, payment_method,
      store:Store(id, user_id, name, slug, logo_url),
      product:Product(name, price)
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    console.error('[createInvoice] Impossible de charger order:', orderId, error?.message)
    return null
  }

  // S'assurer qu'on n'a pas déjà généré la facture
  const { data: existing } = await supabase
    .from('Invoice')
    .select('pdf_url')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) return existing.pdf_url

  // Nettoyer les nested arrays Supabase
  const store   = (Array.isArray(order.store) ? order.store[0] : order.store) as Record<string, unknown>
  const product = (Array.isArray(order.product) ? order.product[0] : order.product) as Record<string, unknown>

  if (!store || !product) {
    console.error('[createInvoice] Impossible de charger relations via order:', orderId)
    return null
  }

  // ── 2. Vérifier si c'est un compte Pro+ (White Label) ───────
  const { data: sub } = await supabase
    .from('Subscription')
    .select('plan')
    .eq('vendor_id', store.id ?? order.store_id)
    .single()

  const isWhiteLabel = sub?.plan === 'pro_plus' || sub?.plan === 'annual_pro_plus'

  const dateObject = new Date(order.created_at)
  const dateStr    = dateObject.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  // Génération du numéro local unique
  const numero = await generateInvoiceNumber(supabase, dateObject)

  // ── 3. Construire le DTO ─────────────────────────────────────
  const invoiceData = {
    numero,
    date: dateStr,
    orderId,
    store: {
      name:         store.name as string,
      logo_url:     store.logo_url as string,
      // address:    Dakar, Sénégal par défaut ou à récupérer via User
      isWhiteLabel,
    },
    buyer: {
      name:    order.buyer_name,
      phone:   order.buyer_phone,
      address: order.delivery_address,
    },
    product: {
      name:     product.name as string,
      price:    product.price as number,
      quantity: order.quantity,
    },
    pricing: {
      subtotal: order.subtotal,
      discount: order.promo_discount,
      total:    order.total,
    },
  }

  // ── 4. Rendu PDF en Buffer via jspdf ──────────────────────────
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateInvoicePdfBuffer(invoiceData)
  } catch (err) {
    console.error('[createInvoice] Erreur renderer jspdf:', err)
    return null
  }

  // ── 5. Stockage Supabase (bucket public "invoices") ──────────
  const path = `${order.store_id}/${dateObject.getFullYear()}/${numero}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    console.error('[createInvoice] Erreur upload:', uploadError.message)
    return null
  }

  const { data: publicUrlData } = supabase.storage
    .from('invoices')
    .getPublicUrl(path)

  const pdfUrl = publicUrlData.publicUrl

  // ── 6. Sauvegarder en DB ─────────────────────────────────────
  await supabase.from('Invoice').insert({
    order_id:    orderId,
    numero,
    pdf_url:     pdfUrl,
    white_label: isWhiteLabel,
  })

  console.log(`[createInvoice] Facture ${numero} générée: ${pdfUrl}`)
  return pdfUrl
}
