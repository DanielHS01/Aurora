// lib/factus/mapOrderToInvoice.ts
//
// Convierte un pedido de Aurora en el payload que espera Factus.
//
// IMPORTANTE: los precios en Aurora (el precio del menú, unit_price)
// YA INCLUYEN el impuesto — es el precio final que paga el cliente
// (ej. "$35.000" en la carta = $35.000 exactos en la cuenta). Factus,
// en cambio, espera el precio BASE sin impuestos en `items[].price`,
// y calcula el impuesto él mismo encima. Por eso aquí se hace la
// conversión inversa: precio_base = precio_con_impuesto / (1 + tasa/100).
// Si no se hace esto, Factus calcula un total más alto del que
// realmente se cobró y rechaza la factura (bug real que ya pasó dos
// veces: $75.000→$89.250 con 19%, y $35.000→$37.800 con 8%).

import type { FactusInvoicePayload } from './client';

type OrderForInvoice = {
  id: string;
  customer: {
    identification?: string | null;
    identification_document_code?: string | null;
    legal_organization_code?: string | null;
    names?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  items: Array<{
    product_name: string;
    product_id: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    unit_measure_code: string;
    standard_code: string;
    tax_code: string;
    tax_rate: number;
    tax_is_excluded: boolean;
  }>;
  payments: Array<{
    method: 'cash' | 'card' | 'transfer' | 'online' | 'mixed';
    amount: number;
  }>;
  businessMunicipalityCode: string | null;
};

const PAYMENT_FORM_CONTADO = '1';
const PAYMENT_METHOD_EFECTIVO = '10';

// PENDIENTE DE CONFIRMAR con Factus: no probado todavía para
// tarjeta/transferencia — "42" es la mejor suposición según la skill.
const PAYMENT_METHOD_FALLBACK = '42';

function mapPaymentMethod(method: OrderForInvoice['payments'][number]['method']): string {
  if (method === 'cash') return PAYMENT_METHOD_EFECTIVO;
  return PAYMENT_METHOD_FALLBACK;
}

// Convención estándar colombiana para ventas sin identificar al
// cliente. PENDIENTE DE CONFIRMAR directamente con Factus.
const CONSUMIDOR_FINAL = {
  identification_document_code: '13',
  identification: '222222222222',
  legal_organization_code: '2',
  names: 'Consumidor final',
  tribute_code: 'ZZ',
  responsibilities: ['R-99-PN'],
  country_code: 'CO',
};

export function mapOrderToFactusInvoice(order: OrderForInvoice): FactusInvoicePayload {
  let computedGrandTotal = 0;

  const items: FactusInvoicePayload['items'] = order.items.map((item) => {
    // El precio del menú (unit_price) incluye el impuesto — se
    // convierte al precio base que Factus espera, salvo que el
    // producto esté marcado como excluido de impuestos (en cuyo caso
    // el precio ya es el precio base, no hay nada que restar).
    const basePrice = item.tax_is_excluded
      ? item.unit_price
      : item.unit_price / (1 + item.tax_rate / 100);

    const roundedBasePrice = Math.round(basePrice * 100) / 100;

    // Redondeo en DOS pasos separados, replicando la convención
    // estándar de facturación electrónica (y muy probablemente la de
    // Factus): primero se redondea el valor base del ítem
    // (taxable_amount), y el impuesto se calcula y redondea POR
    // SEPARADO sobre ese valor ya redondeado — no se multiplica todo
    // de una vez y se redondea al final, porque eso puede dar un
    // resultado distinto por 1-2 centavos.
    const taxableAmount = Math.round(roundedBasePrice * item.quantity * 100) / 100;
    const taxAmount = item.tax_is_excluded
      ? 0
      : Math.round(taxableAmount * (item.tax_rate / 100) * 100) / 100;
    const lineTotal = taxableAmount + taxAmount;

    computedGrandTotal += lineTotal;

    return {
      code_reference: item.product_id ?? `ITEM-${order.id}-${item.product_name}`,
      name: item.product_name,
      quantity: item.quantity.toFixed(2),
      price: roundedBasePrice.toFixed(2),
      discount_rate: '0.00',
      unit_measure_code: item.unit_measure_code,
      standard_code: item.standard_code,
      taxes: [
        {
          code: item.tax_code,
          rate: item.tax_rate.toFixed(2),
          is_excluded: item.tax_is_excluded,
        },
      ],
    };
  });

  const actualPaidTotal = order.payments.reduce((sum, p) => sum + p.amount, 0);

  // En vez de confiar en cash_rounding_amount (no se comportó como
  // documentado — Factus siguió comparando contra el total calculado
  // de los ítems, ignorando el ajuste), se corrige de raíz: el monto
  // que se reporta como pagado debe coincidir EXACTO con lo que Factus
  // va a calcular por su cuenta a partir de los ítems, nunca con el
  // monto "real" cobrado — la diferencia de uno o dos centavos entre
  // ambos es inevitable por el redondeo de cada ítem por separado, y
  // económicamente irrelevante.
  //
  // Se ajustan los payment_details preservando cada monto real, EXCEPTO
  // el último, al que se le suma/resta la diferencia de centavos — así
  // la suma total siempre cuadra exacto, incluso con pagos divididos
  // entre varios medios.
  const centsDiff = Math.round((computedGrandTotal - actualPaidTotal) * 100) / 100;

  const payment_details: FactusInvoicePayload['payment_details'] = order.payments.map(
    (p, index) => {
      const isLast = index === order.payments.length - 1;
      const amount = isLast ? p.amount + centsDiff : p.amount;
      return {
        payment_form: PAYMENT_FORM_CONTADO,
        payment_method_code: mapPaymentMethod(p.method),
        amount: amount.toFixed(2),
      };
    },
  );

  const customer: FactusInvoicePayload['customer'] = order.customer?.identification
    ? {
        identification_document_code:
          order.customer.identification_document_code ?? '13',
        identification: order.customer.identification,
        legal_organization_code: order.customer.legal_organization_code ?? '2',
        names: order.customer.names ?? undefined,
        company: order.customer.company ?? undefined,
        email: order.customer.email ?? undefined,
        phone: order.customer.phone ?? undefined,
        address: order.customer.address ?? undefined,
        tribute_code: 'ZZ',
        responsibilities: ['R-99-PN'],
        country_code: 'CO',
        municipality_code: order.businessMunicipalityCode ?? undefined,
      }
    : {
        ...CONSUMIDOR_FINAL,
        municipality_code: order.businessMunicipalityCode ?? undefined,
      };

  return {
    reference_code: order.id,
    document: '01',
    operation_type: '10',
    payment_details,
    customer,
    items,
  };
}