import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceWithItems } from '@/lib/queries/payments';
import { formatDateTimeCO } from '@/lib/utils/formatDate';

// 48mm de área imprimible (dentro de un rollo térmico de 58mm) ≈ 136pt.
// El alto se calcula dinámicamente según la cantidad de ítems, para que
// la impresora térmica corte el papel justo donde termina el contenido.
const RECEIPT_WIDTH_PT = 136;

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 7,
    fontFamily: 'Helvetica',
  },
  center: { textAlign: 'center' },
  businessName: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  invoiceTitle: { fontSize: 7, textAlign: 'center', marginTop: 2 },
  dashedLine: {
    borderBottom: '1 dashed #000',
    marginVertical: 5,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemBlock: { marginBottom: 3 },
  itemName: { fontSize: 7 },
  itemDetail: { flexDirection: 'row', justifyContent: 'space-between' },
  totals: { marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  grandTotal: { fontSize: 8, fontWeight: 'bold' },
  footer: { marginTop: 8, fontSize: 6, textAlign: 'center' },
});

function formatCOP(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CO')}`;
}

interface InvoicePdfDocumentProps {
  businessName: string;
  invoice: InvoiceWithItems;
}

export default function InvoicePdfDocument({
  businessName,
  invoice,
}: InvoicePdfDocumentProps) {
  const issuedDate = invoice.issued_at ?? invoice.created_at;

  // Alto dinámico: base fija (encabezado + totales + pie) + una fila
  // por cada ítem — así el "papel" solo mide lo que realmente necesita.
  const baseHeight = 150;
  const rowHeight = 16;
  const pageHeight = baseHeight + invoice.items.length * rowHeight;

  return (
    <Document>
      <Page size={[RECEIPT_WIDTH_PT, pageHeight]} style={styles.page}>
        <Text style={styles.businessName}>{businessName}</Text>
        <Text style={styles.invoiceTitle}>
          Factura #{invoice.invoice_number ?? invoice.id.slice(0, 8)}
        </Text>
        <Text style={[styles.invoiceTitle, { marginTop: 1 }]}>
          {formatDateTimeCO(issuedDate)}
        </Text>

        <View style={styles.dashedLine} />

        {invoice.items.map((item) => (
          <View key={item.id} style={styles.itemBlock}>
            <Text style={styles.itemName}>{item.description}</Text>
            <View style={styles.itemDetail}>
              <Text>
                {item.quantity} x {formatCOP(item.unit_price ?? 0)}
              </Text>
              <Text>{formatCOP(item.total_price ?? 0)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.dashedLine} />

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatCOP(invoice.subtotal ?? 0)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Impuestos</Text>
            <Text>{formatCOP(invoice.tax_amount ?? 0)}</Text>
          </View>
          <View style={styles.dashedLine} />
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>TOTAL</Text>
            <Text>{formatCOP(invoice.total ?? 0)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Documento generado por Aurora{'\n'}No constituye factura electrónica DIAN
        </Text>
      </Page>
    </Document>
  );
}