import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface InvoiceData {
  numero: string
  date: string
  orderId: string
  store: {
    name: string
    address?: string | null
    email?: string | null
    logo_url?: string | null
    isWhiteLabel: boolean
  }
  buyer: {
    name: string
    phone: string
    address?: string | null
  }
  product: {
    name: string
    price: number
    quantity: number
  }
  pricing: {
    subtotal: number
    discount: number
    total: number
  }
}

/**
 * Génère le buffer PDF d'une facture
 */
export async function generateInvoicePdfBuffer(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF() as any

  const primaryColor = [249, 115, 22] // #f97316
  const darkColor = [17, 24, 39] // #111827
  const grayColor = [107, 114, 128] // #6b7280

  // ─── Header ───────────────────────────────────────────────────────────
  // Logo / Nom de l'émetteur
  if (data.store.isWhiteLabel && data.store.logo_url) {
    try {
      // Pour jspdf on peut passer une URL mais c'est risqué côté serveur sans fetch
      // Idéalement on passe une base64. Ici on va se contenter du texte si l'image est complexe à charger
      doc.setFontSize(24)
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
      doc.text(data.store.name, 20, 30)
    } catch (e) {
      doc.setFontSize(24)
      doc.text(data.store.name, 20, 30)
    }
  } else if (!data.store.isWhiteLabel) {
    doc.setFontSize(24)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('PDV Pro', 20, 30)
  } else {
    doc.setFontSize(24)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(data.store.name, 20, 30)
  }

  // Titre Facture
  doc.setFontSize(24)
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text('FACTURE', 140, 30)

  doc.setFontSize(10)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text(`Numéro: ${data.numero}`, 140, 40)
  doc.text(`Date: ${data.date}`, 140, 45)

  // ─── Émetteur & Destinataire ──────────────────────────────────────────
  const startY = 60
  
  // Émetteur
  doc.setFontSize(10)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text('ÉMETTEUR', 20, startY)
  
  doc.setFontSize(12)
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text(data.store.isWhiteLabel ? data.store.name : 'PDV Pro', 20, startY + 10)
  
  doc.setFontSize(10)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text(data.store.address || 'Dakar, Sénégal', 20, startY + 18)
  doc.text(data.store.email || 'support@pdvpro.com', 20, startY + 24)

  // Destinataire
  doc.setFontSize(10)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text('FACTURÉ À', 110, startY)
  
  doc.setFontSize(12)
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text(data.buyer.name, 110, startY + 10)
  
  doc.setFontSize(10)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text(data.buyer.phone, 110, startY + 18)
  if (data.buyer.address) {
    const lines = doc.splitTextToSize(data.buyer.address, 80)
    doc.text(lines, 110, startY + 24)
  }

  // ─── Table des produits ───────────────────────────────────────────────
  doc.autoTable({
    startY: startY + 45,
    head: [['Description', 'Prix unitaire', 'Qté', 'Total']],
    body: [
      [
        data.product.name,
        `${data.product.price.toLocaleString('fr-FR')} FCFA`,
        data.product.quantity,
        `${(data.product.price * data.product.quantity).toLocaleString('fr-FR')} FCFA`
      ]
    ],
    headStyles: { fillColor: [243, 244, 246], textColor: grayColor, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10, textColor: darkColor },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    }
  })

  // ─── Totaux ───────────────────────────────────────────────────────────
  let finalY = (doc as any).lastAutoTable.finalY + 10
  
  doc.setFontSize(10)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text('Sous-total', 140, finalY)
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text(`${data.pricing.subtotal.toLocaleString('fr-FR')} FCFA`, 190, finalY, { align: 'right' })

  if (data.pricing.discount > 0) {
    finalY += 8
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text('Remise', 140, finalY)
    doc.setTextColor(239, 68, 68) // #ef4444
    doc.text(`-${data.pricing.discount.toLocaleString('fr-FR')} FCFA`, 190, finalY, { align: 'right' })
  }

  finalY += 12
  doc.setDrawColor(229, 231, 235)
  doc.line(140, finalY - 8, 190, finalY - 8)
  
  doc.setFontSize(12)
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text('TOTAL PAYÉ', 140, finalY)
  doc.setFontSize(14)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(`${data.pricing.total.toLocaleString('fr-FR')} FCFA`, 190, finalY, { align: 'right' })

  // ─── Footer ───────────────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175) // #9ca3af
  doc.line(20, pageHeight - 25, 190, pageHeight - 25)
  doc.text(`Réf commande: ${data.orderId.split('-')[0].toUpperCase()}`, 20, pageHeight - 15)
  doc.text(`Généré automatiquement par PDV Pro`, 190, pageHeight - 15, { align: 'right' })

  return Buffer.from(doc.output('arraybuffer'))
}
