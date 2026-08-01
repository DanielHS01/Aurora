import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getCurrentUserBusiness } from '@/lib/queries/businesses'
import {
  getRevenueSummary,
  getPeriodComparison,
  getTopProducts,
  getRevenueByHour,
  getRevenueByDayOfWeek,
} from '@/lib/queries/reports'
import ReportPdfDocument from '@/components/dashboard/reports/ReportPdfDocument'

export async function GET() {
  const business = await getCurrentUserBusiness()
  if (!business) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const [revenueSummary, dayComparison, weekComparison, monthComparison, topProducts, hourlyRevenue, dayOfWeekRevenue] =
    await Promise.all([
      getRevenueSummary(business.id),
      getPeriodComparison(business.id, 'day'),
      getPeriodComparison(business.id, 'week'),
      getPeriodComparison(business.id, 'month'),
      getTopProducts(business.id, 30, 10),
      getRevenueByHour(business.id, 30),
      getRevenueByDayOfWeek(business.id, 30),
    ])

const buffer = await renderToBuffer(
  ReportPdfDocument({
    businessName: business.name,
    revenueSummary,
    dayComparison,
    weekComparison,
    monthComparison,
    topProducts,
    hourlyRevenue,
    dayOfWeekRevenue,
  })
)

return new NextResponse(new Uint8Array(buffer), {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="reporte-${new Date().toISOString().slice(0, 10)}.pdf"`,
  },
})}