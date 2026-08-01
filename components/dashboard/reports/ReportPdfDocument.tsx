import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type {
  RevenueSummary,
  PeriodComparison,
  TopProduct,
  HourlyRevenue,
  DayOfWeekRevenue,
} from '@/lib/queries/reports';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    borderBottom: '1 solid #ddd',
    paddingBottom: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  comparisonRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  comparisonBox: {
    flex: 1,
    padding: 10,
    border: '1 solid #eee',
    borderRadius: 6,
  },
  comparisonLabel: { fontSize: 9, color: '#888', marginBottom: 4 },
  comparisonValue: { fontSize: 14, fontWeight: 'bold' },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '1 solid #f0f0f0',
  },
});

function formatCOP(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CO')}`;
}

interface ReportPdfDocumentProps {
  businessName: string;
  revenueSummary: RevenueSummary;
  dayComparison: PeriodComparison;
  weekComparison: PeriodComparison;
  monthComparison: PeriodComparison;
  topProducts: TopProduct[];
  hourlyRevenue: HourlyRevenue[];
  dayOfWeekRevenue: DayOfWeekRevenue[];
}

export default function ReportPdfDocument({
  businessName,
  revenueSummary,
  dayComparison,
  weekComparison,
  monthComparison,
  topProducts,
  hourlyRevenue,
  dayOfWeekRevenue,
}: ReportPdfDocumentProps) {
  const bestHour = [...hourlyRevenue].sort((a, b) => b.revenue - a.revenue)[0];
  const bestDay = [...dayOfWeekRevenue].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte de negocio — {businessName}</Text>
        <Text style={styles.subtitle}>
          Generado el {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        <Text style={styles.sectionTitle}>Resumen general</Text>
        <View style={styles.row}>
          <Text>Ingresos hoy</Text>
          <Text>{formatCOP(revenueSummary.today)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Últimos 7 días</Text>
          <Text>{formatCOP(revenueSummary.last7Days)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Este mes</Text>
          <Text>{formatCOP(revenueSummary.thisMonth)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Comparación de periodos</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>Hoy vs. ayer</Text>
            <Text style={styles.comparisonValue}>{formatCOP(dayComparison.current.revenue)}</Text>
            <Text style={{ fontSize: 8, color: '#888' }}>
              {dayComparison.revenueChangePercent !== null
                ? `${dayComparison.revenueChangePercent >= 0 ? '+' : ''}${dayComparison.revenueChangePercent.toFixed(1)}%`
                : 'Sin datos previos'}
            </Text>
          </View>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>Semana vs. anterior</Text>
            <Text style={styles.comparisonValue}>{formatCOP(weekComparison.current.revenue)}</Text>
            <Text style={{ fontSize: 8, color: '#888' }}>
              {weekComparison.revenueChangePercent !== null
                ? `${weekComparison.revenueChangePercent >= 0 ? '+' : ''}${weekComparison.revenueChangePercent.toFixed(1)}%`
                : 'Sin datos previos'}
            </Text>
          </View>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>Mes vs. anterior</Text>
            <Text style={styles.comparisonValue}>{formatCOP(monthComparison.current.revenue)}</Text>
            <Text style={{ fontSize: 8, color: '#888' }}>
              {monthComparison.revenueChangePercent !== null
                ? `${monthComparison.revenueChangePercent >= 0 ? '+' : ''}${monthComparison.revenueChangePercent.toFixed(1)}%`
                : 'Sin datos previos'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Platos más pedidos (últimos 30 días)</Text>
        {topProducts.map((p, i) => (
          <View key={p.productName} style={styles.tableRow}>
            <Text>{i + 1}. {p.productName}</Text>
            <Text>{p.quantitySold} vendidos · {formatCOP(p.revenue)}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Patrones de venta</Text>
        <View style={styles.row}>
          <Text>Hora de mayor venta</Text>
          <Text>{bestHour ? `${bestHour.hour}h — ${formatCOP(bestHour.revenue)}` : '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Día de mayor venta</Text>
          <Text>{bestDay ? `${bestDay.dayName} — ${formatCOP(bestDay.revenue)}` : '—'}</Text>
        </View>
      </Page>
    </Document>
  );
}