import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getCurrentUserBusiness } from '@/lib/queries/businesses'
import { getInvoiceById } from '@/lib/queries/payments'
import InvoicePdfDocument from '@/components/dashboard/invoices/InvoicePdfDocument'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params
  const business = await getCurrentUserBusiness()

  if (!business) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const invoice = await getInvoiceById(invoiceId)

  if (!invoice || invoice.business_id !== business.id) {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  }

  const buffer = await renderToBuffer(
    InvoicePdfDocument({ businessName: business.name, invoice })
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      // "inline" en vez de "attachment": el navegador muestra el PDF
      // directamente en vez de forzar la descarga a disco.
      'Content-Disposition': `inline; filename="factura-${invoice.invoice_number ?? invoice.id}.pdf"`,
    },
  })
}