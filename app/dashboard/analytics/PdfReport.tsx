'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { AnalyticsData } from '@/lib/analytics/analyticsActions'

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '1px solid #eeeeee', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 20, marginBottom: 10 },
  kpiContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  kpiBox: { width: '23%', padding: 10, backgroundColor: '#f9fafb', borderRadius: 5 },
  kpiLabel: { fontSize: 10, color: '#6b7280', marginBottom: 5 },
  kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  kpiOrange: { fontSize: 16, fontWeight: 'bold', color: '#f97316' },
  table: { width: '100%', border: '1px solid #e5e7eb', borderRadius: 5, marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e5e7eb', padding: 8 },
  tableHeader: { backgroundColor: '#f9fafb' },
  col1: { width: '60%', fontSize: 10, color: '#374151' },
  col2: { width: '20%', fontSize: 10, color: '#374151', textAlign: 'right' },
  col3: { width: '20%', fontSize: 10, color: '#374151', textAlign: 'right' },
  tableCellHeader: { fontWeight: 'bold', color: '#6b7280' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, fontSize: 10, color: '#9ca3af', textAlign: 'center', borderTop: '1px solid #eeeeee', paddingTop: 10 }
})

interface Props {
  data: AnalyticsData
  storeName: string
  days: number
}

export default function PdfReport({ data, storeName, days }: Props) {
  const { kpis, topProducts, sources, funnel } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Rapport Analytics : {storeName}</Text>
          <Text style={styles.subtitle}>Généré le {new Date().toLocaleDateString('fr-FR')} - Période: {days} derniers jours</Text>
        </View>

        {/* KPIs */}
        <Text style={styles.sectionTitle}>Chiffres Clés (KPIs)</Text>
        <View style={styles.kpiContainer}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Vues Globales</Text>
            <Text style={styles.kpiValue}>{kpis.views.toLocaleString('fr-FR')}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Ventes</Text>
            <Text style={styles.kpiValue}>{kpis.sales.toLocaleString('fr-FR')}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Revenus Nets</Text>
            <Text style={styles.kpiOrange}>{kpis.revenue.toLocaleString('fr-FR')} F</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Conversion</Text>
            <Text style={styles.kpiValue}>{kpis.conversion.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Funnel */}
        <Text style={styles.sectionTitle}>Entonnoir de Conversion</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.col1, styles.tableCellHeader]}>Étape</Text>
            <Text style={[styles.col2, styles.tableCellHeader]}>Volume</Text>
            <Text style={[styles.col3, styles.tableCellHeader]}>%</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>1. Vues de page</Text>
            <Text style={styles.col2}>{funnel.views}</Text>
            <Text style={styles.col3}>100%</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>2. Checkout initiés</Text>
            <Text style={styles.col2}>{funnel.checkouts}</Text>
            <Text style={styles.col3}>{funnel.views > 0 ? ((funnel.checkouts/funnel.views)*100).toFixed(1) : 0}%</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>3. Achats terminés</Text>
            <Text style={styles.col2}>{funnel.purchases}</Text>
            <Text style={styles.col3}>{funnel.checkouts > 0 ? ((funnel.purchases/funnel.checkouts)*100).toFixed(1) : 0}%</Text>
          </View>
        </View>

        {/* Top Products */}
        <Text style={styles.sectionTitle}>Top Produits (Revenus)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.col1, styles.tableCellHeader]}>Produit</Text>
            <Text style={[styles.col2, styles.tableCellHeader]}>Ventes</Text>
            <Text style={[styles.col3, styles.tableCellHeader]}>Revenus</Text>
          </View>
          {topProducts.length === 0 && (
            <View style={styles.tableRow}><Text style={styles.col1}>Aucun produit vendu.</Text></View>
          )}
          {topProducts.map((p, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.col1}>{p.name}</Text>
              <Text style={styles.col2}>{p.sales}</Text>
              <Text style={styles.col3}>{p.revenue.toLocaleString('fr-FR')} F</Text>
            </View>
          ))}
        </View>

        {/* Sources */}
        <Text style={styles.sectionTitle}>Sources d&apos;Acquisition</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.col1, styles.tableCellHeader]}>Source</Text>
            <Text style={[styles.col2, styles.tableCellHeader]}>Clics</Text>
            <Text style={styles.col3}></Text>
          </View>
          {sources.length === 0 && (
            <View style={styles.tableRow}><Text style={styles.col1}>Données insuffisantes.</Text></View>
          )}
          {sources.map((s, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.col1}>{s.name}</Text>
              <Text style={styles.col2}>{s.value}</Text>
              <Text style={styles.col3}></Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Document généré automatiquement par PDV Pro - www.pdvpro.com</Text>
      </Page>
    </Document>
  )
}
