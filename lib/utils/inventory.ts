export type InventoryUnit = 'g' | 'ml' | 'und'

export const UNIT_LABEL: Record<InventoryUnit, string> = {
  g: 'Gramos (g)',
  ml: 'Mililitros (ml)',
  und: 'Unidades',
}

function trim(n: number): string {
  return n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
}

export function formatQuantity(value: number, unit: InventoryUnit): string {
  if (unit === 'g' && value >= 1000) return `${trim(value / 1000)} kg`
  if (unit === 'ml' && value >= 1000) return `${trim(value / 1000)} l`
  return `${trim(value)} ${unit}`
}

/** Unidades en las que se puede digitar una cantidad, con su factor hacia la unidad base. */
export function inputUnitsFor(unit: InventoryUnit): { label: string; factor: number }[] {
  if (unit === 'g') return [{ label: 'g', factor: 1 }, { label: 'kg', factor: 1000 }]
  if (unit === 'ml') return [{ label: 'ml', factor: 1 }, { label: 'l', factor: 1000 }]
  return [{ label: 'und', factor: 1 }]
}