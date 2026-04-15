export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { Document, Page, Text, View, StyleSheet, renderToStream, Image } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

const styles = StyleSheet.create({
  page: { 
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    color: "#1a1a1a"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    borderBottom: "2 solid #0F7A60",
    paddingBottom: 20
  },
  headerLeft: {
    maxWidth: "50%",
  },
  headerRight: {
    textAlign: "right",
    maxWidth: "50%",
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
    borderRadius: 8
  },
  storeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F7A60",
    marginBottom: 4
  },
  storeLabel: {
    fontSize: 10,
    color: "#666666"
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 2,
    color: "#1a1a1a"
  },
  invoiceMeta: {
    fontSize: 10,
    color: "#444444",
    marginBottom: 4
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40
  },
  billTo: {
    maxWidth: "40%",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888888",
    marginBottom: 8,
    textTransform: "uppercase"
  },
  clientText: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "demibold"
  },
  table: {
    width: "100%",
    marginBottom: 40
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    padding: 10,
    borderBottom: "1 solid #e4e4e7"
  },
  tableHeaderCol: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#52525b",
    textTransform: "uppercase"
  },
  tableRow: {
    flexDirection: "row",
    padding: "12 10",
    borderBottom: "1 solid #f4f4f5"
  },
  tableCell: {
    fontSize: 11,
    color: "#3f3f46"
  },
  colDesc: { width: "40%" },
  colType: { width: "20%" },
  colQty: { width: "10%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  summaryWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10
  },
  summarySection: {
    width: "40%"
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  summaryLabel: {
    fontSize: 11,
    color: "#52525b"
  },
  summaryValue: {
    fontSize: 11,
    color: "#1a1a1a",
    textAlign: "right"
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
    borderTop: "2 solid #0F7A60",
  },
  summaryLabelTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F7A60"
  },
  summaryValueTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F7A60",
    textAlign: "right"
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTop: "1 solid #e4e4e7",
    paddingTop: 20
  },
  footerText: {
    fontSize: 9,
    color: "#aaaaaa",
    marginBottom: 4
  }
});

const formatCFA = (val: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(val).replace('XOF', 'FCFA');
};

type InvoiceOrderProps = {
  id: string;
  buyer_id?: string | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_email?: string | null;
  delivery_address?: string | null;
  status: string;
  order_type: string;
  quantity: number;
  subtotal: number;
  delivery_fee: number;
  promo_discount: number;
  total: number;
  created_at: Date;
  product?: { name: string } | null;
  variant?: { value_1?: string | null; value_2?: string | null } | null;
  store: { name: string; logo_url?: string | null };
};

const InvoiceDocument = ({ order }: { order: InvoiceOrderProps }) => {
  const { id, product, variant, store, created_at } = order;
  const shortId = id.split("-")[0].toUpperCase();
  const dateStr = new Date(created_at).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {store.logo_url && <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={store.logo_url} style={styles.logo} />}
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeLabel}>Partenaire certifié Yayyam</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>FACTURE / REÇU</Text>
            <Text style={styles.invoiceMeta}>N° Commande : {shortId}</Text>
            <Text style={styles.invoiceMeta}>Date : {dateStr}</Text>
            <Text style={styles.invoiceMeta}>Statut : Payé / {order.status === 'delivered' ? 'Livré' : 'Confirmé'}</Text>
          </View>
        </View>

        {/* Client details */}
        <View style={styles.section}>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Facturé à</Text>
            <Text style={styles.clientText}>{order.buyer_name || "Client"}</Text>
            {order.buyer_phone && <Text style={styles.clientText}>{order.buyer_phone}</Text>}
            {order.buyer_email && <Text style={styles.clientText}>{order.buyer_email}</Text>}
            {order.delivery_address && (
              <Text style={{ ...styles.clientText, fontSize: 10, color: "#666", marginTop: 5 }}>
                {order.delivery_address}
              </Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCol, styles.colType]}>Type</Text>
            <Text style={[styles.tableHeaderCol, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderCol, styles.colPrice]}>P.U.</Text>
            <Text style={[styles.tableHeaderCol, styles.colTotal]}>Total</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={styles.tableCell}>{product?.name || "Produit divers"}</Text>
              {variant && (
                <Text style={{ fontSize: 9, color: "#888", marginTop: 4 }}>
                  Variante : {variant.value_1} {variant.value_2 ? ` / ${variant.value_2}` : ''}
                </Text>
              )}
            </View>
            <Text style={[styles.tableCell, styles.colType]}>
              {order.order_type === "digital" ? "Numérique" : "Physique"}
            </Text>
            <Text style={[styles.tableCell, styles.colQty]}>{order.quantity}</Text>
            <Text style={[styles.tableCell, styles.colPrice]}>{formatCFA(order.subtotal / (order.quantity || 1))}</Text>
            <Text style={[styles.tableCell, styles.colTotal]}>{formatCFA(order.subtotal)}</Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.summaryWrapper}>
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{formatCFA(order.subtotal)}</Text>
            </View>
            
            {order.delivery_fee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frais de livraison</Text>
                <Text style={styles.summaryValue}>{formatCFA(order.delivery_fee)}</Text>
              </View>
            )}
            
            {order.promo_discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remise (Code Promo)</Text>
                <Text style={styles.summaryValue}>- {formatCFA(order.promo_discount)}</Text>
              </View>
            )}

            <View style={styles.summaryRowTotal}>
              <Text style={styles.summaryLabelTotal}>Total TTC</Text>
              <Text style={styles.summaryValueTotal}>{formatCFA(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Merci pour votre confiance avec {store.name} !</Text>
          <Text style={styles.footerText}>Facture générée automatiquement et propulsée par l'infrastructure sécurisée de Yayyam.</Text>
          <Text style={styles.footerText}>Pas de TVA applicable au régime du vendeur.</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupération de l'email depuis User table
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin.from('User').select('email').eq('id', user.id).single();

    // Fetch the order with Prisma
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        variant: true,
        store: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Sécurité: vérifier que l'utilisateur est bien l'acheteur (soit par ID, soit par email)
    if (order.buyer_id !== user.id && (!profile?.email || order.buyer_email !== profile.email)) {
      // Allow vendor or admin to download as well, just in case (optional feature). Exclude for now strictly client side.
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const stream = await renderToStream(<InvoiceDocument order={order} />);
    
    // Convert Node stream to Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture_${orderId.split("-")[0].toUpperCase()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération du PDF", details: error.message }, { status: 500 });
  }
}
