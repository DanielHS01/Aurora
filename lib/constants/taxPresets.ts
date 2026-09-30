// lib/constants/taxPresets.ts

export type TaxPresetValue = '' | 'inc_8' | 'iva_19' | 'iva_5' | 'exento';

export const TAX_PRESETS: {
  value: TaxPresetValue;
  label: string;
  taxCode: string | null;
  taxRate: number | null;
  taxIsExcluded: boolean;
}[] = [
  {
    value: '',
    label: 'Usar el del negocio (recomendado)',
    taxCode: null,
    taxRate: null,
    taxIsExcluded: false,
  },
  { value: 'inc_8', label: 'INC 8% (impoconsumo)', taxCode: '04', taxRate: 8, taxIsExcluded: false },
  { value: 'iva_19', label: 'IVA 19%', taxCode: '01', taxRate: 19, taxIsExcluded: false },
  { value: 'iva_5', label: 'IVA 5%', taxCode: '01', taxRate: 5, taxIsExcluded: false },
  {
    // PENDIENTE DE CONFIRMAR con Factus: misma convención usada como
    // fallback en lib/factus/invoicing.ts (IVA 0%, excluido).
    value: 'exento',
    label: 'Exento (sin impuesto)',
    taxCode: '01',
    taxRate: 0,
    taxIsExcluded: true,
  },
];

export function taxPresetFromProduct(product: {
  tax_code: string | null;
  tax_rate: number | null;
  tax_is_excluded: boolean | null;
}): TaxPresetValue {
  if (!product.tax_code || product.tax_rate === null) return '';
  const match = TAX_PRESETS.find(
    (p) => p.taxCode === product.tax_code && p.taxRate === product.tax_rate,
  );
  return match?.value ?? '';
}