/**
 * lib/invoice/GenerateInvoice.tsx
 * Composant PDF React-PDF pour la génération de factures.
 * Design épuré, support white-label complet.
 */

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// ─── Options et Types ────────────────────────────────────────────────────────

// Définir la police pour un rendu propre
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 700 },
  ],
})

const PRIMARY_COLOR = '#f97316' // orange-500 PDV Pro

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  logo: {
    height: 40,
    objectFit: 'contain',
  },
  pdvLogoText: {
    fontSize: 24,
    fontWeight: 900,
    color: PRIMARY_COLOR,
    letterSpacing: -1,
  },
  titleDetails: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4,
  },
  titleNum: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  column: {
    width: '45%',
  },
  colTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textBold: {
    fontWeight: 600,
    color: '#111827',
    marginBottom: 4,
    fontSize: 12,
  },
  text: {
    color: '#4b5563',
    lineHeight: 1.5,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  trHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
  },
  th: {
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontSize: 9,
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tdName: { width: '50%' },
  tdQty: { width: '15%', textAlign: 'center' },
  tdPrice: { width: '15%', textAlign: 'right' },
  tdTotal: { width: '20%', textAlign: 'right', fontWeight: 600 },
  totals: {
    width: '40%',
    marginLeft: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  totRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totLabel: { color: '#6b7280' },
  totValue: { fontWeight: 600, color: '#111827' },
  totRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totLabelFinal: { fontSize: 12, fontWeight: 700, color: '#111827' },
  totValueFinal: { fontSize: 14, fontWeight: 700, color: PRIMARY_COLOR },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

export interface InvoiceData {
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

// ─── Composant React-PDF ─────────────────────────────────────────────────────

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  // Logo ou texte pour l'émetteur
  const renderIssuer = () => {
    if (data.store.isWhiteLabel) {
      // White Label Pro+ -> Logo de la boutique ou nom de la boutique
      return data.store.logo_url ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={data.store.logo_url} style={styles.logo} />
      ) : (
        <Text style={[styles.pdvLogoText, { color: '#111827' }]}>{data.store.name}</Text>
      )
    }
    // Plan Starter -> PDV Pro
    return <Text style={styles.pdvLogoText}>PDV Pro</Text>
  }

  const issuerName = data.store.isWhiteLabel ? data.store.name : 'PDV Pro'
  const issuerAddress = data.store.isWhiteLabel && data.store.address ? data.store.address : 'Dakar, Sénégal'
  const issuerEmail = data.store.isWhiteLabel && data.store.email ? data.store.email : 'support@pdvpro.com'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header : Logo + Infos Facture */}
        <View style={styles.header}>
          <View>{renderIssuer()}</View>
          <View style={styles.titleDetails}>
            <Text style={styles.title}>FACTURE</Text>
            <Text style={styles.titleNum}>Numéro: {data.numero}</Text>
            <Text style={styles.titleNum}>Date: {data.date}</Text>
          </View>
        </View>

        {/* Section : Émetteur & Destinataire */}
        <View style={styles.section}>
          <View style={styles.column}>
            <Text style={styles.colTitle}>Émetteur</Text>
            <Text style={styles.textBold}>{issuerName}</Text>
            <Text style={styles.text}>{issuerAddress}</Text>
            <Text style={styles.text}>{issuerEmail}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.colTitle}>Facturé à</Text>
            <Text style={styles.textBold}>{data.buyer.name}</Text>
            <Text style={styles.text}>{data.buyer.phone}</Text>
            {data.buyer.address && <Text style={styles.text}>{data.buyer.address}</Text>}
          </View>
        </View>

        {/* Table Lignes */}
        <View style={styles.table}>
          <View style={styles.trHeader}>
            <Text style={[styles.th, styles.tdName]}>Description</Text>
            <Text style={[styles.th, styles.tdPrice]}>Prix unitaire</Text>
            <Text style={[styles.th, styles.tdQty]}>Qté</Text>
            <Text style={[styles.th, styles.tdTotal]}>Total</Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.text, styles.tdName, { fontWeight: 600, color: '#111827' }]}>{data.product.name}</Text>
            <Text style={[styles.text, styles.tdPrice]}>{data.product.price.toLocaleString('fr-FR')} FCFA</Text>
            <Text style={[styles.text, styles.tdQty]}>{data.product.quantity}</Text>
            <Text style={[styles.text, styles.tdTotal]}>{(data.product.price * data.product.quantity).toLocaleString('fr-FR')} FCFA</Text>
          </View>
        </View>

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totRow}>
            <Text style={styles.totLabel}>Sous-total</Text>
            <Text style={styles.totValue}>{data.pricing.subtotal.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          {data.pricing.discount > 0 && (
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>Remise globale</Text>
              <Text style={[styles.totValue, { color: '#ef4444' }]}>-{data.pricing.discount.toLocaleString('fr-FR')} FCFA</Text>
            </View>
          )}
          <View style={styles.totRowFinal}>
            <Text style={styles.totLabelFinal}>TOTAL PAYÉ</Text>
            <Text style={styles.totValueFinal}>{data.pricing.total.toLocaleString('fr-FR')} FCFA</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Réf commande: {data.orderId.split('-')[0].toUpperCase()}</Text>
          <Text style={styles.footerText}>Généré automatiquement par PDV Pro</Text>
        </View>
      </Page>
    </Document>
  )
}
