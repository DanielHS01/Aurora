const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC-5, sin horario de verano

function toColombiaDayStart(isoString: string): number {
  const shifted = new Date(new Date(isoString).getTime() - COLOMBIA_OFFSET_MS);
  return Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
}

/**
 * Diferencia en DÍAS CALENDARIO (hora Colombia) entre dos timestamps,
 * ignorando la hora exacta — "mañana" siempre cuenta como 1 día,
 * sin importar si faltan 2 horas o 23 horas para esa fecha.
 */
export function daysBetweenColombiaDates(
  fromISO: string,
  toISO: string,
): number {
  return Math.round(
    (toColombiaDayStart(toISO) - toColombiaDayStart(fromISO)) / 86400000,
  );
}

export function isColombiaDateOnOrAfter(
  nowISO: string,
  targetISO: string,
): boolean {
  return toColombiaDayStart(nowISO) >= toColombiaDayStart(targetISO);
}
